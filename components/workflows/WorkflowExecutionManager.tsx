import { toast } from "@/hooks/use-toast";
import { WorkflowNode, AgentNodeData, TaskNodeData } from "@/types/workflow";
import { Node } from "reactflow";

interface WorkflowExecutionManagerProps {
  workflowId: string;
  setNodes: React.Dispatch<React.SetStateAction<WorkflowNode[]>>;
  setIsExecuting: (executing: boolean) => void;
}

export async function executeWorkflow({
  workflowId,
  setNodes,
  setIsExecuting,
}: WorkflowExecutionManagerProps) {
  try {
    // Reset all node statuses to idle
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === "agent") {
          return {
            ...node,
            data: { ...node.data, status: "idle" },
          } as Node<AgentNodeData> & { type: "agent" };
        } else {
          return {
            ...node,
            data: { ...node.data, status: "idle" },
          } as Node<TaskNodeData> & { type: "task" };
        }
      })
    );

    const response = await fetch(`/api/workflows/${workflowId}/execute`, {
      method: "POST",
    });

    const data = await response.json();

    if (response.ok) {
      // Set up SSE connection to receive status updates
      const eventSource = new EventSource(
        `/api/workflows/${workflowId}/status`
      );

      eventSource.onmessage = (event) => {
        const update = JSON.parse(event.data);

        setNodes((nds) =>
          nds.map((node) => {
            if (
              (node.type === "agent" &&
                node.data.assistant_id === update.assistant_id) ||
              (node.type === "task" &&
                node.data.workflow_task_id === update.workflow_task_id)
            ) {
              if (node.type === "agent") {
                return {
                  ...node,
                  data: { ...node.data, status: update.status },
                } as Node<AgentNodeData> & { type: "agent" };
              } else {
                return {
                  ...node,
                  data: { ...node.data, status: update.status },
                } as Node<TaskNodeData> & { type: "task" };
              }
            }
            return node;
          })
        );

        // Close SSE connection when workflow is complete
        if (
          update.type === "workflow" &&
          ["completed", "error"].includes(update.status)
        ) {
          eventSource.close();
          setIsExecuting(false);

          toast({
            title:
              update.status === "completed"
                ? "Workflow executed successfully"
                : "Workflow execution failed",
            variant: update.status === "completed" ? "default" : "destructive",
          });
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE Error:", error);
        eventSource.close();
        setIsExecuting(false);
        toast({
          title: "Error receiving workflow updates",
          variant: "destructive",
        });
      };
    } else {
      throw new Error(data.error || "Failed to execute workflow");
    }
  } catch (error) {
    console.error("Error executing workflow:", error);
    toast({
      title: "Failed to execute workflow",
      variant: "destructive",
    });
    setIsExecuting(false);
  }
}
