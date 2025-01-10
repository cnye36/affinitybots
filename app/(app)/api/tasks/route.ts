import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");
    const workflowId = searchParams.get("workflowId");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase.from("tasks").select("*");

    if (agentId) {
      query = query.eq("agent_id", agentId);
    }

    if (workflowId) {
      query = query.eq("workflow_id", workflowId);
    }

    const { data: tasks, error } = await query.order("order");

    if (error) {
      console.error("Error fetching tasks:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error in GET /api/tasks:", error);
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
    const { name, description, type, config, agentId, workflowId, order } =
      json;

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

    // Get the maximum order for the current agent if order is not provided
    let taskOrder = order;
    if (!taskOrder) {
      const { data: maxOrderTask } = await supabase
        .from("tasks")
        .select("order")
        .eq("agent_id", agentId)
        .eq("workflow_id", workflowId)
        .order("order", { ascending: false })
        .limit(1);

      taskOrder =
        maxOrderTask && maxOrderTask[0] ? maxOrderTask[0].order + 1 : 0;
    }

    const { data: task, error } = await supabase
      .from("tasks")
      .insert([
        {
          name,
          description,
          type,
          config,
          agent_id: agentId,
          workflow_id: workflowId,
          order: taskOrder,
          created_by: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating task:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error in POST /api/tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
