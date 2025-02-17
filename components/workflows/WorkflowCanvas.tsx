'use client'

import { useCallback } from "react";
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
  useReactFlow,
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
import { AgentNode } from "./AgentNode";
import { CustomEdge } from "./CustomEdge";
import { toast } from "@/hooks/use-toast";
import { WorkflowNode } from "@/types/workflow";
import { MemoizedTaskNode } from "./TaskNode";

// Define node and edge types outside the component
const nodeTypes: NodeTypes = {
  agent: AgentNode,
  task: MemoizedTaskNode,
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
}

export function WorkflowCanvas({
  nodes,
  setNodes,
  edges,
  setEdges,
  initialWorkflowId,
}: WorkflowCanvasProps) {
  const reactFlowInstance = useReactFlow();

  const onNodesDelete = useCallback(
    async (nodesToDelete: Parameters<OnNodesDelete>[0]) => {
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

      // Remove connected edges
      const edgesToRemove = edges.filter((edge) =>
        typedNodes.some(
          (node) => edge.source === node.id || edge.target === node.id
        )
      );
      setEdges(
        edges.filter((edge) => !edgesToRemove.some((e) => e.id === edge.id))
      );

      // Update nodes with hasTask status
      setNodes((prevNodes) => {
        const updatedNodes = prevNodes
          .filter((node) => !typedNodes.some((n) => n.id === node.id))
          .map((node) => {
            if (node.type === "agent") {
              const hasConnectedTask = edges.some(
                (edge) =>
                  edge.source === node.id &&
                  !typedNodes.some((n) => n.id === edge.target)
              );
              return {
                ...node,
                data: { ...node.data, hasTask: hasConnectedTask },
              };
            }
            return node;
          });
        return updatedNodes;
      });
    },
    [edges, setEdges, setNodes, initialWorkflowId]
  );

  const onEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          if (node.type === "agent") {
            const hasConnectedTask = edges.some(
              (edge) =>
                edge.source === node.id &&
                !edgesToDelete.some((e) => e.id === edge.id)
            );
            return {
              ...node,
              data: { ...node.data, hasTask: hasConnectedTask },
            };
          }
          return node;
        })
      );
    },
    [edges, setNodes]
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((node) => node.id === connection.source);
      const targetNode = nodes.find((node) => node.id === connection.target);

      if (!sourceNode || !targetNode) return;

      const connectionExists = edges.some(
        (edge) =>
          edge.source === connection.source && edge.target === connection.target
      );

      if (connectionExists) {
        toast({
          title: "Connection already exists",
          variant: "destructive",
        });
        return;
      }

      if (
        (sourceNode.type === "task" &&
          targetNode.type === "task" &&
          connection.sourceHandle === "task-source" &&
          connection.targetHandle === "task-target") ||
        (sourceNode.type === "agent" &&
          targetNode.type === "agent" &&
          connection.sourceHandle === "agent-source" &&
          connection.targetHandle === "agent-target") ||
        (sourceNode.type === "agent" &&
          targetNode.type === "task" &&
          connection.sourceHandle === "task-handle" &&
          connection.targetHandle === "task-target")
      ) {
        setEdges((eds) => addEdge(connection, eds));
      }
    },
    [nodes, edges, setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const assistantId = event.dataTransfer.getData("application/reactflow");

      if (assistantId && initialWorkflowId) {
        try {
          const response = await fetch(`/api/assistants/${assistantId}`);
          if (!response.ok) {
            throw new Error("Failed to fetch assistant");
          }
          const assistant = await response.json();

          const { zoom } = reactFlowInstance.getViewport();
          const position = reactFlowInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          });

          const newNode: WorkflowNode = {
            id: `${assistant.assistant_id}-${nodes.length + 1}`,
            type: "agent" as const,
            position,
            data: {
              assistant_id: assistant.assistant_id,
              label: assistant.name,
              workflowId: initialWorkflowId,
              hasTask: false,
              status: "idle" as const,
            },
          };

          setNodes((nds) => nds.concat(newNode));
          reactFlowInstance.setViewport({ x: 0, y: 0, zoom });
        } catch (error) {
          console.error("Error fetching assistant:", error);
          toast({
            title: "Failed to add assistant to workflow",
          });
        }
      }
    },
    [nodes, setNodes, reactFlowInstance, initialWorkflowId]
  );

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes(
        (nds) =>
          applyNodeChanges(
            changes,
            nds as Parameters<typeof applyNodeChanges>[1]
          ) as unknown as WorkflowNode[]
      );
    },
    [setNodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [setEdges]
  );

  return (
    <div className="absolute inset-0">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onDragOver={onDragOver}
        onDrop={onDrop}
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
            Add your first Agent and then add tasks to define their behavior.
            Press Delete or Backspace to remove nodes and edges.
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

