import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Client } from "@langchain/langgraph-sdk";

const MAX_TOOL_CALL_DEPTH = 6;

const collectToolCalls = (value: any, calls: string[], depth = 0) => {
  if (value == null || depth > MAX_TOOL_CALL_DEPTH) return;
  if (Array.isArray(value)) {
    for (const item of value) collectToolCalls(item, calls, depth + 1);
    return;
  }
  if (typeof value !== "object") return;

  const toolCalls = (value as any).tool_calls;
  if (Array.isArray(toolCalls)) {
    for (const call of toolCalls) {
      const name = call?.name || call?.tool_name || call?.toolName;
      if (typeof name === "string" && name.length > 0) calls.push(name);
    }
  }

  const additionalToolCalls = (value as any)?.additional_kwargs?.tool_calls;
  if (Array.isArray(additionalToolCalls)) {
    for (const call of additionalToolCalls) {
      const name = call?.name || call?.tool_name || call?.toolName;
      if (typeof name === "string" && name.length > 0) calls.push(name);
    }
  }

  if ((value as any).type === "tool") {
    const name = (value as any).name || (value as any).tool;
    if (typeof name === "string" && name.length > 0) calls.push(name);
  }

  for (const key of Object.keys(value as Record<string, unknown>)) {
    collectToolCalls((value as any)[key], calls, depth + 1);
  }
};

const extractToolCallsFromCheckpoint = (checkpoint: any) => {
  const calls: string[] = [];
  collectToolCalls(checkpoint, calls);
  return calls;
};

