import { Edge } from "reactflow";
import { Task } from "@/types/workflow";
import { Assistant } from "@/types/langgraph";
import { toast } from "@/hooks/use-toast";
import { WorkflowNode, NodeHandlers, AgentNodeData } from "@/types/workflow";

interface WorkflowNodeManagerProps {
  workflowId: string;
  nodes: WorkflowNode[];
  setNodes: React.Dispatch<React.SetStateAction<WorkflowNode[]>>;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}

export async function addAgent({
  workflowId,
  nodes,
  setNodes,
  setEdges,
  assistant,
  sourceAgentId,
  handlers,
}: Omit<WorkflowNodeManagerProps, "edges"> & {
  assistant: Assistant;
  sourceAgentId?: string;
  handlers: NodeHandlers;
}) {
  if (!workflowId) {
    toast({
      title: "Please save the workflow first",
      description: "You need to save the workflow before adding an agent",
      variant: "destructive",
    });
    return;
  }

  // Find source node if we're adding from an existing agent
  const sourceNode = sourceAgentId
    ? nodes.find((node) => node.data.assistant_id === sourceAgentId)
    : null;

  // Calculate position based on source node or default to center
  const position = sourceNode
    ? { x: sourceNode.position.x, y: sourceNode.position.y + 300 }
    : { x: 400, y: 200 };

  // Create new agent node
  const newNode: WorkflowNode = {
    id: `agent-${assistant.assistant_id}-${Date.now()}`,
    type: "agent",
    position,
    data: {
      label: assistant.name,
      assistant_id: assistant.assistant_id,
      workflowId,
      isFirstAgent: !sourceAgentId,
      hasTask: false,
      status: "idle" as const,
      onAddTask: handlers.onAddTask,
      onAddAgent: handlers.onAddAgent,
      onConfigureTask: handlers.onConfigureTask,
    } as AgentNodeData,
  };

  // Create edge if we have a source node
  if (sourceNode) {
    const newEdge: Edge = {
      id: `edge-${sourceNode.id}-${newNode.id}`,
      source: sourceNode.id,
      target: newNode.id,
      type: "default",
      sourceHandle: "agent-source",
      targetHandle: "agent-target",
    };
    setEdges((eds) => [...eds, newEdge]);
  }

  setNodes((currentNodes) => [...currentNodes, newNode]);
}

export async function addTask({
  workflowId,
  nodes,
  setNodes,
  setEdges,
  agentId,
  taskData,
}: Omit<WorkflowNodeManagerProps, "edges"> & {
  agentId: string;
  taskData?: Partial<Task>;
}): Promise<Task | undefined> {
  if (!workflowId || !agentId) {
    toast({
      title: "Cannot create task without workflow or agent",
      variant: "destructive",
    });
    return;
  }

  // Find source node and update its hasTask flag
  const sourceNode = nodes.find((node) => node.data.assistant_id === agentId);

  if (!sourceNode) return;

  const position = {
    x: sourceNode.position.x + 300,
    y: sourceNode.position.y,
  };

  try {
    // Only save to backend if we have complete task data
    if (taskData?.type && taskData?.name) {
      const taskPayload = {
        assistant_id: agentId,
        workflow_id: workflowId,
        ...taskData,
      };

      const response = await fetch(`/api/workflows/${workflowId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create task");
      }

      const savedTask = await response.json();

      // Create new task node with the saved task data
      const newTaskNode = {
        id: `task-${savedTask.task_id}`,
        type: "task" as const,
        position,
        data: {
          task_id: savedTask.task_id,
          name: savedTask.name,
          label: savedTask.name,
          description: savedTask.description,
          type: savedTask.type,
          workflowId,
          status: "idle" as const,
          assistant_id: agentId,
          config: savedTask.config || {
            input: {
              source: "previous_node",
              parameters: {},
            },
            output: {
              destination: "next_node",
            },
          },
        },
      };

      // Create edge from agent to task
      const newEdge: Edge = {
        id: `edge-${sourceNode.id}-${newTaskNode.id}`,
        source: sourceNode.id,
        target: newTaskNode.id,
        type: "default",
        sourceHandle: "task-handle",
        targetHandle: "task-target",
      };

      // Update source node to show it has tasks
      setNodes((nds) =>
        nds.map((node) =>
          node.id === sourceNode.id && node.type === "agent"
            ? {
                ...node,
                type: "agent" as const,
                data: { ...node.data, hasTask: true },
              }
            : node
        )
      );

      setNodes((nds) => [...nds, newTaskNode]);
      setEdges((eds) => [...eds, newEdge]);

      return savedTask;
    }
  } catch (err) {
    console.error("Error saving task:", err);
    toast({
      title: "Failed to save task",
      description: "Please try again",
      variant: "destructive",
    });
  }
}
