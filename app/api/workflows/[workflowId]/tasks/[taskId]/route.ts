import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Task, TaskType } from "@/types/workflow";

const VALID_TASK_TYPES: TaskType[] = [
  // Notion tasks
  "notion_create_page",
  "notion_update_page",
  "notion_add_to_database",
  "notion_search",
  // Twitter tasks
  "twitter_post_tweet",
  "twitter_dm",
  "twitter_retweet",
  // Google tasks
  "google_calendar_create_event",
  "google_calendar_update_event",
  "google_docs_create",
  "google_sheets_update",
  "google_drive_upload",
  // AI tasks
  "ai_task",
];

// GET - Get a specific task
export async function GET(
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

    // Get task with workflow ownership check
    const { data: task } = await supabase
      .from("workflow_tasks")
      .select("*, workflow:workflows(owner_id)")
      .eq("workflow_task_id", taskId)
      .single();

    if (!task || task.workflow.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Task not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

// PUT - Update a task
export async function PUT(
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
    const { data: existingTask } = await supabase
      .from("workflow_tasks")
      .select("*, workflow:workflows(owner_id)")
      .eq("workflow_task_id", taskId)
      .single();

    if (!existingTask || existingTask.workflow.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Task not found or access denied" },
        { status: 404 }
      );
    }

    const taskData: Partial<Task> = await request.json();

    // Validate task type if it's being updated
    if (taskData.task_type && !VALID_TASK_TYPES.includes(taskData.task_type)) {
      return NextResponse.json({ error: "Invalid task type" }, { status: 400 });
    }

    // Update the task
    const { data: task, error } = await supabase
      .from("workflow_tasks")
      .update({
        name: taskData.name,
        description: taskData.description,
        task_type: taskData.task_type,
        config: taskData.config
          ? {
              ...taskData.config,
              // Store assigned agent information in the config
              assigned_assistant: taskData.assignedAssistant
                ? {
                    id: taskData.assignedAssistant.id,
                    name: taskData.assignedAssistant.name || "Agent",
                    avatar: taskData.assignedAssistant.avatar,
                  }
                : null,
            }
          : null,
        integration: taskData.integration,
        assistant_id: taskData.assignedAssistant?.id,
        updated_at: new Date().toISOString(),
      })
      .eq("workflow_task_id", taskId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a task
export async function DELETE(
  request: Request,
  props: { params: Promise<{ workflowId: string; taskId: string }> }
) {
  const { workflowId, taskId } = await props.params;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify task and workflow ownership
    const { data: task } = await supabase
      .from("workflow_tasks")
      .select("*, workflow:workflows(owner_id)")
      .eq("workflow_task_id", taskId)
      .single();

    if (!task || task.workflow.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Task not found or access denied" },
        { status: 404 }
      );
    }

    // Delete the task
    const { error } = await supabase
      .from("workflow_tasks")
      .delete()
      .eq("workflow_task_id", taskId);

    if (error) throw error;

    // Reorder remaining tasks
    const { data: remainingTasks, error: reorderError } = await supabase
      .from("workflow_tasks")
      .select("id, position")
      .eq("workflow_id", workflowId)
      .order("position");

    if (!reorderError && remainingTasks) {
      // Update positions to be sequential
      const updates = remainingTasks.map((t, index) => ({
        id: t.id,
        position: index,
      }));

      for (const update of updates) {
        await supabase
          .from("workflow_tasks")
          .update({ position: update.position })
          .eq("id", update.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
