import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

// GET /api/workflows/:workflowId/executions/:runId
// Returns the workflow run plus its workflow_task_runs
export async function GET(
  request: Request,
  props: { params: Promise<{ workflowId: string; runId: string }> }
) {
  const { workflowId, runId } = await props.params;
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify workflow ownership
    const { data: workflow } = await supabase
      .from("workflows")
      .select("owner_id")
      .eq("workflow_id", workflowId)
      .single();
    if (!workflow || workflow.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Workflow not found or access denied" },
        { status: 404 }
      );
    }

    // Fetch run row with workflow snapshot
    const { data: run, error: runErr } = await supabase
      .from("workflow_runs")
      .select("run_id, workflow_id, status, started_at, completed_at, error, result, metadata, workflow_snapshot")
      .eq("run_id", runId)
      .eq("workflow_id", workflowId)
      .single();
    if (runErr || !run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    // Fetch task runs
    const { data: taskRuns, error: trErr } = await supabase
      .from("workflow_task_runs")
      .select("run_id, workflow_task_id, status, started_at, completed_at, error, result, metadata")
      .eq("workflow_run_id", runId)
      .order("started_at", { ascending: true });
    if (trErr) throw trErr;

    return NextResponse.json({ run, taskRuns: taskRuns || [] });
  } catch (err) {
    console.error("Error getting execution:", err);
    return NextResponse.json(
      { error: "Failed to get execution" },
      { status: 500 }
    );
  }
}


