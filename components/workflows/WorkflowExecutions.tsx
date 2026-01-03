"use client";

import { useEffect, useMemo, useState } from "react";
import { Edge } from "reactflow";
import { createClient } from "@/supabase/client";
import { WorkflowNode } from "@/types/workflow";
import { WorkflowCanvas } from "@/components/workflows/v2/WorkflowCanvas";
import { Button } from "@/components/ui/button";
import { NodeDetailPanel } from "@/components/workflows/execution/NodeDetailPanel";

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
}

type RunListItem = {
  run_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  error?: string | null;
  metadata?: Record<string, unknown> | null;
};

export function WorkflowExecutions({ workflowId }: WorkflowExecutionsProps) {
  const supabase = createClient();
  const [runs, setRuns] = useState<RunListItem[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [taskRunsByTaskId, setTaskRunsByTaskId] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [detailedTaskRuns, setDetailedTaskRuns] = useState<Record<string, any>>({});
  const [loadingNodeData, setLoadingNodeData] = useState<string | null>(null);

  const isValidUuid = (value?: string | null) =>
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    );

  // Load workflow graph from the selected run's snapshot
  useEffect(() => {
    if (!selectedRunId) return;
    
    let mounted = true;
    (async () => {
      if (!isValidUuid(workflowId) || !isValidUuid(selectedRunId)) return;
      
      // Fetch the run data with snapshot
      const res = await fetch(`/api/workflows/${workflowId}/executions/${selectedRunId}`);
      if (!res.ok) return;
      const { run } = await res.json();
      
      if (!mounted) return;

      // Use the snapshot if available, otherwise fall back to current workflow state
      let storedNodes: any[] = [];
      let storedEdges: Edge[] = [];
      let triggers: any[] = [];

      if (run.workflow_snapshot) {
        // Use the historical snapshot
        storedNodes = run.workflow_snapshot.nodes || [];
        storedEdges = run.workflow_snapshot.edges || [];
        triggers = run.workflow_snapshot.triggers || [];
      } else {
        // Fallback to current workflow state for old runs without snapshots
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
        ]);

        if (workflowResult.error || triggersResult.error) return;
        
        storedNodes = (workflowResult.data?.nodes || []) as any[];
        storedEdges = (workflowResult.data?.edges || []) as Edge[];
        triggers = triggersResult.data || [];
      }

      // Create trigger nodes with proper positioning
      const triggerNodes: WorkflowNode[] = triggers.map((trigger: any, index: number) => ({
        id: `trigger-${trigger.trigger_id}`,
        type: "trigger" as const,
        position: { x: 100, y: 200 + (index * 100) }, // Left side, well-spaced
        data: {
          ...trigger,
          workflow_id: workflowId,
          hasConnectedTask: storedNodes.length > 0,
        },
        draggable: false,
        selectable: true,
      }));

      // Process stored task nodes and adjust positioning for better layout with multiple nodes
      const taskNodes: WorkflowNode[] = storedNodes.map((n: any, index: number) => {
        // Calculate positioning based on total node count for better spacing
        const totalNodes = triggerNodes.length + storedNodes.length;
        const nodeWidth = 200; // Approximate node width
        const nodeHeight = 100; // Approximate node height
        const horizontalSpacing = 300; // Horizontal spacing between nodes
        const verticalSpacing = 150; // Vertical spacing for nodes in same column
        
        let x, y;
        
        if (totalNodes <= 2) {
          // Simple layout for 1-2 nodes
          x = triggerNodes.length > 0 ? 500 : 200;
          y = 200;
        } else if (totalNodes <= 4) {
          // Layout for 3-4 nodes: 2x2 grid
          const row = Math.floor(index / 2);
          const col = index % 2;
          x = triggerNodes.length > 0 ? 500 + (col * horizontalSpacing) : 200 + (col * horizontalSpacing);
          y = 150 + (row * verticalSpacing);
        } else {
          // Layout for 5+ nodes: horizontal flow with wrapping
          const nodesPerRow = Math.ceil(Math.sqrt(totalNodes));
          const row = Math.floor(index / nodesPerRow);
          const col = index % nodesPerRow;
          x = triggerNodes.length > 0 ? 500 + (col * horizontalSpacing) : 200 + (col * horizontalSpacing);
          y = 150 + (row * verticalSpacing);
        }

        return {
          ...n,
          position: { x, y },
          draggable: false,
          selectable: true
        };
      });

      // Combine all nodes
      const allNodes = [...triggerNodes, ...taskNodes];
      
      // Create edges connecting trigger to first task if needed
      let allEdges = [...storedEdges];
      if (triggerNodes.length > 0 && taskNodes.length > 0) {
        // Check if trigger is already connected
        const triggerConnected = storedEdges.some(edge => 
          edge.source === triggerNodes[0].id || 
          edge.source.startsWith('trigger-')
        );
        
        if (!triggerConnected) {
          allEdges.unshift({
            id: `edge-${triggerNodes[0].id}-${taskNodes[0].id}`,
            source: triggerNodes[0].id,
            target: taskNodes[0].id,
            type: "custom",
          });
        }
      }

      setNodes(allNodes);
      setEdges(allEdges);
    })();
    return () => {
      mounted = false;
    };
  }, [supabase, workflowId, selectedRunId]);

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

  // Load selected run details (task runs)
  useEffect(() => {
    if (!selectedRunId) return;
    setLoading(true);
    (async () => {
      if (!isValidUuid(workflowId)) {
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/workflows/${workflowId}/executions/${selectedRunId}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const { taskRuns } = await res.json();
      const byTaskId: Record<string, any> = {};
      for (const tr of taskRuns || []) {
        byTaskId[tr.workflow_task_id] = tr;
      }
      setTaskRunsByTaskId(byTaskId);
      setLoading(false);
    })();
  }, [workflowId, selectedRunId]);

  // Fetch detailed thread data when node is clicked
  useEffect(() => {
    if (!activeNodeId || !selectedRunId || !isValidUuid(workflowId) || !isValidUuid(selectedRunId)) return;

    // Extract task ID from node ID
    const taskId = activeNodeId.replace(/^task-/, "");

    // If already loaded, skip
    if (detailedTaskRuns[taskId]) return;

    // Fetch detailed thread data
    const fetchNodeDetails = async () => {
      setLoadingNodeData(taskId);
      try {
        const res = await fetch(
          `/api/workflows/${workflowId}/executions/${selectedRunId}?includeThreadData=true`
        );
        if (!res.ok) return;

        const { taskRuns } = await res.json();
        const taskRunsById: Record<string, any> = {};
        for (const tr of taskRuns || []) {
          taskRunsById[tr.workflow_task_id] = tr;
        }

        setDetailedTaskRuns((prev) => ({ ...prev, ...taskRunsById }));
      } catch (error) {
        console.error("Failed to fetch node details:", error);
      } finally {
        setLoadingNodeData(null);
      }
    };

    fetchNodeDetails();
  }, [activeNodeId, selectedRunId, workflowId, detailedTaskRuns]);

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
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-72 border-r p-3 space-y-2 overflow-y-auto">
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
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">Loading run…</div>
        )}
        <WorkflowCanvas
          isExecutionsView={true}
        />
      </div>

      {/* Node details panel */}
      {activeNodeId && (() => {
        const node = nodes.find((n) => n.id === activeNodeId);
        if (!node) return null;

        const taskId = activeNodeId.replace(/^task-/, "");
        const taskRun = detailedTaskRuns[taskId] || taskRunsByTaskId[taskId] || null;

        return (
          <div className={`fixed top-0 right-0 h-full w-[480px] max-w-[90vw] bg-background border-l shadow-xl transform transition-transform duration-300 ease-in-out z-50 translate-x-0`}>
            <NodeDetailPanel node={node} taskRun={taskRun} onClose={() => setActiveNodeId(null)} />
          </div>
        );
      })()}
    </div>
  );
}


