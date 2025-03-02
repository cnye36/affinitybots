import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Client } from "@langchain/langgraph-sdk";

export async function POST(
  request: Request,
  props: { params: Promise<{ workflowId: string; taskId: string }> }
) {
  const { workflowId, taskId } = await props.params;
  const supabase = await createClient();

  try {
    const client = new Client({
      apiUrl: process.env.LANGGRAPH_URL,
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
    console.log("Task config.assigned_agent:", task.config?.assigned_agent);
    console.log("Task type:", task.task_type);

    const { input } = await request.json();
    console.log("Input received:", input);

    if (task.task_type === "ai_task") {
      try {
        // Check for assistant_id first, then fallback to config.assigned_agent if needed
        const assistantId =
          task.assistant_id || task.config?.assigned_agent?.id;
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
              // 1. Directly create and stream the execution
              const runStream = await client.runs.stream(
                null, // Stateless runs use null thread ID
                assistantId,
                {
                  input: {
                    messages: [
                      {
                        role: "user",
                        content:
                          task.config?.input?.prompt || input?.prompt || "",
                      },
                    ],
                  },
                  metadata: {
                    workflow_id: workflowId,
                    workflow_task_id: taskId,
                    user_id: user.id,
                  },
                  config: {
                    configurable: task.config,
                  },
                  streamMode: "messages",
                }
              );

              // 2. Get run ID from the first event
              const firstEvent = await runStream.next();
              runId = firstEvent.value?.data?.run_id;
              if (!runId) {
                throw new Error(
                  "Failed to get run ID from LangGraph execution"
                );
              }

              // 3. Create task run record with the obtained run ID
              const { error: insertError } = await supabase
                .from("task_runs")
                .insert({
                  task_id: task.workflow_task_id,
                  run_id: runId,
                  status: "running",
                  started_at: new Date().toISOString(),
                });

              if (insertError) throw insertError;

              // 4. Process stream events
              for await (const event of runStream) {
                if (event.event === "error") {
                  throw new Error(event.data.error);
                }

                // Handle final output
                if (event.event === "messages/complete") {
                  await supabase
                    .from("task_runs")
                    .update({
                      status: "completed",
                      completed_at: new Date().toISOString(),
                      result: event.data.output,
                    })
                    .eq("run_id", runId);
                }

                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
                );
              }

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
