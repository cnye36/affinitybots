import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { TaskRunStatus } from "@/types/workflow";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const workflowRunId = searchParams.get("workflowRunId");
    const taskId = searchParams.get("taskId");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase.from("task_runs").select(`
        *,
        task:tasks(*),
        workflow_run:workflow_runs(*)
      `);

    if (workflowRunId) {
      query = query.eq("workflow_run_id", workflowRunId);
    }

    if (taskId) {
      query = query.eq("task_id", taskId);
    }

    const { data: runs, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching task runs:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ runs });
  } catch (error) {
    console.error("Error in GET /api/task-runs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
      workflowRunId,
      taskId,
      status = "pending" as TaskRunStatus,
      input = {},
      metadata = {},
    } = json;

    // Verify workflow run exists and user has access
    const { data: workflowRun, error: workflowRunError } = await supabase
      .from("workflow_runs")
      .select("created_by")
      .eq("id", workflowRunId)
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

    // Create task run
    const { data: run, error } = await supabase
      .from("task_runs")
      .insert([
        {
          workflow_run_id: workflowRunId,
          task_id: taskId,
          status,
          input,
          metadata,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating task run:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(run);
  } catch (error) {
    console.error("Error in POST /api/task-runs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
