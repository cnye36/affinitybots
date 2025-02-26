import { Edge } from "reactflow";
import { WorkflowNode } from "@/types/workflow";
import { toast } from "@/hooks/use-toast";

interface WorkflowNodeManagerProps {
  nodes: WorkflowNode[];
  setNodes: React.Dispatch<React.SetStateAction<WorkflowNode[]>>;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  workflowId: string;
}

export async function addTask({
  workflowId,
  nodes,
  setNodes,
  setEdges,
  taskData,
  sourceNodeId,
}: Omit<WorkflowNodeManagerProps, "edges"> & {
  taskData: {
    name: string;
    description?: string;
    task_type: string;
    config?: {
      input: {
        source: string;
        parameters: Record<string, unknown>;
      };
      output: {
        destination: string;
      };
    };
  };
  sourceNodeId?: string;
}) {
  if (!workflowId) {
    toast({
      title: "Cannot create task without workflow",
      variant: "destructive",
    });
    return;
  }

  try {
    const taskPayload = {
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

    // If sourceNodeId is provided, use that node as the source
    // Otherwise, find trigger node to connect to if this is the first task
    let sourceNode;
    if (sourceNodeId) {
      sourceNode = nodes.find((n) => n.id === sourceNodeId);
    } else {
      const triggerNode = nodes.find((n) => n.type === "trigger");
      const lastTaskNode = nodes
        .filter((n) => n.type === "task")
        .sort((a, b) => b.position.x - a.position.x)[0];
      sourceNode = lastTaskNode || triggerNode;
    }

    // Position the task after the source node
    const position = sourceNode
      ? {
          x: sourceNode.position.x + 300,
          y: sourceNode.position.y,
        }
      : { x: 400, y: 200 };

    // Create new task node
    const taskNodeId = `task-${savedTask.workflow_task_id}`;
    const newTaskNode: WorkflowNode = {
      id: taskNodeId,
      type: "task",
      position,
      data: {
        workflow_task_id: savedTask.workflow_task_id,
        name: savedTask.name,
        description: savedTask.description,
        task_type: savedTask.task_type,
        workflow_id: workflowId,
        status: "idle",
        assistant_id: savedTask.assistant_id,
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

    // Create edge from source node to new task
    if (sourceNode) {
      const newEdge: Edge = {
        id: `edge-${sourceNode.id}-${taskNodeId}`,
        source: sourceNode.id,
        target: taskNodeId,
        type: "custom",
      };
      setEdges((eds) => [...eds, newEdge]);
    }

    setNodes((nds) => [...nds, newTaskNode]);
    return savedTask;
  } catch (err) {
    console.error("Error saving task:", err);
    toast({
      title: "Failed to create task",
      variant: "destructive",
    });
  }
}
