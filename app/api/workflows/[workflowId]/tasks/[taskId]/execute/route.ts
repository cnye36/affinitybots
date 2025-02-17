import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Client } from "@langchain/langgraph-sdk";

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
      .eq("workflow_task_id", taskId)
      .single();

    if (!task || task.workflow.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Task not found or access denied" },
        { status: 404 }
      );
    }
    console.log("task", task);

    const { input } = await request.json();
    console.log("input", input);

    if (task.task_type === "ai_task") {
      // Create a task run record
      const { data: taskRun, error: taskRunError } = await supabase
        .from("task_runs")
        .insert({
          workflow_task_id: task.workflow_task_id,
          status: "running",
          started_at: new Date().toISOString(),
          metadata: {},
        })
        .select()
        .single();

      if (taskRunError || !taskRun) {
        throw new Error("Failed to create task run");
      }

      console.log("taskRun", taskRun);

      try {
        // Create a stateless run with the assistant
        const run = await client.runs.create(task.assistant_id, "", {
          input: {
            messages: [
              {
                role: "user",
                content: task.config?.input?.prompt || input?.prompt || "",
              },
            ],
            ...input,
          },
          metadata: {
            workflow_id: workflowId,
            workflow_task_id: taskId,
            run_id: taskRun.run_id,
            user_id: user.id,
          },
          config: {
            configurable: {
              ...task.config,
            },
          },
        });

        // Update task run with success
        const { error: updateError } = await supabase
          .from("task_runs")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            result: run,
          })
          .eq("run_id", taskRun.run_id);

        if (updateError) {
          throw new Error("Failed to update task run status");
        }

        return NextResponse.json(run);
      } catch (error) {
        // Update task run with error
        if (taskRun?.run_id) {
          await supabase
            .from("task_runs")
            .update({
              status: "error",
              completed_at: new Date().toISOString(),
              error: error instanceof Error ? error.message : "Unknown error",
            })
            .eq("run_id", taskRun.run_id);
        }

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
