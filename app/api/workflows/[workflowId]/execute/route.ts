import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { Task } from "@/types/workflow";
import { Client } from "@langchain/langgraph-sdk";
import { rateLimiter } from "@/lib/rateLimiting";

/**
 * Execute an orchestrator workflow where a manager agent coordinates sub-agents
 */
async function executeOrchestratorWorkflow(
  workflow: any,
  workflowId: string,
  ownerId: string,
  supabase: any,
  request: Request
) {
  const encoder = new TextEncoder();

  // Create workflow run record
  const generatedWorkflowRunId = (globalThis as any).crypto?.randomUUID?.();
  const { data: workflowRun, error: workflowRunError } = await supabase
    .from("workflow_runs")
    .insert({
      ...(generatedWorkflowRunId ? { run_id: generatedWorkflowRunId } : {}),
      workflow_id: workflowId,
      status: "running",
      started_at: new Date().toISOString(),
      metadata: { execution_type: "orchestrator" },
      workflow_snapshot: {
        nodes: workflow.nodes || [],
        edges: workflow.edges || [],
        timestamp: new Date().toISOString(),
      },
      owner_id: ownerId,
    })
    .select("run_id")
    .single();

  if (workflowRunError || !workflowRun?.run_id) {
    console.error("Failed to create workflow run:", workflowRunError);
    return NextResponse.json(
      { error: "Failed to create workflow run", details: workflowRunError?.message },
      { status: 500 }
    );
  }

  const workflowRunId = workflowRun.run_id;

  // Update workflow status to running
  await supabase
    .from("workflows")
    .update({
      status: "running",
      last_run_at: new Date().toISOString(),
    })
    .eq("workflow_id", workflowId);

  // Build available agents from workflow_tasks
  const allTasks = workflow.workflow_tasks || [];
  const availableAgents: Record<string, any> = {};

  for (const task of allTasks) {
    const assistantId = task.assistant_id || task.config?.assigned_assistant?.id;
    if (assistantId) {
      availableAgents[task.name] = {
        workflow_task_id: task.workflow_task_id,
        name: task.name,
        description: task.description || "",
        assistant_id: assistantId,
        config: task.config || {},
      };
    }
  }

  // Stream orchestrator execution
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const client = new Client({
          apiUrl: process.env.LANGGRAPH_API_URL,
          apiKey: process.env.LANGSMITH_API_KEY,
        });

        // Create orchestrator thread
        const orchestratorThread = await client.threads.create();

        // Emit orchestrator start event
        controller.enqueue(
          encoder.encode(
            `event: orchestrator-start\n` +
              `data: ${JSON.stringify({ thread_id: orchestratorThread.thread_id, available_agents: Object.keys(availableAgents) })}\n\n`
          )
        );

        // Run orchestrator graph
        const runStream = await client.runs.stream(
          orchestratorThread.thread_id,
          "orchestratorAgent", // Graph ID from langgraph.json
          {
            input: {
              available_agents: availableAgents,
            },
            streamMode: "updates" as any,
            config: {
              configurable: {
                user_id: ownerId,
                orchestrator_config: workflow.orchestrator_config,
              },
            },
          }
        );

        let finalResult: any = null;
        let iterationCount = 0;

        // Process stream events
        for await (const evt of runStream) {
          const e: any = evt;

          if (e.event === "updates" && e.data) {
            const node = Object.keys(e.data)[0];
            const nodeData = e.data[node];

            if (node === "manager") {
              // Manager made a decision
              controller.enqueue(
                encoder.encode(
                  `event: manager-decision\n` +
                    `data: ${JSON.stringify({ iteration: iterationCount++, decision: nodeData })}\n\n`
                )
              );
            } else if (node === "execute_agent") {
              // Sub-agent was executed
              controller.enqueue(
                encoder.encode(
                  `event: agent-execution\n` +
                    `data: ${JSON.stringify({ result: nodeData })}\n\n`
                )
              );
            }

            finalResult = e.data;
          }
        }

        // Update workflow run with final result
        await supabase
          .from("workflow_runs")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            result: finalResult,
          })
          .eq("run_id", workflowRunId);

        // Update workflow status
        await supabase
          .from("workflows")
          .update({ status: "completed", last_run_at: new Date().toISOString() })
          .eq("workflow_id", workflowId);

        // Send completion event
        controller.enqueue(encoder.encode(`event: done\ndata: {"ok":true}\n\n`));
        controller.close();
      } catch (err) {
        console.error("Orchestrator workflow error:", err);

        // Mark run as failed
        try {
          await supabase
            .from("workflow_runs")
            .update({
              status: "failed",
              completed_at: new Date().toISOString(),
              error: err instanceof Error ? err.message : String(err),
            })
            .eq("run_id", workflowRunId);
        } catch (e) {
          console.error("Failed to mark workflow run failed:", e);
        }

        // Send error event
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
}

