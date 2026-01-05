"use client";

import { useEffect, useMemo, useState } from "react";
import { Edge } from "reactflow";
import { createClient } from "@/supabase/client";
import { WorkflowNode, TriggerType } from "@/types/workflow";
import { WorkflowCanvas } from "@/components/workflows/v2/WorkflowCanvas";
import { Button } from "@/components/ui/button";
import { NodeDetailPanel } from "@/components/workflows/execution/NodeDetailPanel";
import { RunDetailPanel } from "@/components/workflows/execution/RunDetailPanel";

interface WorkflowTrigger {
  trigger_id: string;
  name: string;
  description: string;
  trigger_type: string;
  workflow_id: string;
  config: Record<string, unknown>;
}

interface WorkflowExecutionsProps {
  workflowId: string;
  initialRunId?: string | null;
}

type RunListItem = {
  run_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  error?: string | null;
  metadata?: Record<string, unknown> | null;
};

type TaskRunWithThreadData = {
  run_id: string;
  workflow_task_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  result: any;
  error: string | null;
  metadata: any;
  analytics?: {
    duration_ms: number | null;
    thread_id: string | null;
    langgraph_run_id: string | null;
    tool_calls: string[];
    tool_call_count: number;
  };
  threadData?: {
    inputMessages: Array<{ content: string; timestamp: string }>;
    aiResponses: Array<{
      content: string;
      reasoning_content: string | null;
      hasReasoning: boolean;
      tool_calls: any[];
      timestamp: string;
    }>;
    toolCalls: Array<{
      id: string;
      name: string;
      arguments: any;
      result: any;
      timestamp: string;
    }>;
  } | null;
};

type RunDetails = {
  run: RunListItem & {
    workflow_snapshot?: {
      nodes?: WorkflowNode[];
      edges?: Edge[];
      triggers?: WorkflowTrigger[];
      timestamp?: string;
    };
    duration_ms?: number | null;
    triggerData?: {
      trigger_id: string;
      name: string;
      type: string;
      config: Record<string, unknown>;
      initialPayload: unknown;
    } | null;
    result?: unknown;
    error?: string | null;
  };
  taskRuns: TaskRunWithThreadData[];
};

