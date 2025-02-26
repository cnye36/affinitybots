import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { TaskType } from "@/types/workflow";

const VALID_TASK_TYPES: TaskType[] = [
  "ai_task",
  // Integration tasks
  // "notion_create_page",
  // "notion_update_page",
  // "notion_add_to_database",
  // "notion_search",
  // "twitter_post_tweet",
  // "twitter_thread",
  // "twitter_dm",
  // "twitter_like",
  // "twitter_retweet",
  // "google_calendar_create",
  // "google_calendar_update",
  // "google_docs_create",
  // "google_sheets_update",
  // "google_drive_upload",
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

    // Validate task type
    if (!VALID_TASK_TYPES.includes(taskData.type)) {
      return NextResponse.json({ error: "Invalid task type" }, { status: 400 });
    }

    // For AI tasks, ensure assistant_id is provided
    if (taskData.type === "ai_task" && !taskData.assistant_id) {
      return NextResponse.json(
        { error: "AI tasks require an assistant_id" },
        { status: 400 }
      );
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

    // Create the workflow task
    const { data: task, error } = await supabase
      .from("workflow_tasks")
      .insert({
        workflow_id: workflowId,
        position,
        name: taskData.name,
        description: taskData.description,
        task_type: taskData.type,
        assistant_id: taskData.assistant_id,
        config: {
          input: {
            source: taskData.config?.input?.source || "previous_task",
            parameters: taskData.config?.input?.parameters || {},
            prompt: taskData.config?.input?.prompt || "",
          },
          output: {
            destination: taskData.config?.output?.destination || "next_task",
          },
          ...taskData.config,
        },
        status: "pending",
        metadata: taskData.metadata || {},
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
