import { WorkflowNode } from "@/types/workflow";
import { toast } from "@/hooks/use-toast";

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

    // Start SSE execution
    const response = await fetch(`/api/workflows/${workflowId}/execute`, {
      method: "POST",
    });

    if (!response.ok || !response.body) {
      throw new Error("Failed to execute workflow");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";
      for (const evt of events) {
        const lines = evt.split("\n");
        let eventType: string | null = null;
        const dataLines: string[] = [];
        for (const line of lines) {
          if (line.startsWith("event:")) eventType = line.slice(6).trim();
          else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
        }
        const dataStr = dataLines.join("\n");
        let payload: any = null;
        try { payload = dataStr ? JSON.parse(dataStr) : null; } catch {}

        if (eventType === "task-start" && payload?.workflow_task_id) {
          setNodes((nodes) =>
            nodes.map((n) =>
              n.type === "task" && (n.data as any).workflow_task_id === payload.workflow_task_id
                ? ({ ...n, data: { ...n.data, status: "running" } } as WorkflowNode)
                : n
            )
          );
        }
        if (eventType === "task-complete" && payload?.workflow_task_id) {
          setNodes((nodes) =>
            nodes.map((n) =>
              n.type === "task" && (n.data as any).workflow_task_id === payload.workflow_task_id
                ? ({
                    ...n,
                    data: {
                      ...n.data,
                      status: "completed",
                    },
                  } as WorkflowNode)
                : n
            )
          );
          // Also propagate as previous output to the next node, if there is one
          try {
            const event = new CustomEvent("taskTestCompleted", {
              detail: {
                workflowTaskId: payload.workflow_task_id,
                output: { result: payload.result, metadata: { thread_id: payload.thread_id } },
              },
            });
            window.dispatchEvent(event);
          } catch {}
        }
        if (eventType === "error") {
          throw new Error(payload?.error || "Workflow execution error");
        }
      }
    }

    toast({
      title: "Workflow executed successfully",
      variant: "default",
    });
  } catch (error) {
    console.error("Error executing workflow:", error);
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
