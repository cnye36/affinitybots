import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

type WorkflowRunRow = {
  run_id: string;
  workflow_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
  result: unknown;
  metadata: Record<string, unknown> | null;
};

type WorkflowTaskRunRow = {
  workflow_run_id: string;
  workflow_task_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
  result: unknown;
  metadata: Record<string, unknown> | null;
};

// GET - List runs for a workflow
export async function GET(
  request: Request,
  props: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await props.params;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify workflow ownership
    const { data: workflow } = await supabase
      .from("workflows")
      .select("*")
      .eq("workflow_id", workflowId)
      .single();

    if (!workflow || workflow.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Workflow not found or access denied" },
        { status: 404 }
      );
    }

    const { data: runs, error: runsError } = await supabase
      .from("workflow_runs")
      .select(
        "run_id, workflow_id, status, started_at, completed_at, error, result, metadata"
      )
      .eq("workflow_id", workflowId)
      .eq("owner_id", user.id)
      .order("started_at", { ascending: false });

    if (runsError) {
      throw runsError;
    }

    const runRows = (runs as WorkflowRunRow[] | null) ?? [];
    const runIds = runRows.map((run) => run.run_id);

    if (!runIds.length) {
      return NextResponse.json([]);
    }

    const { data: taskRuns, error: taskRunsError } = await supabase
      .from("workflow_task_runs")
      .select(
        "workflow_run_id, workflow_task_id, status, started_at, completed_at, error, result, metadata"
      )
      .in("workflow_run_id", runIds);

    if (taskRunsError) {
      throw taskRunsError;
    }

    const groupedTaskRuns = new Map<string, WorkflowTaskRunRow[]>();
    for (const raw of (taskRuns as WorkflowTaskRunRow[] | null) ?? []) {
      const workflowRunId = raw.workflow_run_id;
      if (!groupedTaskRuns.has(workflowRunId)) {
        groupedTaskRuns.set(workflowRunId, []);
      }
      groupedTaskRuns.get(workflowRunId)!.push(raw);
    }

    const responsePayload = runRows.map((run) => ({
      ...run,
      taskRuns: groupedTaskRuns.get(run.run_id) || [],
    }));

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Error fetching runs:", error);
    return NextResponse.json(
      { error: "Failed to fetch runs" },
      { status: 500 }
    );
  }
}

// POST - Create a new workflow run
export async function POST(
  request: Request,
  props: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await props.params;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify workflow ownership
    const { data: workflow } = await supabase
      .from("workflows")
      .select("*")
      .eq("workflow_id", workflowId)
      .single();

    if (!workflow || workflow.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Workflow not found or access denied" },
        { status: 404 }
      );
    }

    let body: unknown = null;
    try {
      body = await request.json();
    } catch {}

    const input =
      body && typeof body === "object" && (body as Record<string, unknown>).input !== undefined
        ? (body as Record<string, unknown>).input
        : null;
    const config =
      body && typeof body === "object" && (body as Record<string, unknown>).config !== undefined
        ? (body as Record<string, unknown>).config
        : null;

    const {
      data: existingRuns,
      error: existingRunsError,
    } = await supabase
      .from("workflow_runs")
      .select("run_id")
      .eq("workflow_id", workflowId)
      .eq("owner_id", user.id);

    if (existingRunsError) {
      throw existingRunsError;
    }

    const knownRunIds = new Set(
      ((existingRuns as Array<{ run_id: string }> | null) ?? []).map((run) => run.run_id)
    );

    const executeUrl = new URL(request.url);
    executeUrl.pathname = executeUrl.pathname.replace(/\/runs$/, "/execute");

    const cookieHeader = request.headers.get("cookie");
    const executePayload =
      input !== null
        ? { initialPayload: input }
        : {};

    (async () => {
      try {
        const response = await fetch(executeUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(cookieHeader ? { cookie: cookieHeader } : {}),
          },
          body: JSON.stringify(executePayload),
        });

        if (!response.ok) {
          const details = await response.text().catch(() => "");
          console.error("Workflow execute request failed:", details || response.statusText);
          return;
        }

        if (!response.body) {
          return;
        }

        const reader = response.body.getReader();
        while (true) {
          const { done } = await reader.read();
          if (done) break;
        }
      } catch (err) {
        console.error("Background workflow execution error:", err);
      }
    })();

    const pollIntervalMs = 150;
    const maxAttempts = 20;
    let discoveredRun: WorkflowRunRow | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const {
        data: recentRuns,
        error: recentRunsError,
      } = await supabase
        .from("workflow_runs")
        .select(
          "run_id, workflow_id, status, started_at, completed_at, error, result, metadata"
        )
        .eq("workflow_id", workflowId)
        .eq("owner_id", user.id)
        .order("started_at", { ascending: false })
        .limit(5);

      if (recentRunsError) {
        throw recentRunsError;
      }

      const recentRows = (recentRuns as WorkflowRunRow[] | null) ?? [];
      const newRun = recentRows.find((run) => !knownRunIds.has(run.run_id));
      if (newRun) {
        discoveredRun = newRun;
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    if (!discoveredRun) {
      return NextResponse.json(
        { error: "Failed to start workflow run" },
        { status: 500 }
      );
    }

    if (config !== null || input !== null) {
      const existingMetadata =
        discoveredRun.metadata && typeof discoveredRun.metadata === "object"
          ? (discoveredRun.metadata as Record<string, unknown>)
          : {};

      const metadata = {
        ...existingMetadata,
        request: {
          ...(input !== null ? { input } : {}),
          ...(config !== null ? { config } : {}),
        },
      };

      const {
        data: updatedRun,
        error: updateError,
      } = await supabase
        .from("workflow_runs")
        .update({ metadata })
        .eq("run_id", discoveredRun.run_id)
        .select(
          "run_id, workflow_id, status, started_at, completed_at, error, result, metadata"
        )
        .single();

      if (!updateError && updatedRun) {
        discoveredRun = updatedRun as WorkflowRunRow;
      }
    }

    return NextResponse.json(discoveredRun);
  } catch (error) {
    console.error("Error creating run:", error);
    return NextResponse.json(
      { error: "Failed to create run" },
      { status: 500 }
    );
  }
}
