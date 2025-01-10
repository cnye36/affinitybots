import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { WorkflowRun, WorkflowRunStatus } from "@/types/workflow";

export async function GET(
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

    const { data: run, error } = await supabase
      .from("workflow_runs")
      .select(
        `
        *,
        workflow:workflows(*),
        task_runs:task_runs(
          *,
          task:tasks(*)
        )
      `
      )
      .eq("id", params.id)
      .eq("created_by", user.id)
      .single();

    if (error) {
      console.error("Error fetching workflow run:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!run) {
      return NextResponse.json(
        { error: "Workflow run not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(run);
  } catch (error) {
    console.error("Error in GET /api/workflow-runs/[id]:", error);
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
      metadata = {},
    } = json as {
      status: WorkflowRunStatus;
      error?: string;
      metadata?: Record<string, unknown>;
    };

    // Verify run exists and user has access
    const { data: existingRun, error: fetchError } = await supabase
      .from("workflow_runs")
      .select("created_by, metadata")
      .eq("id", params.id)
      .single();

    if (fetchError || !existingRun) {
      return NextResponse.json(
        { error: "Workflow run not found" },
        { status: 404 }
      );
    }

    if (existingRun.created_by !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updateData: Partial<WorkflowRun> = {
      status,
      metadata: {
        ...(existingRun.metadata as Record<string, unknown>),
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
      .from("workflow_runs")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating workflow run:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(run);
  } catch (error) {
    console.error("Error in PUT /api/workflow-runs/[id]:", error);
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

    // Verify run exists and user has access
    const { data: existingRun, error: fetchError } = await supabase
      .from("workflow_runs")
      .select("created_by")
      .eq("id", params.id)
      .single();

    if (fetchError || !existingRun) {
      return NextResponse.json(
        { error: "Workflow run not found" },
        { status: 404 }
      );
    }

    if (existingRun.created_by !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { error } = await supabase
      .from("workflow_runs")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("Error deleting workflow run:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/workflow-runs/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
