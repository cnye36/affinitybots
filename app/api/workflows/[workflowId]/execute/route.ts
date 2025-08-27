import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Task } from "@/types/workflow";
import { Client } from "@langchain/langgraph-sdk";
import { rateLimiter } from "@/lib/rateLimiting";

export async function POST(
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

    // Verify workflow ownership and get tasks
    const { data: workflow } = await supabase
      .from("workflows")
      .select("*, workflow_tasks(*)")
      .eq("workflow_id", workflowId)
      .single();

    if (!workflow || workflow.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Workflow not found or access denied" },
        { status: 404 }
      );
    }

    // Sort tasks by position
    const tasks = (workflow.workflow_tasks as Task[]).sort(
      (a: Task, b: Task) => (a.position ?? 0) - (b.position ?? 0)
    );

    if (tasks.length === 0) {
      return NextResponse.json(
        { error: "Workflow has no tasks" },
        { status: 400 }
      );
    }

    // Create a workflow run record
    const { data: workflowRun } = await supabase
      .from("workflow_runs")
      .insert({
        workflow_id: workflowId,
        status: "running",
        started_at: new Date().toISOString(),
        metadata: {},
      })
      .select()
      .single();

    // Update workflow status
    await supabase
      .from("workflows")
      .update({
        status: "running",
        last_run_at: new Date().toISOString(),
      })
      .eq("workflow_id", workflowId);

    // Create task run records for each task
    const taskRuns = await Promise.all(
      tasks.map(async (task: Task) => {
        const { data: taskRun } = await supabase
          .from("workflow_task_runs")
          .insert({
            workflow_run_id: workflowRun.run_id,
            workflow_task_id: task.workflow_task_id,
            status: "pending",
            started_at: new Date().toISOString(),
            metadata: {},
          })
          .select()
          .single();
        return taskRun;
      })
    );

    // Execute tasks sequentially in a single LangGraph thread, passing outputs along
    const client = new Client({
      apiUrl: process.env.LANGGRAPH_API_URL,
      apiKey: process.env.LANGSMITH_API_KEY,
    });

    // Create a persistent thread for this workflow execution
    const thread = await client.threads.create();
    const threadId = thread.thread_id;

    let previousOutput: unknown = null;
    for (const task of tasks) {
      const input = {
        messages: [
          previousOutput
            ? { role: "user", content: JSON.stringify(previousOutput) }
            : { role: "user", content: task.config?.input?.prompt || "" },
        ],
      };

      const assistantId = task.assistant_id || task.config?.assigned_assistant?.id;
      const runStream = await client.runs.stream(threadId, assistantId as string, {
        input,
        streamMode: "updates",
        config: {
          configurable: {
            ...(task.config || {}),
            user_id: user.id,
            assistant_id: assistantId,
          },
        },
      });

      let finalEvent: any = null;
      let inputTokens = 0;
      let outputTokens = 0;
      for await (const evt of runStream) {
        const e: any = evt as any;
        // evt.event is one of updates/metadata/feedback/error
        if (e.event === "updates" && e.data) {
          finalEvent = e;
        }
        if (e.event && /metadata$/i.test(e.event)) {
          const usage =
            e.data?.usage ||
            e.data?.token_usage ||
            e.data?.usage_metadata ||
            e.data?.message?.usage ||
            e.data?.response?.usage ||
            null;
          if (usage) {
            inputTokens = Math.max(
              inputTokens,
              Number(
                usage.input_tokens || usage.prompt_tokens || usage.total_input_tokens || 0
              )
            );
            outputTokens = Math.max(
              outputTokens,
              Number(
                usage.output_tokens || usage.completion_tokens || usage.total_output_tokens || 0
              )
            );
          }
        }
      }

      previousOutput = finalEvent?.data ?? null;

      // Persist output to task_runs if we created them earlier
      const taskRun = taskRuns.find((tr) => tr?.workflow_task_id === task.workflow_task_id);
      if (taskRun?.run_id) {
        await supabase
          .from("task_runs")
          .update({ status: "completed", completed_at: new Date().toISOString(), result: previousOutput })
          .eq("run_id", taskRun.run_id);
      }

      // Record token usage per task best-effort
      try {
        // Fallback estimate if provider usage not present
        if (!inputTokens && !outputTokens) {
          const promptStr = typeof input.messages?.[0]?.content === 'string' ? input.messages[0].content : JSON.stringify(input.messages?.[0]?.content ?? "");
          const outputStr = typeof previousOutput === 'string' ? previousOutput : JSON.stringify(previousOutput ?? "");
          inputTokens = Math.ceil((promptStr?.length || 0) / 4);
          outputTokens = Math.ceil((outputStr?.length || 0) / 4);
        }
        await rateLimiter.recordUsage({
          userId: user.id,
          inputTokens: inputTokens || 0,
          outputTokens: outputTokens || 0,
          timestamp: Date.now(),
          model: "workflow-task",
          sessionId: threadId,
        });
      } catch (e) {
        console.error("Failed to record rate limit usage for workflow task:", e);
      }
    }

    return NextResponse.json({ workflow_run_id: workflowRun.run_id });
  } catch (error) {
    console.error("Error executing workflow:", error);

    // Update workflow status to failed
    await supabase
      .from("workflows")
      .update({
        status: "failed",
        last_run_at: new Date().toISOString(),
      })
      .eq("workflow_id", workflowId);

    return NextResponse.json(
      { error: "Failed to execute workflow" },
      { status: 500 }
    );
  }
}