// GET /api/workflows/:workflowId/executions/:runId
// Returns the workflow run plus its workflow_task_runs
export async function GET(
  request: Request,
  props: { params: Promise<{ workflowId: string; runId: string }> }
) {
  const { workflowId, runId } = await props.params;
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify workflow ownership
    const { data: workflow } = await supabase
      .from("workflows")
      .select("owner_id")
      .eq("workflow_id", workflowId)
      .single();
    if (!workflow || workflow.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Workflow not found or access denied" },
        { status: 404 }
      );
    }

    // Fetch run row with workflow snapshot
    const { data: run, error: runErr } = await supabase
      .from("workflow_runs")
      .select("run_id, workflow_id, status, started_at, completed_at, error, result, metadata, workflow_snapshot")
      .eq("run_id", runId)
      .eq("workflow_id", workflowId)
      .single();
    if (runErr || !run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    // Fetch task runs
    const { data: taskRuns, error: trErr } = await supabase
      .from("workflow_task_runs")
      .select("run_id, workflow_task_id, status, started_at, completed_at, error, result, metadata")
      .eq("workflow_run_id", runId)
      .order("started_at", { ascending: true });
    if (trErr) throw trErr;

    const taskRunRows = taskRuns || [];
    const threadIds = taskRunRows
      .map((taskRun) => (taskRun as any)?.metadata?.thread_id)
      .filter((value) => typeof value === "string" && value.length > 0);
    const startedTimes = taskRunRows
      .map((taskRun) => taskRun.started_at)
      .filter(Boolean)
      .map((value) => new Date(value).getTime());
    const completedTimes = taskRunRows
      .map((taskRun) => taskRun.completed_at)
      .filter(Boolean)
      .map((value) => new Date(value as string).getTime());
    const windowStart = startedTimes.length
      ? new Date(Math.min(...startedTimes) - 5 * 60 * 1000).toISOString()
      : null;
    const windowEnd = completedTimes.length
      ? new Date(Math.max(...completedTimes) + 5 * 60 * 1000).toISOString()
      : null;

    let langgraphRuns: any[] = [];
    if (threadIds.length > 0) {
      let runQuery = supabase
        .from("run")
        .select("run_id, thread_id, assistant_id, created_at, updated_at, status, metadata, kwargs")
        .in("thread_id", threadIds);
      if (windowStart) runQuery = runQuery.gte("created_at", windowStart);
      if (windowEnd) runQuery = runQuery.lte("created_at", windowEnd);
      const { data: runsData } = await runQuery;
      langgraphRuns = runsData || [];
    }

    const runsByThread: Record<string, any[]> = {};
    for (const runRow of langgraphRuns) {
      const threadId = runRow.thread_id as string;
      runsByThread[threadId] = runsByThread[threadId] || [];
      runsByThread[threadId].push(runRow);
    }

    const runById: Record<string, any> = {};
    for (const runRow of langgraphRuns) {
      if (runRow.run_id) runById[runRow.run_id as string] = runRow;
    }

    const matchLanggraphRun = (taskRun: any) => {
      const metadata = taskRun?.metadata || {};
      const explicitRunId = metadata?.langgraph_run_id;
      if (explicitRunId && runById[explicitRunId]) return runById[explicitRunId];

      const threadId = metadata?.thread_id;
      if (!threadId || !runsByThread[threadId]) return null;
      const assistantId = metadata?.assistant_id;
      const candidates = runsByThread[threadId].filter((row) =>
        assistantId ? row.assistant_id === assistantId : true
      );
      if (!candidates.length) return null;

      const start = taskRun.started_at ? new Date(taskRun.started_at).getTime() : null;
      const end = taskRun.completed_at ? new Date(taskRun.completed_at).getTime() : null;
      const inWindow = candidates.filter((row) => {
        if (!start) return true;
        const created = row.created_at ? new Date(row.created_at).getTime() : null;
        if (!created) return true;
        if (end) return created >= start - 5 * 60 * 1000 && created <= end + 5 * 60 * 1000;
        return created >= start - 5 * 60 * 1000;
      });
      const pool = inWindow.length ? inWindow : candidates;
      if (!start) return pool[0];

      let best = pool[0];
      let bestDelta = Math.abs(new Date(pool[0].created_at).getTime() - start);
      for (const row of pool.slice(1)) {
        const created = row.created_at ? new Date(row.created_at).getTime() : start;
        const delta = Math.abs(created - start);
        if (delta < bestDelta) {
          best = row;
          bestDelta = delta;
        }
      }
      return best;
    };

    const matchedRuns = taskRunRows
      .map((taskRun) => matchLanggraphRun(taskRun))
      .filter((row) => row?.run_id)
      .map((row) => row.run_id as string);

    let checkpoints: any[] = [];
    if (matchedRuns.length > 0) {
      const { data: checkpointRows } = await supabase
        .from("checkpoints")
        .select("run_id, checkpoint, metadata, checkpoint_ns")
        .in("run_id", matchedRuns);
      checkpoints = checkpointRows || [];
    }

    const toolCallsByRun: Record<string, { names: string[]; count: number }> = {};
    for (const checkpointRow of checkpoints) {
      const runKey = checkpointRow.run_id as string;
      const checkpoint = checkpointRow.checkpoint ?? checkpointRow;
      const calls = extractToolCallsFromCheckpoint(checkpoint);
      if (!calls.length) continue;
      const entry = toolCallsByRun[runKey] || { names: [], count: 0 };
      entry.names.push(...calls);
      entry.count += calls.length;
      toolCallsByRun[runKey] = entry;
    }

    const taskRunsWithAnalytics = taskRunRows.map((taskRun) => {
      const matchedRun = matchLanggraphRun(taskRun);
      const runIdValue = matchedRun?.run_id || (taskRun as any)?.metadata?.langgraph_run_id || null;
      const toolCalls = runIdValue && toolCallsByRun[runIdValue] ? toolCallsByRun[runIdValue] : null;
      const startedAt = taskRun.started_at ? new Date(taskRun.started_at).getTime() : null;
      const completedAt = taskRun.completed_at ? new Date(taskRun.completed_at).getTime() : null;
      const durationMs = startedAt && completedAt ? Math.max(0, completedAt - startedAt) : null;
      return {
        ...taskRun,
        analytics: {
          duration_ms: durationMs,
          thread_id: (taskRun as any)?.metadata?.thread_id || null,
          langgraph_run_id: runIdValue,
          tool_calls: toolCalls?.names || [],
          tool_call_count: toolCalls?.count || 0,
        },
      };
    });

    const runDurationMs =
      run.started_at && run.completed_at
        ? Math.max(0, new Date(run.completed_at).getTime() - new Date(run.started_at).getTime())
        : null;

    // Check if detailed thread data is requested
    const url = new URL(request.url);
    const includeThreadData = url.searchParams.get("includeThreadData") === "true";

    let enhancedTaskRuns = taskRunsWithAnalytics;

    if (includeThreadData) {
      // Initialize LangGraph client
      const client = new Client({
        apiUrl: process.env.LANGGRAPH_API_URL,
        apiKey: process.env.LANGSMITH_API_KEY,
      });

      // Fetch thread data for each task run
      enhancedTaskRuns = await Promise.all(
        taskRunsWithAnalytics.map(async (taskRun) => {
          const threadId = taskRun.analytics?.thread_id;

          if (!threadId) {
            return { ...taskRun, threadData: null };
          }

          try {
            // Get thread state from LangGraph
            const state = await client.threads.getState(threadId);
            // Type assertion: LangGraph state.values can contain messages array
            const messages = ((state?.values as any)?.messages as any[]) || [];

            // Parse messages to extract different components
            const inputMessages: Array<{ content: string; timestamp: string }> = [];
            const aiResponses: Array<{
              content: string;
              reasoning_content: string | null;
              hasReasoning: boolean;
              tool_calls: any[];
              timestamp: string;
            }> = [];
            const toolResults: Array<{
              tool_call_id: string;
              name: string;
              content: any;
              timestamp: string;
            }> = [];

            for (const msg of messages) {
              const timestamp = msg.timestamp || taskRun.started_at || new Date().toISOString();

              if (msg.type === "human" || msg.type === "user") {
                inputMessages.push({
                  content: msg.content || "",
                  timestamp,
                });
              } else if (msg.type === "ai" || msg.type === "assistant") {
                const reasoningContent =
                  msg.reasoning_content ||
                  msg.response_metadata?.reasoning_content ||
                  msg.response_metadata?.reasoning ||
                  null;

                const toolCalls = msg.tool_calls || msg.additional_kwargs?.tool_calls || [];

                aiResponses.push({
                  content: msg.content || "",
                  reasoning_content: reasoningContent,
                  hasReasoning: !!reasoningContent,
                  tool_calls: toolCalls,
                  timestamp,
                });
              } else if (msg.type === "tool") {
                toolResults.push({
                  tool_call_id: msg.tool_call_id || "",
                  name: msg.name || "",
                  content: msg.content,
                  timestamp,
                });
              }
            }

            // Extract and enrich tool calls from AI responses
            const toolCalls: Array<{
              id: string;
              name: string;
              arguments: any;
              result: any;
              timestamp: string;
            }> = [];

            for (const response of aiResponses) {
              if (response.tool_calls && Array.isArray(response.tool_calls)) {
                for (const call of response.tool_calls) {
                  const callId = call.id || "";
                  const callName = call.name || call.function?.name || "";
                  const callArgs = call.args || call.arguments || call.function?.arguments || {};

                  // Find matching result
                  const result = toolResults.find(
                    (r) => r.tool_call_id === callId || r.name === callName
                  );

                  toolCalls.push({
                    id: callId,
                    name: callName,
                    arguments: callArgs,
                    result: result?.content || null,
                    timestamp: response.timestamp,
                  });
                }
              }
            }

            return {
              ...taskRun,
              threadData: {
                inputMessages,
                aiResponses,
                toolCalls,
              },
            };
          } catch (error) {
            console.error(`Failed to fetch thread data for ${threadId}:`, error);
            return { ...taskRun, threadData: null };
          }
        })
      );
    }

    // Get trigger data if available
    let triggerData = null;
    if (run.workflow_snapshot?.triggers?.[0]) {
      const trigger = run.workflow_snapshot.triggers[0];
      triggerData = {
        trigger_id: trigger.trigger_id,
        name: trigger.name,
        type: trigger.trigger_type,
        config: trigger.config,
        initialPayload: run.metadata?.initialPayload || null,
      };
    }

    return NextResponse.json({
      run: { ...run, duration_ms: runDurationMs, triggerData },
      taskRuns: enhancedTaskRuns,
    });
  } catch (err) {
    console.error("Error getting execution:", err);
    return NextResponse.json(
      { error: "Failed to get execution" },
      { status: 500 }
    );
  }
}
