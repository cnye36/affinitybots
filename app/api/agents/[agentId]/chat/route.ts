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

    // Track the actual thread ID and run ID for fetching metadata later
    let actualThreadId: string | null = threadId;
    let runId: string | null = null;

    // Stream LangGraph events directly as newline-delimited JSON (simpler and faster)
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of runStream as any) {
            const eventName = typeof chunk?.event === "string" ? chunk.event : "";
            const data = chunk?.data ?? chunk;

            // Capture thread_id and run_id from metadata events
            if (eventName === "metadata" && data) {
              if (data.thread_id && !actualThreadId) {
                actualThreadId = data.thread_id;
              }
              if (data.run_id && !runId) {
                runId = data.run_id;
              }
            }

            // Stream the event as JSON
            const line = JSON.stringify({ event: eventName, data }) + "\n";
            controller.enqueue(encoder.encode(line));
          }

          // After stream completes, fetch accurate usage metadata from the thread state
          try {
            let inputTokens = 0;
            let outputTokens = 0;

            if (actualThreadId && runId) {
              console.log(`[chat stream] Fetching usage metadata for thread ${actualThreadId}, run ${runId}`);

              try {
                // Get the state and extract from the latest AI message
                const state = await client.threads.getState(actualThreadId);

                const messages = (state?.values as any)?.messages;
                if (messages && Array.isArray(messages)) {
                  // Get the last AI message (most recent response)
                  for (let i = messages.length - 1; i >= 0; i--) {
                    const message = messages[i];
                    if (message?.type === "ai" || message?.role === "assistant") {
                      // Extract usage from response_metadata.usage (OpenAI format)
                      const usage = message?.response_metadata?.usage;
                      if (usage) {
                        inputTokens = usage.prompt_tokens ?? usage.input_tokens ?? 0;
                        outputTokens = usage.completion_tokens ?? usage.output_tokens ?? 0;
                        console.log(`[chat stream] Got usage from AI message - input: ${inputTokens}, output: ${outputTokens}`);
                        break;
                      }
                    }
                  }
                }
              } catch (stateError) {
                console.error(`[chat stream] Error fetching thread state:`, stateError);
              }
            } else {
              console.warn(`[chat stream] Missing thread_id or run_id, cannot fetch accurate usage`);
            }

            // Record the usage
            if (user?.id && (inputTokens > 0 || outputTokens > 0)) {
              await rateLimiter.recordUsage({
                userId: user.id,
                inputTokens,
                outputTokens,
                timestamp: Date.now(),
                model: "gpt-5",
                sessionId: actualThreadId || threadId,
              });
            } else {
              console.warn(`[chat stream] No usage to record - input: ${inputTokens}, output: ${outputTokens}`);
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
