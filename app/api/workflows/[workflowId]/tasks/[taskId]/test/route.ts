import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Task } from "@/types/workflow";

interface TaskOutput {
  result: unknown;
  input?: Record<string, unknown>;
  previousOutput?: TaskOutput | null;
  error?: string;
  metadata?: Record<string, unknown>;
}

// POST - Test a task
export async function POST(
  request: Request,
  props: { params: Promise<{ workflowId: string; taskId: string }> }
) {
  const { taskId } = await props.params;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify task and workflow ownership
    const { data: task, error: taskError } = await supabase
      .from("workflow_tasks")
      .select("*, workflow:workflows(owner_id)")
      .eq("task_id", taskId)
      .single();

    if (taskError || !task || task.workflow.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Task not found or access denied" },
        { status: 404 }
      );
    }

    // Get the previous task's output if it exists
    const { data: edges } = await supabase
      .from("workflow_edges")
      .select("source_id")
      .eq("target_id", taskId)
      .single();

    let previousOutput: TaskOutput | null = null;
    if (edges?.source_id) {
      const { data: previousTask } = await supabase
        .from("workflow_tasks")
        .select("last_output")
        .eq("task_id", edges.source_id)
        .single();

      if (previousTask) {
        previousOutput = previousTask.last_output as TaskOutput;
      }
    }

    // Execute the task based on its type
    const result = await executeTask(task, previousOutput);

    // Update the task's last output
    await supabase
      .from("workflow_tasks")
      .update({ last_output: result })
      .eq("task_id", taskId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error testing task:", error);
    return NextResponse.json({ error: "Failed to test task" }, { status: 500 });
  }
}

async function executeTask(
  task: Task,
  previousOutput: TaskOutput | null
): Promise<TaskOutput> {
  // This is a placeholder implementation
  // In a real application, you would:
  // 1. Handle different task types differently
  // 2. Use appropriate APIs for each integration
  // 3. Process the input/output according to the task configuration

  switch (task.type) {
    case "ai_write_content":
    case "ai_analyze_content":
    case "ai_summarize":
    case "ai_translate":
      return {
        result: "AI task execution simulation",
        input: task.config.input,
        previousOutput,
      };

    case "notion_create_page":
    case "notion_update_page":
    case "notion_add_to_database":
    case "notion_search":
      return {
        result: "Notion task execution simulation",
        input: task.config.input,
        previousOutput,
      };

    case "twitter_post_tweet":
    case "twitter_thread":
    case "twitter_dm":
    case "twitter_like":
    case "twitter_retweet":
      return {
        result: "Twitter task execution simulation",
        input: task.config.input,
        previousOutput,
      };

    case "google_calendar_create":
    case "google_calendar_update":
    case "google_docs_create":
    case "google_sheets_update":
    case "google_drive_upload":
      return {
        result: "Google task execution simulation",
        input: task.config.input,
        previousOutput,
      };

    default:
      throw new Error(`Unsupported task type: ${task.type}`);
  }
}
