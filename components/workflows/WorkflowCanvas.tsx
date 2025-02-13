'use client'

import { useCallback } from "react";
import ReactFlow, {
  Node,
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
} from "reactflow";
import "reactflow/dist/style.css";
import { AgentNode } from "./AgentNode";
import { CustomEdge } from "./CustomEdge";
import { TaskNode } from "./TaskNode";
import axios from "axios";
import { Assistant } from "@/types/index";
import { toast } from "@/hooks/use-toast";

interface WorkflowNode extends Node {
  type: "agent" | "task";
}

interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  setNodes: React.Dispatch<React.SetStateAction<WorkflowNode[]>>;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  initialWorkflowId?: string;
}

const nodeTypes: NodeTypes = {
  agent: AgentNode,
  task: TaskNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

export function WorkflowCanvas({
  nodes,
  setNodes,
  edges,
  setEdges,
  initialWorkflowId,
}: WorkflowCanvasProps) {
  const reactFlowInstance = useReactFlow();

  const onConnect: OnConnect = useCallback(
    (connection) => {
      // Get the source and target nodes
      const sourceNode = nodes.find((node) => node.id === connection.source);
      const targetNode = nodes.find((node) => node.id === connection.target);

      if (!sourceNode || !targetNode) return;

      // Check if it's a task-to-task connection
      if (sourceNode.type === "task" && targetNode.type === "task") {
        if (
          connection.sourceHandle === "task-source" &&
          connection.targetHandle === "task-target"
        ) {
          setEdges((eds) => addEdge(connection, eds));
        }
        return;
      }

      // Check if it's an agent-to-agent connection
      if (sourceNode.type === "agent" && targetNode.type === "agent") {
        if (
          connection.sourceHandle === "agent-source" &&
          connection.targetHandle === "agent-target"
        ) {
          setEdges((eds) => addEdge(connection, eds));
        }
        return;
      }

      // Check if it's an agent-to-task connection
      if (sourceNode.type === "agent" && targetNode.type === "task") {
        if (
          connection.sourceHandle === "task-handle" &&
          connection.targetHandle === "task-target"
        ) {
          setEdges((eds) => addEdge(connection, eds));
        }
        return;
      }
    },
    [nodes, setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const assistantId = event.dataTransfer.getData("application/reactflow");

      if (!assistantId || !initialWorkflowId) {
        if (!initialWorkflowId) {
          toast({
            title: "Please save the workflow first",
          });
        }
        return;
      }

      try {
        const response = await axios.get<Assistant>(
          `/api/assistants/${assistantId}`
        );
        const assistant = response.data;

        if (!assistant) {
          console.error("Assistant not found");
          return;
        }

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
    },
    [nodes, setNodes, reactFlowInstance, initialWorkflowId]
  );

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds) as WorkflowNode[]);
    },
    [setNodes]
  );

  const onEdgesChange: OnEdgesChange = (changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  };

  return (
    <div className="w-full h-full flex">
      <div className="w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
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
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Panel
            position="top-center"
            className="bg-background/60 p-2 rounded-lg shadow-sm border"
          >
            <div className="text-sm text-muted-foreground">
              Drag assistants from the sidebar and connect them to create your
              workflow. Add tasks to each assistant to define their behavior.
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

