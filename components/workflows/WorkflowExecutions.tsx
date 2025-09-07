"use client";

import { useEffect, useMemo, useState } from "react";
import { Edge } from "reactflow";
import { createClient } from "@/supabase/client";
import { WorkflowNode } from "@/types/workflow";
import { WorkflowCanvas } from "./WorkflowCanvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

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

  const isValidUuid = (value?: string | null) =>
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    );

  // Load workflow graph (nodes/edges) once
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!isValidUuid(workflowId)) return;
      const { data: wf, error } = await supabase
        .from("workflows")
        .select("nodes, edges")
        .eq("workflow_id", workflowId)
        .single();
      if (error) return;
      if (!mounted) return;
      const n: WorkflowNode[] = (wf?.nodes || []).map((n: any) => ({ ...n, draggable: false, selectable: true }));
      const e: Edge[] = (wf?.edges || []).map((e: any) => ({ ...e }));
      setNodes(n);
      setEdges(e);
    })();
    return () => {
      mounted = false;
    };
  }, [supabase, workflowId]);

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

  // Decorate nodes with execution status and result
  const decoratedNodes = useMemo(() => {
    return nodes.map((n) => {
      if (n.type !== "task") return n;
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
          nodes={decoratedNodes}
          setNodes={() => {}}
          edges={edges}
          setEdges={() => {}}
          initialWorkflowId={workflowId}
          activeNodeId={activeNodeId}
          setActiveNodeId={setActiveNodeId}
        />
      </div>

      {/* Node details panel */}
      <aside className="w-[380px] border-l p-3 overflow-y-auto bg-background">
        {!activeNodeId && (
          <div className="text-sm text-muted-foreground">Select a node to view details.</div>
        )}
        {activeNodeId && (() => {
          const node = nodes.find((n) => n.id === activeNodeId);
          if (!node || node.type !== "task") return <div className="text-sm text-muted-foreground">Select a node to view details.</div>;
          const tr = taskRunsByTaskId[node.data.workflow_task_id];
          return (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{node.data.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-muted-foreground">Type: {node.data.task_type}</div>
                <div className="text-xs">Status: <span className="uppercase">{tr?.status || "unknown"}</span></div>
                {tr?.started_at && <div className="text-xs">Started: {new Date(tr.started_at).toLocaleString()}</div>}
                {tr?.completed_at && <div className="text-xs">Completed: {new Date(tr.completed_at).toLocaleString()}</div>}
                {tr?.error && (
                  <div className="text-xs text-red-600 break-words">Error: {tr.error}</div>
                )}
                <Separator />
                <Tabs defaultValue="result">
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="result">Result</TabsTrigger>
                    <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                  </TabsList>
                  <TabsContent value="result">
                    <pre className="text-xs whitespace-pre-wrap break-words bg-muted p-2 rounded-md max-h-[320px] overflow-auto">{typeof tr?.result === "string" ? tr.result : JSON.stringify(tr?.result ?? null, null, 2)}</pre>
                  </TabsContent>
                  <TabsContent value="raw">
                    <pre className="text-xs whitespace-pre bg-muted p-2 rounded-md max-h-[320px] overflow-auto">{JSON.stringify(tr ?? {}, null, 2)}</pre>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          );
        })()}
      </aside>
    </div>
  );
}




