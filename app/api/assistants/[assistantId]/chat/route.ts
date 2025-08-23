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
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of runStream as any) {
            const eventName = chunk?.event;
            const data = chunk?.data ?? chunk;
            if (eventName) controller.enqueue(encoder.encode(`event: ${eventName}\n`));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

            // Capture token usage if provided by the provider/SDK
            try {
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
              if (typeof eventName === "string" && /messages\/(delta|partial|token|chunk|complete)/i.test(eventName)) {
                // Best-effort content length extraction for text deltas
                const collectTextLength = (payload: unknown): number => {
                  if (!payload) return 0;
                  if (typeof payload === "string") return payload.length;
                  if (Array.isArray(payload)) {
                    return payload.reduce((sum: number, p: unknown) => sum + collectTextLength(p), 0);
                  }
                  if (typeof payload === "object") {
                    // LangChain messages often shape: { content: [{ type: 'text', text: '...' }]} or nested
                    const obj = payload as Record<string, unknown>;
                    if (typeof obj.text === "string") return obj.text.length;
                    if (Array.isArray(obj.content)) return collectTextLength(obj.content);
                    if (Array.isArray(obj.parts)) return collectTextLength(obj.parts);
                    if (typeof obj.delta === "string") return obj.delta.length;
                    if (typeof obj.token === "string") return obj.token.length;
                    if (typeof obj.value === "string") return obj.value.length;
                    return Object.values(obj).reduce((sum: number, v: unknown) => sum + collectTextLength(v), 0);
                  }
                  return 0;
                };
                outputCharsEstimate += collectTextLength(data);
              }
            } catch (e) {
              console.warn("Usage parse error:", e);
            }
          }

          // Record usage best-effort after stream finishes
          try {
            const inputTokens = sawUsageMetadata ? inputTokensFromStream : estimatedInputTokens;
            const outputTokens = sawUsageMetadata ? outputTokensFromStream : Math.ceil(outputCharsEstimate / 4);
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
