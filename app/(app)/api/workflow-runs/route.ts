import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("workflowId");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
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
      .eq("created_by", user.id);

    if (workflowId) {
      query = query.eq("workflow_id", workflowId);
    }

    const { data: runs, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching workflow runs:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ runs });
  } catch (error) {
    console.error("Error in GET /api/workflow-runs:", error);
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
    const { workflowId, metadata = {} } = json;

    // Verify workflow ownership
    const { data: workflow, error: workflowError } = await supabase
      .from("workflows")
      .select("owner_id")
      .eq("id", workflowId)
      .single();

    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    if (workflow.owner_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Create workflow run
    const { data: run, error } = await supabase
      .from("workflow_runs")
      .insert([
        {
          workflow_id: workflowId,
          status: "pending",
          metadata,
          created_by: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating workflow run:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(run);
  } catch (error) {
    console.error("Error in POST /api/workflow-runs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
