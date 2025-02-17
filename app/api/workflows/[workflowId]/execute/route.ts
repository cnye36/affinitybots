import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { WorkflowTask } from "@/types/workflow";

export async function POST(
  request: Request,
  props: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await props.params;
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify workflow ownership and get tasks
    const { data: workflow } = await supabase
      .from("workflows")
      .select("*, workflow_tasks(*)")
      .eq("workflow_id", workflowId)
      .single();

    if (!workflow || workflow.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Workflow not found or access denied" },
        { status: 404 }
      );
    }

    // Sort tasks by position
    const tasks = (workflow.workflow_tasks as WorkflowTask[]).sort(
      (a: WorkflowTask, b: WorkflowTask) => a.position - b.position
    );

    if (tasks.length === 0) {
      return NextResponse.json(
        { error: "Workflow has no tasks" },
        { status: 400 }
      );
    }

    // Create a workflow run record
    const { data: workflowRun } = await supabase
      .from("workflow_runs")
      .insert({
        workflow_id: workflowId,
        status: "running",
        started_at: new Date().toISOString(),
        metadata: {},
      })
      .select()
      .single();

    // Update workflow status
    await supabase
      .from("workflows")
      .update({
        status: "running",
        last_run_at: new Date().toISOString(),
      })
      .eq("workflow_id", workflowId);

    // Create task run records for each task
    const taskRuns = await Promise.all(
      tasks.map(async (task: WorkflowTask) => {
        const { data: taskRun } = await supabase
          .from("workflow_task_runs")
          .insert({
            workflow_run_id: workflowRun.run_id,
            task_id: task.task_id,
            status: "pending",
            started_at: new Date().toISOString(),
            metadata: {},
          })
          .select()
          .single();
        return taskRun;
      })
    );

    // Start executing the first task
    const firstTask = tasks[0];
    const response = await fetch(
      `/api/workflows/${workflowId}/tasks/${firstTask.workflow_task_id}/execute`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {}, // Initial input for first task
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to execute first task");
    }

    return NextResponse.json({
      workflow_run_id: workflowRun.run_id,
      task_runs: taskRuns,
    });
  } catch (error) {
    console.error("Error executing workflow:", error);

    // Update workflow status to failed
    await supabase
      .from("workflows")
      .update({
        status: "failed",
        last_run_at: new Date().toISOString(),
      })
      .eq("workflow_id", workflowId);

    return NextResponse.json(
      { error: "Failed to execute workflow" },
      { status: 500 }
    );
  }
}
