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
    console.log("Task type:", task.task_type);

    const { input } = await request.json();
    console.log("Input received:", input);

    if (task.task_type === "ai_task") {
      try {
        // Verify assistant_id exists
        if (!task.assistant_id) {
          console.error("Task has no assistant_id:", task);
          return NextResponse.json(
            { error: "Task has no associated assistant" },
            { status: 400 }
          );
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            try {
              console.log("Creating initial run...");

              // Create the initial run without a thread ID
              const runResponse = await client.runs.create(
                task.assistant_id,
                "", // Empty string for stateless runs
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
                    configurable: {
                      ...task.config,
                    },
                  },
                  streamMode: "events",
                }
              );

              console.log("Run created with response:", runResponse);

              // Now create our task run record with the SDK-generated run ID
              const { data: taskRun, error: taskRunError } = await supabase
                .from("task_runs")
                .insert({
                  task_id: task.workflow_task_id,
                  run_id: runResponse.run_id, // Use the SDK-generated run ID
                  status: "running",
                  started_at: new Date().toISOString(),
                  metadata: {},
                })
                .select()
                .single();

              if (taskRunError || !taskRun) {
                throw new Error("Failed to create task run record");
              }

              console.log("Task run record created:", taskRun);

              // Stream the run
              const run = await client.runs.stream(
                "", // Empty string for stateless runs
                task.assistant_id,
                {
                  input: {
                    messages: [
                      {
                        role: "user",
                        content:
                          task.config?.input?.prompt || input?.prompt || "",
                      },
                    ],
                    ...input,
                  },
                  metadata: {
                    workflow_id: workflowId,
                    workflow_task_id: taskId,
                    run_id: runResponse.run_id,
                    user_id: user.id,
                  },
                  config: {
                    configurable: {
                      ...task.config,
                    },
                  },
                  streamMode: "events",
                }
              );

              console.log("Run stream created successfully");

              let eventCount = 0;
              for await (const event of run) {
                eventCount++;
                console.log(
                  `Event ${eventCount}:`,
                  JSON.stringify(event, null, 2)
                );
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
                );
              }

              if (eventCount === 0) {
                console.warn(
                  "Warning: No events were received from the stream"
                );
                console.log("Attempting to wait for run completion...");
                const runResult = await client.runs.wait(
                  "", // Empty string for stateless runs
                  task.assistant_id,
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
                  }
                );
                console.log("Run wait result:", runResult);
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(runResult)}\n\n`)
                );
              }

              console.log(`Stream completed. Total events: ${eventCount}`);
              controller.close();
            } catch (error) {
              console.error("Error in stream:", error);
              controller.error(error);
            }
          },
        });

        console.log("Returning stream response");
        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      } catch (error) {
        console.error("Error in run creation:", error);
        throw error;
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
