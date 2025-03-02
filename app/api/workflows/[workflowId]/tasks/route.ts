import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

// GET - List tasks for a workflow
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

    // Get all tasks for this workflow
    const { data: tasks, error } = await supabase
      .from("workflow_tasks")
      .select("*, task_runs(*)")
      .eq("workflow_id", workflowId)
      .order("position");

    if (error) throw error;

    return NextResponse.json({ tasks: tasks || [] });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST - Create a new task
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

    const taskData = await request.json();
    console.log("Received task data:", taskData);

    // Get the next position number
    const { data: lastTask } = await supabase
      .from("workflow_tasks")
      .select("position")
      .eq("workflow_id", workflowId)
      .order("position", { ascending: false })
      .limit(1)
      .single();

    const position = lastTask ? lastTask.position + 1 : 0;

    // Prepare task data with proper assigned_agent structure
    const insertData = {
      workflow_id: workflowId,
      position,
      name: taskData.name,
      description: taskData.description,
      task_type: taskData.task_type,
      assistant_id: taskData.assistant_id, // Keep for backward compatibility
      config: {
        input: {
          source: taskData.config?.input?.source || "previous_task",
          parameters: taskData.config?.input?.parameters || {},
          prompt: taskData.config?.input?.prompt || "",
        },
        output: {
          destination: taskData.config?.output?.destination || "next_task",
        },
        // Store assigned agent information in the config so we can use it in the frontend
        assigned_agent: {
          id: taskData.assistant_id,
          name: taskData.assistant_name || "Assistant",
          avatar: taskData.assistant_avatar,
        },
        ...taskData.config,
      },
      status: "pending",
      metadata: taskData.metadata || {},
    };

    console.log("Inserting task with data:", insertData);

    // Create the workflow task
    const { data: task, error } = await supabase
      .from("workflow_tasks")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
