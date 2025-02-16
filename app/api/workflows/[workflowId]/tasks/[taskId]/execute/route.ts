import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Client } from "@langchain/langgraph-sdk";
import { TaskType, WorkflowTask } from "@/types/workflow";

// Simplified task type check
const isAITask = (taskType: TaskType) => taskType === "ai_task";

export async function POST(
  request: Request,
  props: { params: Promise<{ workflowId: string; taskId: string }> }
) {
  const { workflowId, taskId } = await props.params;
  const supabase = await createClient();
  const client = new Client({
    apiUrl: process.env.LANGGRAPH_URL,
    apiKey: process.env.LANGSMITH_API_KEY,
  });

  let currentTask: WorkflowTask | null = null;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get task with workflow ownership check
    const { data: task } = await supabase
      .from("workflow_tasks")
      .select("*, workflow:workflows(owner_id)")
      .eq("task_id", taskId)
      .single();

    if (!task || task.workflow.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Task not found or access denied" },
        { status: 404 }
      );
    }

    currentTask = task;

    // Update task status to running
    await supabase
      .from("workflow_tasks")
      .update({ status: "running", last_run_at: new Date().toISOString() })
      .eq("task_id", taskId);

    const { input, config } = await request.json();
    const isStateless = config?.mode === "stateless";
    const shouldStream = config?.stream === true;

    if (isAITask(task.task_type as TaskType)) {
      // Fetch agent configuration
      const { data: assistant } = await supabase
        .from("assistants")
        .select("*")
        .eq("assistant_id", task.assistant_id)
        .single();

      if (!assistant) {
        return NextResponse.json({ error: "Agent not found" }, { status: 404 });
      }

      // Common run configuration for AI tasks
      const runConfig = {
        input,
        metadata: {
          workflow_id: workflowId,
          task_id: taskId,
          user_id: user.id,
          task_type: task.task_type,
          execution_mode: isStateless ? "stateless" : "background",
        },
        config: {
          tags: ["workflow", isStateless ? "test" : "production"],
          configurable: {
            ...assistant.config?.configurable,
            ...task.config,
            task_input: input,
          },
        },
      };

      if (isStateless) {
        if (shouldStream) {
          const stream = await client.runs.stream("", task.assistant_id, {
            ...runConfig,
            streamMode: ["messages"],
          });

          const encoder = new TextEncoder();
          const readable = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of stream) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
                  );
                }
                controller.close();
              } catch (error) {
                controller.error(error);
              }
            },
          });

          return new Response(readable, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          });
        } else {
          const result = await client.runs.create(
            task.assistant_id,
            "",
            runConfig
          );
          return NextResponse.json(result);
        }
      } else {
        // For workflow execution, use background run
        const run = await client.runs.create(
          task.assistant_id,
          task.thread_id || "",
          {
            ...runConfig,
            streamMode: ["values", "messages"],
          }
        );

        // Update task with run information
        await supabase
          .from("workflow_tasks")
          .update({
            metadata: {
              ...task.metadata,
              run_id: run.run_id,
            },
          })
          .eq("task_id", taskId);

        return NextResponse.json(run);
      }
    } else {
      // Handle integration tasks (to be implemented)
      return NextResponse.json(
        { error: "Integration tasks not yet implemented" },
        { status: 501 }
      );
    }
  } catch (error) {
    console.error("Error executing task:", error);
    const taskError = error as Error;

    // Update task status to failed
    await supabase
      .from("workflow_tasks")
      .update({
        status: "failed",
        metadata: {
          ...currentTask?.metadata,
          error: taskError.message,
        },
      })
      .eq("task_id", taskId);

    return NextResponse.json(
      { error: "Failed to execute task" },
      { status: 500 }
    );
  }
}
