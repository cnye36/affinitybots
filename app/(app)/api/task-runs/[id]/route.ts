import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { TaskRun, TaskRunStatus } from "@/types/workflow";

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = context.params;

    const { data: taskRun, error } = await supabase
      .from("task_runs")
      .select("*, task:tasks(*), workflow:workflows(*)")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching task run:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!taskRun) {
      return NextResponse.json(
        { error: "Task run not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(taskRun);
  } catch (error) {
    console.error("Error in GET /api/task-runs/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const {
      status,
      error: errorMessage,
      output = {},
      metadata = {},
    } = json as {
      status: TaskRunStatus;
      error?: string;
      output?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    };

    // Verify task run exists and user has access through workflow run
    const { data: taskRun, error: fetchError } = await supabase
      .from("task_runs")
      .select("workflow_run_id, metadata")
      .eq("id", params.id)
      .single();

    if (fetchError || !taskRun) {
      return NextResponse.json(
        { error: "Task run not found" },
        { status: 404 }
      );
    }

    // Verify workflow run ownership
    const { data: workflowRun, error: workflowRunError } = await supabase
      .from("workflow_runs")
      .select("created_by")
      .eq("id", taskRun.workflow_run_id)
      .single();

    if (workflowRunError || !workflowRun) {
      return NextResponse.json(
        { error: "Workflow run not found" },
        { status: 404 }
      );
    }

    if (workflowRun.created_by !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updateData: Partial<TaskRun> = {
      status,
      output,
      metadata: {
        ...(taskRun.metadata as Record<string, unknown>),
        ...metadata,
      },
      updated_at: new Date().toISOString(),
    };

    if (status === "completed" || status === "failed") {
      updateData.completed_at = new Date().toISOString();
    }

    if (errorMessage) {
      updateData.error = errorMessage;
    }

    const { data: run, error } = await supabase
      .from("task_runs")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating task run:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(run);
  } catch (error) {
    console.error("Error in PUT /api/task-runs/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify task run exists and user has access through workflow run
    const { data: taskRun, error: fetchError } = await supabase
      .from("task_runs")
      .select("workflow_run_id")
      .eq("id", params.id)
      .single();

    if (fetchError || !taskRun) {
      return NextResponse.json(
        { error: "Task run not found" },
        { status: 404 }
      );
    }

    // Verify workflow run ownership
    const { data: workflowRun, error: workflowRunError } = await supabase
      .from("workflow_runs")
      .select("created_by")
      .eq("id", taskRun.workflow_run_id)
      .single();

    if (workflowRunError || !workflowRun) {
      return NextResponse.json(
        { error: "Workflow run not found" },
        { status: 404 }
      );
    }

    if (workflowRun.created_by !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { error } = await supabase
      .from("task_runs")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("Error deleting task run:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/task-runs/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
