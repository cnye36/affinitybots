import { WorkflowNode } from "@/types/workflow";
import { toast } from "@/hooks/use-toast";
import logger from "@/lib/logger";

interface ExecuteWorkflowParams {
  workflowId: string;
  setNodes: React.Dispatch<React.SetStateAction<WorkflowNode[]>>;
  setIsExecuting: React.Dispatch<React.SetStateAction<boolean>>;
}

export async function executeWorkflow({
  workflowId,
  setNodes,
  setIsExecuting,
}: ExecuteWorkflowParams) {
  try {
    setIsExecuting(true);

    // Reset all nodes to idle state
    setNodes((nodes) =>
      nodes.map((node) => {
        const updatedNode = {
          ...node,
          data: {
            ...node.data,
            status: "idle",
          },
        };
        return updatedNode as WorkflowNode;
      })
    );

    // Start execution from trigger node
    const response = await fetch(`/api/workflows/${workflowId}/execute`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to execute workflow");
    }

    const executionData = await response.json();

    // Update nodes with execution results
    setNodes((nodes) =>
      nodes.map((node) => {
        const updatedNode = {
          ...node,
          data: {
            ...node.data,
            status: executionData[node.id]?.status || "completed",
          },
        };
        return updatedNode as WorkflowNode;
      })
    );

    toast({
      title: "Workflow executed successfully",
      variant: "default",
    });
  } catch (error) {
    logger.error("Error executing workflow:", error);
    toast({
      title: "Failed to execute workflow",
      variant: "destructive",
    });

    // Set all nodes to error state
    setNodes((nodes) =>
      nodes.map((node) => {
        const updatedNode = {
          ...node,
          data: {
            ...node.data,
            status: "error",
          },
        };
        return updatedNode as WorkflowNode;
      })
    );
  } finally {
    setIsExecuting(false);
  }
}
