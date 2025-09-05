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

  // Track created workflow run for error handling
  let createdWorkflowRunId: string | null = null;
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

    // Build DAG order from edges when available; fallback to position
    const allTasks = (workflow.workflow_tasks as Task[]) || [];
    const edges = (workflow.edges as Array<{ source: string; target: string }>) || [];
    const idToNodeId: Record<string, string> = {};
    for (const t of allTasks) {
      idToNodeId[t.workflow_task_id] = `task-${t.workflow_task_id}`;
    }
    const adj = new Map<string, Set<string>>();
    const indeg = new Map<string, number>();
    for (const t of allTasks) {
      indeg.set(t.workflow_task_id, 0);
      adj.set(t.workflow_task_id, new Set());
    }
    for (const e of edges) {
      const sourceTaskId = Object.keys(idToNodeId).find((tid) => idToNodeId[tid] === e.source);
      const targetTaskId = Object.keys(idToNodeId).find((tid) => idToNodeId[tid] === e.target);
      if (sourceTaskId && targetTaskId) {
        if (!adj.get(sourceTaskId)!.has(targetTaskId)) {
          adj.get(sourceTaskId)!.add(targetTaskId);
          indeg.set(targetTaskId, (indeg.get(targetTaskId) || 0) + 1);
        }
      }
    }
    const queue: string[] = [];
    for (const [tid, d] of indeg.entries()) {
      if ((d || 0) === 0) queue.push(tid);
    }
    const orderedTaskIds: string[] = [];
    while (queue.length) {
      const tid = queue.shift() as string;
      orderedTaskIds.push(tid);
      for (const nxt of adj.get(tid) || []) {
        const nd = (indeg.get(nxt) || 0) - 1;
        indeg.set(nxt, nd);
        if (nd === 0) queue.push(nxt);
      }
    }
    const tasks = (orderedTaskIds.length ? orderedTaskIds : allTasks.map((t) => t.workflow_task_id))
      .map((tid) => allTasks.find((t) => t.workflow_task_id === tid)!)
      .filter(Boolean);

    if (tasks.length === 0) {
      return NextResponse.json(
        { error: "Workflow has no tasks" },
        { status: 400 }
      );
    }

    // Create a workflow run record
    const generatedWorkflowRunId = (globalThis as any).crypto?.randomUUID?.();
    const { data: workflowRun, error: workflowRunError } = await supabase
      .from("workflow_runs")
      .insert({
        ...(generatedWorkflowRunId ? { run_id: generatedWorkflowRunId } : {}),
        workflow_id: workflowId,
        status: "running",
        started_at: new Date().toISOString(),
        metadata: {},
        owner_id: user.id,
      })
      .select("run_id")
      .single();

    if (workflowRunError || !workflowRun?.run_id) {
      console.error("Failed to create workflow run:", workflowRunError ? JSON.stringify(workflowRunError) : workflowRunError);
      return NextResponse.json(
        { error: "Failed to create workflow run", details: workflowRunError?.message || null, code: (workflowRunError as any)?.code || null },
        { status: 500 }
      );
    }
    createdWorkflowRunId = workflowRun.run_id;

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
        const taskRunId = (globalThis as any).crypto?.randomUUID?.();
        const { data: taskRun, error: trErr } = await supabase
          .from("workflow_task_runs")
          .insert({
            ...(taskRunId ? { run_id: taskRunId } : {}),
            workflow_run_id: workflowRun.run_id,
            workflow_task_id: task.workflow_task_id,
            status: "pending",
            started_at: new Date().toISOString(),
            metadata: {},
            owner_id: user.id,
          })
          .select()
          .single();
        if (trErr) {
          console.error("Failed to create workflow_task_run:", JSON.stringify(trErr));
          return null as any;
        }
        return taskRun;
      })
    );

    // Execute tasks sequentially with per-node thread/input options
    const client = new Client({
      apiUrl: process.env.LANGGRAPH_API_URL,
      apiKey: process.env.LANGSMITH_API_KEY,
    });
    // SSE stream for client progress
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Default workflow-level thread (used when nodes choose workflow mode)
          const wfThread = await client.threads.create();
          const workflowThreadId = wfThread.thread_id;
          let previousOutput: unknown = null;
          const nodeIdToThreadId: Record<string, string> = {};

          for (const task of tasks) {
            // Emit start event
            controller.enqueue(
              encoder.encode(
                `event: task-start\n` +
                  `data: ${JSON.stringify({ workflow_task_id: task.workflow_task_id, name: task.name })}\n\n`
              )
            );

            // Mark run row running
            const taskRun = taskRuns.find((tr) => tr?.workflow_task_id === task.workflow_task_id);
            if (taskRun?.run_id) {
              await supabase
                .from("workflow_task_runs")
                .update({ status: "running" })
                .eq("run_id", taskRun.run_id);
            }

            // Determine thread for this node
            const mode: "workflow" | "new" | "from_node" = (task.config as any)?.context?.thread?.mode || "workflow";
            let threadIdForNode = workflowThreadId;
            if (mode === "new") {
              const t = await client.threads.create();
              threadIdForNode = t.thread_id;
            } else if (mode === "from_node") {
              const ref = (task.config as any)?.context?.thread?.nodeId;
              if (ref && nodeIdToThreadId[ref]) {
                threadIdForNode = nodeIdToThreadId[ref];
              }
            }

            // Build input messages based on inputSource
            const inputSource: "prompt" | "previous_output" | "prompt_and_previous_output" =
              (task.config as any)?.context?.inputSource || "prompt";
            const promptText = task.config?.input?.prompt || "";
            const messages: Array<{ role: string; content: string }> = [];
            // Always include this node's prompt as instruction if present
            if (promptText) {
              messages.push({ role: "user", content: promptText });
            }
            // Optionally include previous node output as additional context
            if (inputSource === "previous_output" && (previousOutput !== null && previousOutput !== undefined)) {
              messages.push({ role: "user", content: typeof previousOutput === 'string' ? previousOutput : JSON.stringify(previousOutput) });
            }

            const assistantId = task.assistant_id || task.config?.assigned_assistant?.id;
            const runStream = await client.runs.stream(threadIdForNode, assistantId as string, {
              input: { messages },
              streamMode: "updates",
              config: {
                configurable: {
                  ...(task.config || {}),
                  user_id: user.id,
                  assistant_id: assistantId,
                  ...(((task.config as any)?.outputOptions?.structuredJson)
                    ? { response_format: { type: "json_object" } }
                    : {}),
                },
              },
            });

            let finalEvent: any = null;
            let inputTokens = 0;
            let outputTokens = 0;
            for await (const evt of runStream) {
              const e: any = evt as any;
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
            nodeIdToThreadId[task.workflow_task_id] = threadIdForNode;

            // Persist completion
            if (taskRun?.run_id) {
              await supabase
                .from("workflow_task_runs")
                .update({ status: "completed", completed_at: new Date().toISOString(), result: previousOutput })
                .eq("run_id", taskRun.run_id);
            }

            // Emit complete event
            controller.enqueue(
              encoder.encode(
                `event: task-complete\n` +
                  `data: ${JSON.stringify({ workflow_task_id: task.workflow_task_id, result: previousOutput, thread_id: threadIdForNode })}\n\n`
              )
            );

            // Record usage
            try {
              if (!inputTokens && !outputTokens) {
                const promptStr = typeof messages?.[0]?.content === 'string' ? messages[0].content : JSON.stringify(messages?.[0]?.content ?? "");
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
                sessionId: threadIdForNode,
              });
            } catch (e) {
              console.error("Failed to record rate limit usage for workflow task:", e);
            }
          }

          // Mark workflow run completed with final result and update workflow status
          try {
            await supabase
              .from("workflow_runs")
              .update({
                status: "completed",
                completed_at: new Date().toISOString(),
                result: previousOutput,
              })
              .eq("run_id", createdWorkflowRunId!);

            await supabase
              .from("workflows")
              .update({ status: "completed", last_run_at: new Date().toISOString() })
              .eq("workflow_id", workflowId);
          } catch (e) {
            console.error("Failed to finalize workflow run:", e);
          }

          controller.enqueue(encoder.encode(`event: done\ndata: {"ok":true}\n\n`));
          controller.close();
        } catch (err) {
          console.error("Workflow SSE error:", err);
          try {
            if (createdWorkflowRunId) {
              await supabase
                .from("workflow_runs")
                .update({
                  status: "failed",
                  completed_at: new Date().toISOString(),
                  error: err instanceof Error ? err.message : String(err),
                })
                .eq("run_id", createdWorkflowRunId);
            }
          } catch (e) {
            console.error("Failed to mark workflow run failed:", e);
          }
          controller.enqueue(
            encoder.encode(
              `event: error\n` +
                `data: ${JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
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

    // Attempt to mark the workflow run failed if created
    if (createdWorkflowRunId) {
      try {
        await supabase
          .from("workflow_runs")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            error: error instanceof Error ? error.message : String(error),
          })
          .eq("run_id", createdWorkflowRunId);
      } catch (e) {
        console.error("Failed to update workflow run after error:", e);
      }
    }

    return NextResponse.json(
      { error: "Failed to execute workflow" },
      { status: 500 }
    );
  }
}
