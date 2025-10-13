import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Client } from "@langchain/langgraph-sdk";
import { rateLimiter } from "@/lib/rateLimiting";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId: assistantId } = await props.params;
    console.log(`[CHAT API] Processing chat request for assistant: ${assistantId}`);
    
    const supabase = await createClient();
    
    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log(`[CHAT API] No user found - unauthorized`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`[CHAT API] User authenticated: ${user.id}`);

    // Verify user has access to this assistant
    console.log(`[CHAT API] Checking user_assistants table for user ${user.id} and assistant ${assistantId}`);
    const { data: userAssistant, error: userAssistantError } = await supabase
      .from("user_assistants")
      .select("assistant_id")
      .eq("user_id", user.id)
      .eq("assistant_id", assistantId)
      .single();

    console.log(`[CHAT API] user_assistants query result:`, { userAssistant, userAssistantError });

    if (userAssistantError || !userAssistant) {
      console.log(`[CHAT API] user_assistants check failed, trying assistant table fallback`);
      // Fallback: check if assistant exists and user is owner
      const { data: assistant, error: assistantError } = await supabase
        .from("assistant")
        .select("*")
        .eq("assistant_id", assistantId)
        .eq("metadata->>owner_id", user.id)
        .single();

      console.log(`[CHAT API] assistant table query result:`, { assistant, assistantError });

      if (assistantError || !assistant) {
        console.log(`[CHAT API] Both user_assistants and assistant checks failed - access denied`);
        return NextResponse.json(
          { error: "Assistant not found or access denied" },
          { status: 404 }
        );
      }
    }

    const { threadId, messages, attachments } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    // Create LangGraph client
    const client = new Client({
      apiUrl: process.env.LANGGRAPH_API_URL!,
      apiKey: process.env.LANGSMITH_API_KEY!,
    });

    // Convert messages to LangGraph format
    const langgraphMessages = messages.map((msg: any) => ({
      type: msg.role === "user" ? "human" : msg.role === "assistant" ? "ai" : "system",
      content: msg.content,
    }));

    // Stream the response with proper user context using SDK (yields {event, data})
    const runStream = await client.runs.stream(
      threadId || "temp", // Use temp thread if none provided
      assistantId,
      {
        input: { messages: langgraphMessages },
        metadata: {
          user_id: user.id,
          assistant_id: assistantId,
          thread_id: threadId,
        },
        config: {
          configurable: {
            user_id: user.id,
            assistant_id: assistantId,
            thread_id: threadId,
          },
        },
        interruptBefore: ["tools"],
        streamMode: ["messages"],
      }
    );

    // Prepare usage tracking helpers
    const estimatedInputTokens = Array.isArray(messages)
      ? messages.reduce((sum: number, m: any) => {
          const c = typeof m?.content === "string" ? m.content : JSON.stringify(m?.content ?? "");
          return sum + Math.ceil(c.length / 4);
        }, 0)
      : 0;
    let inputTokensFromStream = 0;
    let outputTokensFromStream = 0;
    let sawUsageMetadata = false;
    let outputCharsEstimate = 0;
    let pendingAssistantMessageId: string | null = null;

    // Convert AsyncIterable to proper SSE
    const encoder = new TextEncoder();
    const debugStream = process.env.RATE_LIMIT_DEBUG === "1";
    const logFullResponse = process.env.LOG_FULL_RESPONSE === "1";
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send a test event to verify streaming is working
          controller.enqueue(encoder.encode(`event: test\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ message: "Stream started" })}\n\n`));
          
          const allChunks: any[] = [];
          for await (const chunk of runStream as any) {
            const eventName = typeof chunk?.event === "string" ? chunk.event : "";
            let data = chunk?.data ?? chunk;
            
            // Debug: Log all events being sent
            console.log(`[API STREAM] Event: ${eventName}`, data);

            if (eventName === "messages" && Array.isArray(data) && data.length > 0) {
              const [messageCandidate] = data as Array<Record<string, unknown>>;
              const chunkType = messageCandidate?.type;
              if (chunkType === "AIMessageChunk") {
                const chunkId = messageCandidate?.id;
                pendingAssistantMessageId = typeof chunkId === "string" ? chunkId : null;
              } else if (chunkType !== undefined) {
                pendingAssistantMessageId = null;
              }
            }

            if (
              (eventName === "messages/partial" || eventName === "messages/complete") &&
              Array.isArray(data) &&
              pendingAssistantMessageId
            ) {
              data = (data as Array<unknown>).map((message) => {
                if (
                  message &&
                  typeof message === "object" &&
                  "type" in message &&
                  (message as { type?: unknown }).type === "ai"
                ) {
                  const typedMessage = message as Record<string, unknown>;
                  const existingId = typeof typedMessage.id === "string" ? typedMessage.id : undefined;
                  if (existingId !== pendingAssistantMessageId) {
                    return {
                      ...typedMessage,
                      id: pendingAssistantMessageId,
                    };
                  }
                }
                return message;
              });
            }

            if (eventName === "messages/complete") {
              pendingAssistantMessageId = null;
            }

            if (logFullResponse) {
              allChunks.push({ event: eventName, data });
            }

            if (eventName) controller.enqueue(encoder.encode(`event: ${eventName}\n`));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            
            // Force flush to ensure immediate streaming
            if (typeof controller.desiredSize === "number") {
              await new Promise(resolve => setTimeout(resolve, 0));
            }


            // Check for token usage in messages/complete event (where LangGraph provides final usage)
            if (typeof eventName === "string" && eventName === "messages/complete") {
              if (Array.isArray(data) && data.length > 0) {
                const message = data[0];
                const usage = 
                  message?.response_metadata?.usage ||
                  message?.usage_metadata ||
                  null;
                
                if (usage) {
                  const inTok = 
                    usage.prompt_tokens ?? 
                    usage.input_tokens ?? 
                    0;
                  const outTok = 
                    usage.completion_tokens ?? 
                    usage.output_tokens ?? 
                    0;
                  
                  if (Number.isFinite(inTok) && Number.isFinite(outTok)) {
                    inputTokensFromStream = Math.max(inputTokensFromStream, Number(inTok));
                    outputTokensFromStream = Math.max(outputTokensFromStream, Number(outTok));
                    sawUsageMetadata = true;
                    console.log(`[chat stream] Found usage in complete event: input=${inTok}, output=${outTok}`);
                  }
                }
              }
            }
            
            // Legacy metadata event parsing (fallback)
            if (typeof eventName === "string" && /metadata$/i.test(eventName)) {
              const usage =
                data?.usage ||
                data?.token_usage ||
                data?.usage_metadata ||
                data?.usageMetadata ||
                data?.message?.usage ||
                data?.response?.usage ||
                null;
              if (usage) {
                const inTok =
                  usage.input_tokens ??
                  usage.prompt_tokens ??
                  usage.inputTokens ??
                  usage.promptTokens ??
                  usage.total_input_tokens ?? 0;
                const outTok =
                  usage.output_tokens ??
                  usage.completion_tokens ??
                  usage.outputTokens ??
                  usage.completionTokens ??
                  usage.total_output_tokens ?? 0;
                if (Number.isFinite(inTok) || Number.isFinite(outTok)) {
                  inputTokensFromStream = Math.max(inputTokensFromStream, Number(inTok) || 0);
                  outputTokensFromStream = Math.max(outputTokensFromStream, Number(outTok) || 0);
                  sawUsageMetadata = true;
                }
              }
            }
            
            // Only count small token/delta text pieces as a fallback
            if (typeof eventName === "string" && /messages\/(delta|partial|token)/i.test(eventName)) {
              const deltaText =
                typeof (data?.delta as unknown) === "string"
                  ? (data.delta as string)
                  : typeof (data?.token as unknown) === "string"
                  ? (data.token as string)
                  : typeof (data?.text as unknown) === "string"
                  ? (data.text as string)
                  : "";
              outputCharsEstimate += deltaText.length;
            }
          
        }

          // Record usage best-effort after stream finishes
          try {
            const inputTokens = sawUsageMetadata ? inputTokensFromStream : estimatedInputTokens;
            const outputTokens = sawUsageMetadata ? outputTokensFromStream : Math.ceil(outputCharsEstimate / 4);
            console.log(`[chat stream] Final usage - input: ${inputTokens}, output: ${outputTokens}, sawMetadata: ${sawUsageMetadata}`);
            if (user?.id) {
              await rateLimiter.recordUsage({
                userId: user.id,
                inputTokens,
                outputTokens,
                timestamp: Date.now(),
                model: "gpt-5",
                sessionId: threadId,
              });
            }
          } catch (e) {
            console.error("Failed to record usage after stream:", e);
          }

          // Emit a lightweight rate limit updated event for clients to refresh UI once
          try {
            controller.enqueue(encoder.encode(`event: rate-limit\n` +
              `data: ${JSON.stringify({ type: "updated" })}\n\n`));
          } catch {}

          controller.close();
        } catch (error) {
          console.error("Error in chat stream:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
