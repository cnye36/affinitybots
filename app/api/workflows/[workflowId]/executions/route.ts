import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

// GET /api/workflows/:workflowId/executions
// Lists workflow_runs and aggregated task run counts
export async function GET(
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

    // Verify the workflow belongs to the user
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

    // Fetch runs for this workflow
    const { data: runs, error } = await supabase
      .from("workflow_runs")
      .select("run_id, status, started_at, completed_at, error, metadata")
      .eq("workflow_id", workflowId)
      .order("started_at", { ascending: false });

    if (error) throw error;

    const runIds = (runs || []).map((r) => r.run_id);
    if (!runIds.length) return NextResponse.json([]);

    // Aggregate task run statuses per run to derive a more accurate status
    const { data: aggregates } = await supabase
      .from("workflow_task_runs")
      .select("workflow_run_id, status")
      .in("workflow_run_id", runIds);

    const byRun: Record<string, { total: number; completed: number; failed: number }> = {};
    for (const a of aggregates || []) {
      const k = (a as any).workflow_run_id as string;
      const s = (a as any).status as string;
      byRun[k] = byRun[k] || { total: 0, completed: 0, failed: 0 };
      byRun[k].total += 1;
      if (s === "completed") byRun[k].completed += 1;
      if (s === "failed") byRun[k].failed += 1;
    }

    const normalized = (runs || []).map((r) => {
      const agg = byRun[r.run_id];
      if (!agg) return r;
      if (r.status === "running" && agg.total > 0 && agg.completed === agg.total) {
        return { ...r, status: "completed" };
      }
      if (r.status !== "failed" && agg.failed > 0) {
        return { ...r, status: "failed" };
      }
      return r;
    });

    return NextResponse.json(normalized);
  } catch (err) {
    console.error("Error listing executions:", err);
    return NextResponse.json(
      { error: "Failed to list executions" },
      { status: 500 }
    );
  }
}


