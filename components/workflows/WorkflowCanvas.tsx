'use client'

import { useCallback, useEffect, useMemo, useRef } from "react";
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
} from "reactflow";
import "reactflow/dist/style.css";
import { CustomEdge } from "./CustomEdge";
import { toast } from "@/hooks/useToast";
import { WorkflowNode } from "@/types/workflow";
import { MemoizedTaskNode } from "./tasks/TaskNode";
import { TriggerNode } from "./triggers/TriggerNode";

// Define node and edge types outside the component
const nodeTypes: NodeTypes = {
  task: MemoizedTaskNode,
  trigger: TriggerNode,
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
  onAddTask?: (sourceNodeId: string) => void;
  // When true, automatically fit all nodes into view on mount and when graph changes
  autoFit?: boolean;
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

  // Auto-fit the viewport when requested
  useEffect(() => {
    if (!autoFit) return;
    const inst = rfInstanceRef.current;
    if (!inst) return;
    // Small timeout ensures layout has applied
    const id = setTimeout(() => {
      try {
        inst.fitView({ padding: 0.15, includeHiddenNodes: true, duration: 200 });
      } catch {}
    }, 0);
    return () => clearTimeout(id);
  }, [autoFit, nodesWithActiveState.length, edges.length]);

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
        minZoom={0.2}
        maxZoom={4}
        fitView={autoFit}
        deleteKeyCode={["Backspace", "Delete"]}
        onInit={(instance) => {
          rfInstanceRef.current = instance;
          if (autoFit) {
            try {
              instance.fitView({ padding: 0.15, includeHiddenNodes: true, duration: 200 });
            } catch {}
          }
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
            Add tasks to define your workflow. Press Delete or Backspace to
            remove nodes and edges.
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

