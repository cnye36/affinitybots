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
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  BackgroundVariant,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { AgentNode } from "./AgentNode";
import { CustomEdge } from "./CustomEdge";
import axios from "axios";
import { Assistant } from "@/types/index";

interface WorkflowCanvasProps {
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  initialWorkflowId?: string;
}

const nodeTypes: NodeTypes = {
  agent: AgentNode,
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

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const assistantId = event.dataTransfer.getData("application/reactflow");

      if (!assistantId) {
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

        const newNode = {
          id: `${assistant.assistant_id}-${nodes.length + 1}`,
          type: "agent",
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
      }
    },
    [nodes, setNodes, reactFlowInstance, initialWorkflowId]
  );

  return (
    <div className="w-full h-full" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) =>
          setNodes((nds) => applyNodeChanges(changes, nds))
        }
        onEdgesChange={(changes) =>
          setEdges((eds) => applyEdgeChanges(changes, eds))
        }
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={{ x: 0, y: 0, zoom: 1.5 }}
        defaultEdgeOptions={{
          type: "custom",
          animated: true,
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
  );
}

