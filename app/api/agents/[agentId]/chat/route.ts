import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Client } from "@langchain/langgraph-sdk";
import { rateLimiter } from "@/lib/rateLimiting";

export const runtime = "nodejs";

/**
 * Handle resume commands for tool approval interrupts
 */
async function handleResumeCommand(
  assistantId: string,
  threadId: string,
  resumeValue: any,
  userId: string
) {
  const client = new Client({
    apiUrl: process.env.LANGGRAPH_API_URL!,
    apiKey: process.env.LANGSMITH_API_KEY!,
  });

  const runStream = await client.runs.stream(
    threadId,
    assistantId,
    {
      command: { resume: resumeValue },
      metadata: {
        user_id: userId,
        assistant_id: assistantId,
        thread_id: threadId,
      },
      config: {
        configurable: {
          user_id: userId,
          assistant_id: assistantId,
          thread_id: threadId,
        },
      },
      interruptBefore: ["tools"],
      streamMode: ["messages"],
    }
  );

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of runStream as any) {
          const eventName = typeof chunk?.event === "string" ? chunk.event : "";
          const data = chunk?.data ?? chunk;
          const line = JSON.stringify({ event: eventName, data }) + "\n";
          controller.enqueue(encoder.encode(line));
        }
        controller.close();
      } catch (error) {
        console.error("Error in resume stream:", error);
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

/**
 * Simplified chat endpoint that streams LangGraph events directly to the client
 * without unnecessary SSE conversion. This reduces latency and complexity.
 */
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

    // Load the full assistant configuration to pass to the agent
    console.log(`[CHAT API] Loading assistant configuration for ${assistantId}`);
    const { data: assistantData, error: assistantError } = await supabase
      .from("assistant")
      .select("*")
      .eq("assistant_id", assistantId)
      .single();

    if (assistantError || !assistantData) {
      console.log(`[CHAT API] Failed to load assistant:`, assistantError);
      return NextResponse.json(
        { error: "Assistant not found" },
        { status: 404 }
      );
    }

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
      console.log(`[CHAT API] user_assistants check failed, checking if user is owner`);
      // Check if user is the owner
      const ownerId = assistantData.metadata?.owner_id;
      if (ownerId !== user.id) {
        console.log(`[CHAT API] Access denied - user ${user.id} is not owner ${ownerId}`);
        return NextResponse.json(
          { error: "Assistant not found or access denied" },
          { status: 404 }
        );
      }
    }

    console.log(`[CHAT API] Access verified for user ${user.id} to assistant ${assistantId}`);
    console.log(`[CHAT API] Assistant config:`, {
      knowledge_base: assistantData.config?.configurable?.knowledge_base,
      memory: assistantData.config?.configurable?.memory,
      enabled_mcp_servers: assistantData.config?.configurable?.enabled_mcp_servers
    });

    const { threadId, messages, attachments,command } = await request.json();

    // Handle resume commands (for tool approval)
    if (command?.resume) {
      console.log(`[CHAT API] Processing resume command for thread: ${threadId}`);
      return handleResumeCommand(assistantId, threadId, command.resume, user.id);
    }

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

    // Get the assistant's configurable settings
    const assistantConfig = assistantData.config?.configurable || {};
    
    // Merge assistant config with runtime context (user_id, assistant_id, thread_id)
    const fullConfig = {
      ...assistantConfig,
      user_id: user.id,
      assistant_id: assistantId,
      thread_id: threadId,
    };

    console.log(`[CHAT API] Streaming with config:`, {
      knowledge_base: fullConfig.knowledge_base,
      memory: fullConfig.memory,
      enabled_mcp_servers: fullConfig.enabled_mcp_servers
    });

    // Stream the response with proper user context using SDK (yields {event, data})
    // Using streamMode: ["messages-tuple"] to get token-by-token streaming
    const runStream = await client.runs.stream(
      threadId || null, // Let LangGraph create thread if none provided
      assistantId,
      {
        input: { messages: langgraphMessages },
        metadata: {
          user_id: user.id,
          assistant_id: assistantId,
          thread_id: threadId,
        },
        config: {
          configurable: fullConfig,
        },
        interruptBefore: ["tools"],
        streamMode: ["messages-tuple"],
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

    // Stream LangGraph events directly as newline-delimited JSON (simpler and faster)
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of runStream as any) {
            const eventName = typeof chunk?.event === "string" ? chunk.event : "";
            const data = chunk?.data ?? chunk;
            
            // Track usage metadata
            if (eventName === "messages/complete" && Array.isArray(data) && data.length > 0) {
              const message = data[0];
              const usage = message?.response_metadata?.usage || message?.usage_metadata;
              if (usage) {
                const inTok = usage.prompt_tokens ?? usage.input_tokens ?? 0;
                const outTok = usage.completion_tokens ?? usage.output_tokens ?? 0;
                if (Number.isFinite(inTok) && Number.isFinite(outTok)) {
                  inputTokensFromStream = inTok;
                  outputTokensFromStream = outTok;
                  sawUsageMetadata = true;
                }
              }
            }
            
            // Track output for estimation if no usage metadata
            if (/messages\/(delta|partial|token)/i.test(eventName)) {
              const deltaText = typeof data?.delta === "string" ? data.delta :
                                typeof data?.token === "string" ? data.token :
                                typeof data?.text === "string" ? data.text : "";
              outputCharsEstimate += deltaText.length;
            }

            // Stream the event as JSON
            const line = JSON.stringify({ event: eventName, data }) + "\n";
            controller.enqueue(encoder.encode(line));
          }

          // Record usage after stream finishes
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
            console.error("Failed to record usage:", e);
          }

          controller.close();
        } catch (error) {
          console.error("Error in chat stream:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
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