export function WorkflowExecutions({ workflowId, initialRunId }: WorkflowExecutionsProps) {
  const supabase = createClient();
  const [runs, setRuns] = useState<RunListItem[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(initialRunId || null);
  
  // Update selected run when initialRunId changes
  useEffect(() => {
    if (initialRunId) {
      setSelectedRunId(initialRunId)
    }
  }, [initialRunId])
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [taskRunsByTaskId, setTaskRunsByTaskId] = useState<Record<string, TaskRunWithThreadData>>({});
  const [loading, setLoading] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [runDetails, setRunDetails] = useState<RunDetails | null>(null);

  const isValidUuid = (value?: string | null) =>
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    );

  // Load execution snapshot and run data
  useEffect(() => {
    if (!selectedRunId) return
    let mounted = true
    setActiveNodeId(null)
    setLoading(true)
    setRunDetails(null)
    setTaskRunsByTaskId({})

    ;(async () => {
      if (!isValidUuid(workflowId) || !isValidUuid(selectedRunId)) {
        if (mounted) setLoading(false)
        return
      }

      const res = await fetch(
        `/api/workflows/${workflowId}/executions/${selectedRunId}?includeThreadData=true`
      )
      if (!res.ok) {
        if (mounted) setLoading(false)
        return
      }

      const data = (await res.json()) as RunDetails
      if (!mounted) return

      setRunDetails(data)

      const byTaskId: Record<string, TaskRunWithThreadData> = {}
      for (const tr of data.taskRuns || []) {
        byTaskId[tr.workflow_task_id] = tr
      }
      setTaskRunsByTaskId(byTaskId)

      let storedNodes: WorkflowNode[] = []
      let storedEdges: Edge[] = []
      let triggers: WorkflowTrigger[] = []

      if (data.run.workflow_snapshot) {
        storedNodes = (data.run.workflow_snapshot.nodes || []) as WorkflowNode[]
        storedEdges = (data.run.workflow_snapshot.edges || []) as Edge[]
        triggers = (data.run.workflow_snapshot.triggers || []) as WorkflowTrigger[]
      } else {
        const [workflowResult, triggersResult] = await Promise.all([
          supabase
            .from("workflows")
            .select("nodes, edges")
            .eq("workflow_id", workflowId)
            .single(),
          supabase
            .from("workflow_triggers")
            .select("*")
            .eq("workflow_id", workflowId),
        ])

        if (workflowResult.error || triggersResult.error) {
          if (mounted) setLoading(false)
          return
        }

        storedNodes = (workflowResult.data?.nodes || []) as WorkflowNode[]
        storedEdges = (workflowResult.data?.edges || []) as Edge[]
        triggers = (triggersResult.data || []) as WorkflowTrigger[]
      }

      const hasTriggerNodes = storedNodes.some((node) => node.type === "trigger")
      const triggerNodes: WorkflowNode[] = hasTriggerNodes
        ? []
        : triggers.map((trigger) => ({
            id: `trigger-${trigger.trigger_id}`,
            type: "trigger" as const,
            position: { x: 100, y: 100 },
            data: {
              name: trigger.name,
              description: trigger.description,
              trigger_type: trigger.trigger_type as TriggerType,
              trigger_id: trigger.trigger_id,
              workflow_id: workflowId,
              config: trigger.config,
              position: { x: 100, y: 100 },
              hasConnectedTask: storedNodes.length > 0,
              isReadOnly: true,
            },
          } as WorkflowNode))

      const normalizedNodes: WorkflowNode[] = storedNodes.map((node) => {
        if (node.type === "task") {
          return {
            ...node,
            data: {
              ...node.data,
              isReadOnly: true,
            },
          } as WorkflowNode
        } else if (node.type === "trigger") {
          return {
            ...node,
            data: {
              ...node.data,
              isReadOnly: true,
            },
          } as WorkflowNode
        } else {
          return {
            ...node,
            data: {
              ...node.data,
              isReadOnly: true,
            },
          } as WorkflowNode
        }
      })

      setNodes([...triggerNodes, ...normalizedNodes])
      setEdges(storedEdges)
      setLoading(false)
    })()

    return () => {
      mounted = false
    }
  }, [supabase, workflowId, selectedRunId])

  // Load run list
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!isValidUuid(workflowId)) return;
      const res = await fetch(`/api/workflows/${workflowId}/executions`);
      if (!res.ok) return;
      const data = (await res.json()) as RunListItem[];
      if (!mounted) return;
      setRuns(data);
      if (data.length && !selectedRunId) setSelectedRunId(data[0].run_id);
    })();
    return () => {
      mounted = false;
    };
  }, [workflowId]);

  

  // Decorate nodes with execution status and result
  const decoratedNodes = useMemo(() => {
    return nodes.map((n) => {
      if (n.type === "task") {
        const tr = taskRunsByTaskId[n.data.workflow_task_id];
        return {
          ...n,
          data: {
            ...n.data,
            status: tr?.status || n.data.status || "idle",
            previousNodeOutput: tr?.result || null,
            onAddTask: undefined,
            isActive: activeNodeId === n.id,
          },
          draggable: false,
        } as WorkflowNode;
      } else if (n.type === "trigger") {
        return {
          ...n,
          data: {
            ...n.data,
            isActive: activeNodeId === n.id,
          },
          draggable: false,
        } as WorkflowNode;
      }
      return n;
    });
  }, [nodes, taskRunsByTaskId, activeNodeId]);

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-56 lg:w-64 xl:w-72 border-r border-b md:border-b-0 p-2 md:p-3 space-y-2 overflow-y-auto max-h-[30vh] md:max-h-full">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium">Executions</div>
          <Button size="sm" variant="ghost" onClick={async () => {
            const res = await fetch(`/api/workflows/${workflowId}/executions`);
            if (res.ok) setRuns(await res.json());
          }}>Refresh</Button>
        </div>
        {runs.length === 0 && (
          <div className="text-xs text-muted-foreground">No executions yet.</div>
        )}
        <div className="space-y-1">
          {runs.map((r) => (
            <button
              key={r.run_id}
              onClick={() => setSelectedRunId(r.run_id)}
              className={`w-full text-left rounded-md border px-2 py-2 text-xs hover:bg-muted ${
                selectedRunId === r.run_id ? "bg-muted" : "bg-background"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{new Date(r.started_at).toLocaleString()}</span>
                <span className={`uppercase text-[10px] ${r.status === "completed" ? "text-green-600" : r.status === "failed" ? "text-red-600" : "text-blue-600"}`}>{r.status}</span>
              </div>
              {r.completed_at && (
                <div className="text-[10px] text-muted-foreground">Done: {new Date(r.completed_at).toLocaleTimeString()}</div>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* Graph/detail */}
      <div className="flex-1 relative min-h-[40vh] md:min-h-0">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">Loading run…</div>
        )}
        <WorkflowCanvas
          isExecutionsView={true}
          overrideNodes={decoratedNodes}
          overrideEdges={edges}
          overrideActiveNodeId={activeNodeId}
          onNodeClick={(nodeId) => setActiveNodeId(nodeId)}
        />
      </div>

      {/* Details panel */}
      <aside className="w-full md:w-80 lg:w-96 xl:w-[480px] border-l bg-background">
        {activeNodeId ? (() => {
          const node = nodes.find((n) => n.id === activeNodeId)
          if (!node) return null

          if (node.type !== "task" && node.type !== "trigger") {
            return (
              <RunDetailPanel
                run={runDetails?.run ?? null}
                taskRuns={runDetails?.taskRuns ?? []}
                nodes={nodes}
                isLoading={loading}
              />
            )
          }

          const taskId = activeNodeId.replace(/^task-/, "")
          const taskRun = taskRunsByTaskId[taskId] || null

          return (
            <NodeDetailPanel node={node} taskRun={taskRun} onClose={() => setActiveNodeId(null)} />
          )
        })() : (
          <RunDetailPanel
            run={runDetails?.run ?? null}
            taskRuns={runDetails?.taskRuns ?? []}
            nodes={nodes}
            isLoading={loading}
          />
        )}
      </aside>
    </div>
  );
}
