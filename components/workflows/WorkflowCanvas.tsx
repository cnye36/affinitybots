'use client'

import { useCallback, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import ReactFlow, {
  Edge,
  Controls,
  Background,
  MiniMap,
  NodeTypes,
  EdgeTypes,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  BackgroundVariant,
  Panel,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
  MarkerType,
  Connection,
  OnNodesDelete,
  ReactFlowInstance,
  useReactFlow,
  getNodesBounds,
  getViewportForBounds,
} from "reactflow";
import "reactflow/dist/style.css";
import { CustomEdge } from "./CustomEdge";
import { toast } from "@/hooks/useToast";
import { WorkflowNode } from "@/types/workflow";
import { MemoizedTaskNode } from "./tasks/TaskNode";
import { TriggerNode } from "./triggers/TriggerNode";
import { OrchestratorNode } from "./orchestrator/OrchestratorNode";

// Define node and edge types outside the component
const nodeTypes: NodeTypes = {
  task: MemoizedTaskNode,
  trigger: TriggerNode,
  orchestrator: OrchestratorNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  setNodes: React.Dispatch<React.SetStateAction<WorkflowNode[]>>;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  initialWorkflowId?: string;
  selectedTaskId?: string | null;
  onTaskConfigClose?: () => void;
  activeNodeId?: string | null;
  setActiveNodeId?: (id: string | null) => void;
  onAddTask?: (sourceNodeId?: string) => void;
  // When true, automatically fit all nodes into view on mount and when graph changes
  autoFit?: boolean;
  // When true, shows execution-focused instructions instead of editor instructions
  isExecutionsView?: boolean;
}

// Deterministic zoom component
function DeterministicZoom({ autoFit }: { autoFit: boolean }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { getNodes, setViewport } = useReactFlow();

  useLayoutEffect(() => {
    if (!autoFit || !wrapperRef.current) return;

    const refit = () => {
      const nodes = getNodes().filter(n => !n.hidden);
      if (!nodes.length) return;

      const bounds = getNodesBounds(nodes);
      const w = wrapperRef.current!.clientWidth;
      const h = wrapperRef.current!.clientHeight;

      // Choose padding & caps based on node count
      const nodeCount = nodes.length;
      const hasTrigger = nodes.some(n => n.type === 'trigger');
      const hasTask = nodes.some(n => n.type === 'task');
      
      let padding: number;
      let maxZoom: number;
      
      if (nodeCount === 1) {
        // Single node: very generous padding, low zoom
        padding = 0.5;
        maxZoom = 0.7;
      } else if (hasTrigger && hasTask && nodeCount === 2) {
        // Trigger + single task: generous padding, moderate zoom
        padding = 0.4;
        maxZoom = 0.8;
      } else if (nodeCount <= 4) {
        // 3-4 nodes: moderate padding, higher zoom
        padding = 0.3;
        maxZoom = 0.9;
      } else {
        // 5+ nodes: tighter padding, allow full zoom
        padding = 0.2;
        maxZoom = 1.0;
      }

      const { x, y, zoom } = getViewportForBounds(
        bounds,
        w,
        h,
        padding,
        0.1, // minZoom
        maxZoom
      );

      setViewport({ x, y, zoom }, { duration: 220 });
    };

    // Refire on size changes (side panels, devtools, window resize, etc.)
    const ro = new ResizeObserver(() => refit());
    ro.observe(wrapperRef.current);

    // Wait for any slide-out CSS transitions to finish once, then fit
    const id = requestAnimationFrame(() => {
      // a second RAF ensures layout has fully flushed
      requestAnimationFrame(refit);
    });

    return () => { 
      cancelAnimationFrame(id); 
      ro.disconnect(); 
    };
  }, [autoFit, getNodes, setViewport]);

  return <div ref={wrapperRef} className="absolute inset-0" />;
}

export function WorkflowCanvas({
  nodes,
  setNodes,
  edges,
  setEdges,
  initialWorkflowId,
  activeNodeId,
  setActiveNodeId,
  onAddTask,
  autoFit = false,
  isExecutionsView = false,
}: WorkflowCanvasProps) {
  const rfInstanceRef = useRef<ReactFlowInstance | null>(null);

  const onNodesDelete = useCallback(
    async (nodesToDelete: Parameters<OnNodesDelete>[0]) => {
      const deletedIds = new Set(nodesToDelete.map((n) => n.id));

      const edgesToRemove = edges.filter(
        (edge) => deletedIds.has(edge.source) || deletedIds.has(edge.target)
      );

      setEdges((eds) => eds.filter((e) => !edgesToRemove.includes(e)));

      // Handle node deletion
      const typedNodes = nodesToDelete as unknown as WorkflowNode[];
      for (const node of typedNodes) {
        if (
          node.type === "task" &&
          node.data.workflow_task_id &&
          initialWorkflowId
        ) {
          try {
            await fetch(
              `/api/workflows/${initialWorkflowId}/tasks/${node.data.workflow_task_id}`,
              {
                method: "DELETE",
              }
            );
          } catch (error) {
            console.error("Error deleting task:", error);
            toast({
              title: "Failed to delete task",
              variant: "destructive",
            });
          }
        }
      }

      setNodes((prevNodes) =>
        prevNodes.filter((node) => !typedNodes.some((n) => n.id === node.id))
      );
    },
    [edges, setEdges, setNodes, initialWorkflowId]
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((node) => node.id === connection.source);
      const targetNode = nodes.find((node) => node.id === connection.target);

      if (!sourceNode || !targetNode) return;

      // Enforce single outgoing connection per node (trigger or task)
      const hasExistingOutgoing = edges.some(
        (edge) => edge.source === sourceNode.id
      );
      if (hasExistingOutgoing) {
        toast({
          title: "Invalid Connection",
          description: "Each node can only connect to a single next task",
          variant: "destructive",
        });
        return;
      }

      // Only allow trigger-to-task and task-to-task connections
      if (
        (sourceNode.type === "trigger" && targetNode.type === "task") ||
        (sourceNode.type === "task" && targetNode.type === "task")
      ) {
        setEdges((eds) => addEdge(connection, eds));
      }
    },
    [nodes, edges, setEdges]
  );

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      // Handle node selection
      changes.forEach((change) => {
        if (change.type === "select" && setActiveNodeId) {
          setActiveNodeId(change.selected ? change.id : null);
        }
      });

      setNodes(
        (nds) =>
          applyNodeChanges(
            changes,
            nds as Parameters<typeof applyNodeChanges>[1]
          ) as unknown as WorkflowNode[]
      );
    },
    [setNodes, setActiveNodeId]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [setEdges]
  );

  // Update nodes with active state and onAddTask handler
  const nodesWithActiveState = useMemo(() => {
    // Check if any task nodes exist in the workflow
    const hasTaskNodes = nodes.some((node) => node.type === "task");

    return nodes.map((node) => {
      const hasOutgoingEdge = edges.some((e) => e.source === node.id);
      const canAddFromTask = node.type === "task" && !hasOutgoingEdge;
      // Always allow adding from trigger. If no tasks yet, clicking should add the first task.
      const canAddFromTrigger = node.type === "trigger";

      return {
        ...node,
        data: {
          ...node.data,
          isActive: node.id === activeNodeId,
          onAddTask: canAddFromTask || canAddFromTrigger ? () => onAddTask?.(node.id) : undefined,
        },
      };
    });
  }, [nodes, edges, activeNodeId, onAddTask]);

  // Note: Auto-fit is now handled by DeterministicZoom component

  return (
    <div className="absolute inset-0">
      <ReactFlow
        nodes={nodesWithActiveState}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={onNodesDelete}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={{ x: 0, y: 0, zoom: 1.0 }}
        defaultEdgeOptions={{
          type: "custom",
          animated: true,
          style: { strokeWidth: 1 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
        }}
        minZoom={0.1}
        maxZoom={2}
        fitView={false}
        deleteKeyCode={["Backspace", "Delete"]}
        onInit={(instance) => {
          rfInstanceRef.current = instance;
        }}
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Panel
          position="top-center"
          className="bg-background/60 p-2 rounded-lg shadow-sm border"
        >
          <div className="text-sm text-muted-foreground">
            {isExecutionsView 
              ? "Click on a node to view execution details and results."
              : "Add tasks to define your workflow. Press Delete or Backspace to remove nodes and edges."
            }
          </div>
        </Panel>
        <Panel position="top-right" className="p-2">
          <button
            onClick={() => onAddTask && onAddTask(undefined as any)} 
            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg transition-transform hover:scale-105"
            title="Add Agent"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </Panel>
        <DeterministicZoom autoFit={autoFit} />
      </ReactFlow>
    </div>
  );
}

