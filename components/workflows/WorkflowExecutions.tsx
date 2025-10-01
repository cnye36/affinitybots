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
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

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
  const { state } = useSidebar();
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

  // Helpers for sidebar rendering
  const extractMarkdownFrom = useMemo(() => {
    const walk = (val: any): string | null => {
      if (val == null) return null;
      // Direct string
      if (typeof val === "string" && val.trim().length > 0) return val;

      // Arrays: search each element
      if (Array.isArray(val)) {
        for (const item of val) {
          const found = walk(item);
          if (found) return found;
        }
        return null;
      }

      // Objects: check common shapes, then recursively scan all fields
      if (typeof val === "object") {
        // Common content locations
        if (typeof (val as any).content === "string" && (val as any).content.trim().length > 0) {
          return (val as any).content as string;
        }
        if (Array.isArray((val as any).content)) {
          const joined = ((val as any).content as any[])
            .map((p) =>
              typeof p === "string"
                ? p
                : typeof (p as any)?.text === "string"
                ? (p as any).text
                : typeof (p as any)?.content === "string"
                ? (p as any).content
                : ""
            )
            .filter(Boolean)
            .join("\n\n");
          if (joined.trim().length > 0) return joined;
        }

        // Specific shape observed: result.agent.messages[0].content
        const maybeAgent = (val as any).agent;
        if (maybeAgent && Array.isArray(maybeAgent.messages)) {
          const foundInMessages = walk(maybeAgent.messages);
          if (foundInMessages) return foundInMessages;
        }

        // Try common alternative keys
        const alt = walk((val as any).output) || walk((val as any).result);
        if (alt) return alt;

        // Finally, deep-scan all properties
        for (const key of Object.keys(val as Record<string, unknown>)) {
          const found = walk((val as any)[key]);
          if (found) return found;
        }
      }
      return null;
    };
    return walk;
  }, []);

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
          autoFit
          isExecutionsView={true}
        />
      </div>

      {/* Slide-out Node details panel */}
      <div className={`fixed top-0 right-0 h-full w-[420px] bg-background border-l shadow-lg transform transition-all duration-300 ease-in-out z-50 ${
        activeNodeId ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="text-sm font-medium">Node Details</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setActiveNodeId(null)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto">
            {activeNodeId && (() => {
              const node = nodes.find((n) => n.id === activeNodeId);
              if (!node) return <div className="text-sm text-muted-foreground">Select a node to view details.</div>;
              
              if (node.type === "trigger") {
                return (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{node.data.name || "Trigger"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-xs text-muted-foreground">Type: {node.data.trigger_type || "trigger"}</div>
                      <div className="text-xs">Status: <span className="uppercase">ready</span></div>
                      <div className="text-xs text-muted-foreground">
                        This trigger starts the workflow execution when its conditions are met.
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              
              if (node.type === "task") {
                const tr = taskRunsByTaskId[node.data.workflow_task_id];
                const agentName = (node.data as any)?.assignedAssistant?.name || (node.data as any)?.config?.assigned_assistant?.name || "Agent";
                const toolsUsed: string[] = (tr?.metadata?.toolsUsed || tr?.metadata?.tools || []) as string[];
                const markdownText = extractMarkdownFrom(tr?.result);
                const resultText = typeof tr?.result === "string" ? (tr?.result as string) : JSON.stringify(tr?.result ?? null, null, 2);
                const [copied, setCopied] = [false, undefined] as any; // placeholder for inline TS satisfaction; we will handle copy via inline handler
                return (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{node.data.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-xs text-muted-foreground">Type: {node.data.task_type}</div>
                      <div className="text-xs">Agent: {agentName}</div>
                      {toolsUsed?.length > 0 && (
                        <div className="text-xs flex flex-wrap gap-1 items-center">
                          <span className="text-muted-foreground">Tools:</span>
                          {toolsUsed.map((t) => (
                            <span key={t} className="px-1.5 py-0.5 rounded bg-muted text-[10px] uppercase tracking-wide">{t}</span>
                          ))}
                        </div>
                      )}
                      <div className="text-xs">Status: <span className="uppercase">{tr?.status || "unknown"}</span></div>
                      {tr?.started_at && <div className="text-xs">Started: {new Date(tr.started_at).toLocaleString()}</div>}
                      {tr?.completed_at && <div className="text-xs">Completed: {new Date(tr.completed_at).toLocaleString()}</div>}
                      {tr?.error && (
                        <div className="text-xs text-red-600 break-words">Error: {tr.error}</div>
                      )}
                      <Separator />
                      <Tabs defaultValue="result">
                        <TabsList className="grid grid-cols-3 w-full">
                          <TabsTrigger value="result">Result</TabsTrigger>
                          <TabsTrigger value="markdown">Markdown</TabsTrigger>
                          <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                        </TabsList>
                        <TabsContent value="result">
                          <div className="relative">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute right-1 top-1 h-7 px-2"
                              onClick={() => navigator.clipboard.writeText(resultText)}
                              title="Copy"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <pre className="text-xs whitespace-pre-wrap break-words bg-muted p-2 rounded-md max-h-[320px] overflow-auto">{resultText}</pre>
                          </div>
                        </TabsContent>
                        <TabsContent value="markdown">
                          {markdownText ? (
                            <div className="relative border rounded-md p-2 max-h-[320px] overflow-auto">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="absolute right-1 top-1 h-7 px-2"
                                onClick={() => navigator.clipboard.writeText(markdownText)}
                                title="Copy"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <div className="prose max-w-none dark:prose-invert">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {markdownText}
                                </ReactMarkdown>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">No markdown text available.</div>
                          )}
                        </TabsContent>
                        <TabsContent value="raw">
                          <div className="relative">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute right-1 top-1 h-7 px-2"
                              onClick={() => navigator.clipboard.writeText(JSON.stringify(tr ?? {}, null, 2))}
                              title="Copy"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <pre className="text-xs whitespace-pre bg-muted p-2 rounded-md max-h-[320px] overflow-auto">{JSON.stringify(tr ?? {}, null, 2)}</pre>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                );
              }
              
              return <div className="text-sm text-muted-foreground">Select a node to view details.</div>;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}




