import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Task, TaskType } from "@/types";

const VALID_TASK_TYPES: TaskType[] = [
  "process_input",
  "generate_content",
  "analyze_data",
  "make_decision",
  "transform_data",
  "api_call",
  "custom",
];

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
      .select("*")
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

    const taskData: Partial<Task> = await request.json();

    // Validate task type
    if (!VALID_TASK_TYPES.includes(taskData.type as TaskType)) {
      return NextResponse.json({ error: "Invalid task type" }, { status: 400 });
    }

    // Get the next position number
    const { data: lastTask } = await supabase
      .from("workflow_tasks")
      .select("position")
      .eq("workflow_id", workflowId)
      .order("position", { ascending: false })
      .limit(1)
      .single();

    const position = lastTask ? lastTask.position + 1 : 0;

    // Create the task
    const { data: task, error } = await supabase
      .from("workflow_tasks")
      .insert({
        workflow_id: workflowId,
        assistant_id: taskData.agentId,
        name: taskData.name,
        description: taskData.description,
        task_type: taskData.type,
        config: taskData.config || {
          input: { source: "previous_task" },
          output: { destination: "next_task" },
        },
        position,
        status: "pending",
        metadata: {},
      })
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
