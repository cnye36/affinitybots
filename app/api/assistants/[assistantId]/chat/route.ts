import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Client } from "@langchain/langgraph-sdk";
import { rateLimiter } from "@/lib/rateLimiting";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ assistantId: string }> }
) {
  try {
    const { assistantId } = await props.params;
    const supabase = await createClient();
    
    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has access to this assistant
    const { data: userAssistant, error: userAssistantError } = await supabase
      .from("user_assistants")
      .select("assistant_id")
      .eq("user_id", user.id)
      .eq("assistant_id", assistantId)
      .single();

    if (userAssistantError || !userAssistant) {
      // Fallback: check if assistant exists and user is owner
      const { data: assistant, error: assistantError } = await supabase
        .from("assistant")
        .select("*")
        .eq("assistant_id", assistantId)
        .eq("metadata->>owner_id", user.id)
        .single();

      if (assistantError || !assistant) {
        return NextResponse.json(
          { error: "Assistant not found or access denied" },
          { status: 404 }
        );
      }
    }

    const { threadId, messages } = await request.json();

    if (!threadId || !messages) {
      return NextResponse.json(
        { error: "threadId and messages are required" },
        { status: 400 }
      );
    }

    // Create LangGraph client
    const client = new Client({
      apiUrl: process.env.LANGGRAPH_API_URL!,
      apiKey: process.env.LANGSMITH_API_KEY!,
    });

    // Stream the response with proper user context using SDK (yields {event, data})
    const runStream = await client.runs.stream(
      threadId,
      assistantId,
      {
        input: { messages },
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
        streamMode: "messages",
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

    // Convert AsyncIterable to proper SSE
    const encoder = new TextEncoder();
    const debugStream = process.env.RATE_LIMIT_DEBUG === "1";
    const logFullResponse = process.env.LOG_FULL_RESPONSE === "1";
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const allChunks: any[] = [];
          for await (const chunk of runStream as any) {
            if (logFullResponse) {
              allChunks.push(chunk);
            }
            const eventName = chunk?.event;
            const data = chunk?.data ?? chunk;
            if (eventName) controller.enqueue(encoder.encode(`event: ${eventName}\n`));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

            // Capture token usage if provided by the provider/SDK
            try {
              if (debugStream && typeof eventName === "string") {
                console.debug("[chat stream] event:", eventName, "data preview:", JSON.stringify(data).slice(0, 500));
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
            } catch (e) {
              console.warn("Usage parse error:", e);
            }
          }

          // Log the complete response for analysis
          if (logFullResponse) {
            console.log("=== FULL LANGGRAPH RESPONSE ===");
            console.log(JSON.stringify(allChunks, null, 2));
            console.log("=== END FULL RESPONSE ===");
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
                model: "gpt-5-2025-08-07",
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