export async function POST(
  request: Request,
  props: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await props.params;

  // Track created workflow run for error handling
  let createdWorkflowRunId: string | null = null;
  let supabase: any; // Declare at function level for error handling
  
  try {
    // Check for internal scheduled execution (from worker)
    const internalSecret = request.headers.get('x-internal-secret');
    const isScheduledExecution = internalSecret === process.env.INTERNAL_API_SECRET && internalSecret !== undefined;

    let user;
    let ownerId: string;

    if (isScheduledExecution) {
      // For scheduled executions, use admin client (bypasses RLS)
      supabase = getSupabaseAdmin();
      const { data: wf } = await supabase
        .from("workflows")
        .select("owner_id")
        .eq("workflow_id", workflowId)
        .single();
      
      if (!wf) {
        return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
      }
      ownerId = wf.owner_id;
    } else {
      // For user-initiated executions, use regular client and verify auth
      supabase = await createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      user = authUser;
      ownerId = authUser.id;
    }

    // Verify workflow ownership and get tasks
    const { data: workflow } = await supabase
      .from("workflows")
      .select("*, workflow_tasks(*)")
      .eq("workflow_id", workflowId)
      .single();

    if (!workflow || workflow.owner_id !== ownerId) {
      return NextResponse.json(
        { error: "Workflow not found or access denied" },
        { status: 404 }
      );
    }

    // Check workflow type and route to appropriate execution logic
    const workflowType = workflow.workflow_type || "sequential";

    if (workflowType === "orchestrator") {
      // Route to orchestrator execution
      return executeOrchestratorWorkflow(workflow, workflowId, ownerId, supabase, request);
    }

    // Continue with sequential workflow execution below
    // Optionally accept initial payload from trigger invocation
    let initialPayload: unknown = null;
    try {
      const parsed = await request.json();
      initialPayload = (parsed && typeof parsed === 'object') ? (parsed as any).initialPayload ?? null : null;
    } catch {}

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

    // Get triggers for the workflow snapshot
    const { data: triggers } = await supabase
      .from("workflow_triggers")
      .select("*")
      .eq("workflow_id", workflowId);

    // Create a workflow snapshot to preserve the state at execution time
    const workflowSnapshot = {
      nodes: workflow.nodes || [],
      edges: workflow.edges || [],
      triggers: triggers || [],
      timestamp: new Date().toISOString(),
    };

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
        workflow_snapshot: workflowSnapshot,
        owner_id: ownerId,
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
            owner_id: ownerId,
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
            // For the very first node, include initialPayload when provided
            if (!previousOutput && initialPayload != null) {
              try {
                messages.push({ role: "user", content: typeof initialPayload === 'string' ? initialPayload : JSON.stringify(initialPayload) });
              } catch {}
            }

            const assistantId = task.assistant_id || task.config?.assigned_assistant?.id;

            if (taskRun?.run_id) {
              // Attach assistant metadata when the run starts
              try {
                await supabase
                  .from("workflow_task_runs")
                  .update({ status: "running", metadata: { assistant_id: assistantId } })
                  .eq("run_id", taskRun.run_id);
              } catch {}
            }
            const runStream = await client.runs.stream(threadIdForNode, assistantId as string, {
              input: { messages },
              streamMode: "updates",
              config: {
                configurable: {
                  ...(task.config || {}),
                  user_id: ownerId,
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
                .update({
                  status: "completed",
                  completed_at: new Date().toISOString(),
                  result: previousOutput,
                  metadata: { assistant_id: assistantId, usage: { inputTokens, outputTokens } },
                })
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
                userId: ownerId,
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
        // Surface the created workflow run id for internal callers (e.g., scheduler worker)
        ...(createdWorkflowRunId ? { "x-workflow-run-id": createdWorkflowRunId } : {}),
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
