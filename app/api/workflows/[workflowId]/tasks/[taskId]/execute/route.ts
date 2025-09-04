import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Client } from "@langchain/langgraph-sdk";
import { rateLimiter } from "@/lib/rateLimiting";

export async function POST(
  request: Request,
  props: { params: Promise<{ workflowId: string; taskId: string }> }
) {
  const { workflowId, taskId } = await props.params;
  const supabase = await createClient();

  try {
    const client = new Client({
      apiUrl: process.env.LANGGRAPH_API_URL,
      apiKey: process.env.LANGSMITH_API_KEY,
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get task with workflow ownership check
    const { data: task } = await supabase
      .from("workflow_tasks")
      .select("*, workflow:workflows(owner_id), assistant_id")
      .eq("workflow_task_id", taskId)
      .single();

    if (!task || task.workflow.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Task not found or access denied" },
        { status: 404 }
      );
    }
    console.log("Task retrieved:", task);
    console.log("Task assistant_id:", task.assistant_id);
    console.log("Task config.assigned_assistant:", task.config?.assigned_assistant);
    console.log("Task type:", task.task_type);

    const body = await request.json();
    const input = body?.input || {};
    const overrideConfig = body?.overrideConfig || null;
    let incomingThreadId: string | null = body?.thread_id || null;
    const previousOutputFromClient: unknown = body?.previousOutput ?? null;
    console.log("Input received:", input);

    if (task.task_type === "ai_task") {
      try {
        // Check for assistant_id first, then fallback to config.assigned_assistant if needed
        const assistantId = task.assistant_id || task.config?.assigned_assistant?.id;
        if (!assistantId) {
          return NextResponse.json(
            { error: "Task has no associated assistant" },
            { status: 400 }
          );
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            let runId: string | null = null;

            try {
              // 1. Determine thread strategy from task config; default to workflow thread
              const threadMode: "workflow" | "new" | "from_node" = (
                ((overrideConfig as any)?.context?.thread?.mode as any) ??
                ((task.config as any)?.context?.thread?.mode as any)
              ) || "workflow";
              if (threadMode === "new") {
                const thread = await client.threads.create();
                incomingThreadId = thread.thread_id;
              } else if (!incomingThreadId) {
                const thread = await client.threads.create();
                incomingThreadId = thread.thread_id;
              }

              // Send metadata with thread for client to capture
              controller.enqueue(
                encoder.encode(
                  `event: metadata\ndata: ${JSON.stringify({ thread_id: incomingThreadId })}\n\n`
                )
              );

              // 2. Build messages according to inputSource
              const inputSource: "prompt" | "previous_output" | "prompt_and_previous_output" =
                ((overrideConfig as any)?.context?.inputSource as any) ||
                (task.config as any)?.context?.inputSource ||
                "prompt";
              const messages: Array<{ role: string; content: string }> = [];
              const promptText = task.config?.input?.prompt || input?.prompt || "";
              const previousText = previousOutputFromClient
                ? (typeof previousOutputFromClient === "string"
                    ? previousOutputFromClient
                    : JSON.stringify(previousOutputFromClient))
                : (typeof (input as any)?.previous_output === "string"
                    ? (input as any).previous_output
                    : ((input as any)?.previous_output
                        ? JSON.stringify((input as any).previous_output)
                        : ""));
              // Always include this node's instruction if provided
              if (promptText) {
                messages.push({ role: "user", content: promptText });
              }
              // Optionally include previous node output
              if (inputSource === "previous_output" && previousText) {
                messages.push({ role: "user", content: previousText });
              }

              // 3. Stream the execution on the selected thread
              const payload = {
                input: { messages },
                metadata: {
                  workflow_id: workflowId,
                  workflow_task_id: taskId,
                  user_id: user.id,
                },
                config: {
                  configurable: {
                    ...(task.config || {}),
                    ...(overrideConfig || {}),
                    user_id: user.id,
                    assistant_id: assistantId,
                    ...(((overrideConfig || task.config)?.outputOptions?.structuredJson)
                      ? { response_format: { type: "json_object" } }
                      : {}),
                  },
                },
                streamMode: "messages" as const,
              };

              const runStream = incomingThreadId
                ? await client.runs.stream(incomingThreadId, assistantId, payload)
                : await client.runs.stream(null, assistantId, payload);

              // 3. Get run ID from the first event
              const firstEvent = await runStream.next();
              runId = firstEvent.value?.data?.run_id;
              if (!runId) {
                throw new Error(
                  "Failed to get run ID from LangGraph execution"
                );
              }

              // 4. Create task run record with the obtained run ID
              const { error: insertError } = await supabase
                .from("task_runs")
                .insert({
                  task_id: task.workflow_task_id,
                  run_id: runId,
                  status: "running",
                  started_at: new Date().toISOString(),
                });

              if (insertError) throw insertError;

              // 5. Process stream events
              let inputTokens = 0;
              let outputTokens = 0;
              let lastCompleteData: any = null;
              for await (const event of runStream) {
                if (event.event === "error") {
                  throw new Error(event.data.error);
                }

                // Handle final output
                if (event.event === "messages/complete") {
                  lastCompleteData = event.data;
                  await supabase
                    .from("task_runs")
                    .update({
                      status: "completed",
                      completed_at: new Date().toISOString(),
                      result:
                        "output" in event.data ? event.data.output : event.data,
                    })
                    .eq("run_id", runId);
                  // Prefer usage from final message if present
                  try {
                    const msgArr: any[] = Array.isArray(event.data) ? (event.data as any[]) : [];
                    const usage = (msgArr[0]?.response_metadata?.usage) || (msgArr[0]?.usage_metadata) || null;
                    if (usage) {
                      inputTokens = Number(
                        usage.prompt_tokens ?? usage.input_tokens ?? usage.total_input_tokens ?? 0
                      ) || inputTokens;
                      outputTokens = Number(
                        usage.completion_tokens ?? usage.output_tokens ?? usage.total_output_tokens ?? 0
                      ) || outputTokens;
                    }
                  } catch {}
                }

                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
                );
              }

              // 6. Record usage once at the end
              try {
                // Fallback estimation if no explicit usage seen
                if (!inputTokens && !outputTokens) {
                  const promptText =
                    task.config?.input?.prompt || input?.prompt || "";
                  const finalText = typeof (lastCompleteData?.content) === 'string'
                    ? lastCompleteData.content
                    : JSON.stringify(lastCompleteData ?? "");
                  inputTokens = Math.ceil((promptText?.length || 0) / 4);
                  outputTokens = Math.ceil((finalText?.length || 0) / 4);
                }
                await rateLimiter.recordUsage({
                  userId: user.id,
                  inputTokens,
                  outputTokens,
                  timestamp: Date.now(),
                  model: "ai_task",
                  sessionId: incomingThreadId,
                });
              } catch (e) {
                console.error("Failed to record usage for task run:", e);
              }

              // 7. Notify clients to refresh rate limit UI without polling
              try {
                // Send a lightweight event that frontends can listen for to refetch silently
                controller.enqueue(
                  encoder.encode(`event: rate-limit\n` +
                    `data: ${JSON.stringify({ type: "updated" })}\n\n`)
                );
              } catch {}

              controller.close();
            } catch (error) {
              console.error("Execution error:", error);

              // Update task run with error status
              if (runId) {
                await supabase
                  .from("task_runs")
                  .update({
                    status: "error",
                    completed_at: new Date().toISOString(),
                    error:
                      error instanceof Error ? error.message : "Unknown error",
                  })
                  .eq("run_id", runId);
              }

              controller.enqueue(
                encoder.encode(
                  `event: error\ndata: ${JSON.stringify({
                    error:
                      error instanceof Error ? error.message : "Unknown error",
                  })}\n\n`
                )
              );
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      } catch (error) {
        console.error("Execution setup error:", error);
        return NextResponse.json(
          { error: "Failed to start task execution" },
          { status: 500 }
        );
      }
    } else {
      // Handle other task types (integrations) here
      return NextResponse.json(
        { error: "Integration tasks not yet implemented" },
        { status: 501 }
      );
    }
  } catch (error) {
    console.error("Error executing task:", error);
    return NextResponse.json(
      { error: "Failed to execute task" },
      { status: 500 }
    );
  }
}
