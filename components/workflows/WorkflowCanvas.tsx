'use client'

import { useCallback, useMemo } from "react";
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
} from "reactflow";
import "reactflow/dist/style.css";
import { CustomEdge } from "./CustomEdge";
import { toast } from "@/hooks/use-toast";
import { WorkflowNode } from "@/types/workflow";
import { MemoizedTaskNode } from "./tasks/TaskNode";
import { TriggerNode } from "./TriggerNode";

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
}: WorkflowCanvasProps) {
  const onNodesDelete = useCallback(
    async (nodesToDelete: Parameters<OnNodesDelete>[0]) => {
      const deletedIds = new Set(nodesToDelete.map((n) => n.id));

      // More efficient edge filtering
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

      // Check if trigger node already has a connection
      if (sourceNode.type === "trigger") {
        const existingTriggerConnection = edges.some(
          (edge) => edge.source === sourceNode.id
        );
        if (existingTriggerConnection) {
          toast({
            title: "Invalid Connection",
            description: "Trigger node can only connect to one task",
            variant: "destructive",
          });
          return;
        }
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

    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isActive: node.id === activeNodeId,
        onAddTask:
          // Only allow adding tasks from task nodes if task nodes exist
          // Otherwise, allow adding from the trigger node
          node.type === "task"
            ? () => onAddTask?.(node.id)
            : node.type === "trigger" && !hasTaskNodes
            ? () => onAddTask?.(node.id)
            : undefined,
      },
    }));
  }, [nodes, activeNodeId, onAddTask]);

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
        defaultViewport={{ x: 0, y: 0, zoom: 1.5 }}
        defaultEdgeOptions={{
          type: "custom",
          animated: true,
          style: { strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
        }}
        minZoom={0.2}
        maxZoom={4}
        fitView={false}
        deleteKeyCode={["Backspace", "Delete"]}
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

