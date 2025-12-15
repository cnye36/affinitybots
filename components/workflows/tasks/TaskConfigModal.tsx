import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Task } from "@/types/workflow";
import { toast } from "@/hooks/useToast";
import { TaskModalHeader } from "./TaskModalHeader";
import { PreviousNodeOutputPanel } from "./PreviousNodeOutputPanel";
import { TaskConfigurationPanel } from "./TaskConfigurationPanel";
import { TestOutputPanel } from "./TestOutputPanel";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { AgentSelectModal } from "../AgentSelectModal";
import { Assistant } from "@/types/assistant";
import { useAgent } from "@/hooks/useAgent";

interface TaskOutput {
  result: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

interface TaskConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  previousNodeOutput?: TaskOutput;
  onTest: (overrideConfig?: Record<string, unknown>) => Promise<unknown>;
  onUpdate: (updatedTask: Task, updatedAssistant: Assistant | null) => void;
}

type OutputFormat = "json" | "markdown";

type TestOutput = {
  type?: string;
  content?: string;
  result?: unknown;
  error?: string;
};

export function TaskConfigModal({
  isOpen,
  onClose,
  task,
  previousNodeOutput,
  onTest,
  onUpdate,
}: TaskConfigModalProps) {
  const [currentTask, setCurrentTask] = useState<Task>(task);
  const [prevOutputFormat, setPrevOutputFormat] = useState<OutputFormat>("json");
  const [testOutputFormat, setTestOutputFormat] = useState<OutputFormat>("json");
  const [isLoading, setIsLoading] = useState(false);
  const [testOutput, setTestOutput] = useState<TestOutput | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const { assistant, isLoading: isAssistantLoading } = useAgent(
    currentTask.assignedAssistant?.id,
    { enabled: isOpen }
  );
  const [isAssistantSelectOpen, setIsAssistantSelectOpen] = useState(false);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loadingAssistants, setLoadingAssistants] = useState(true);

  useEffect(() => {
    // Live-stream partial output into the TestOutputPanel
    const onStream = (e: Event) => {
      const evt = e as CustomEvent<{ workflowTaskId: string; partial: string }>;
      if (evt.detail?.workflowTaskId !== currentTask.workflow_task_id) return;
      setTestOutput({ type: "messages/partial", content: evt.detail.partial });
    };
    // Mark stream end on completion
    const onComplete = (e: Event) => {
      const evt = e as CustomEvent<{ workflowTaskId: string; output: { result: unknown } }>;
      if (evt.detail?.workflowTaskId !== currentTask.workflow_task_id) return;
      setIsStreaming(false);
    };
    window.addEventListener("taskTestStream", onStream as EventListener);
    window.addEventListener("taskTestCompleted", onComplete as EventListener);
    return () => {
      window.removeEventListener("taskTestStream", onStream as EventListener);
      window.removeEventListener("taskTestCompleted", onComplete as EventListener);
    };
  }, [currentTask.workflow_task_id]);

  useEffect(() => {
    // Only sync from props when opening or switching to a different task id
    if (isOpen) {
      setCurrentTask(task);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, task.workflow_task_id]);

  useEffect(() => {
    let isMounted = true;

    const loadAssistants = async () => {
      try {
        const response = await fetch("/api/agents");
        if (!response.ok) throw new Error("Failed to load assistants");
        const data = await response.json();
        if (isMounted) {
          // API returns { assistants: Assistant[] }
          setAssistants(Array.isArray(data) ? (data as Assistant[]) : (data.assistants || []));
          setLoadingAssistants(false);
        }
      } catch (error) {
        console.error("Error loading assistants:", error);
        if (isMounted) {
          setLoadingAssistants(false);
        }
      }
    };

    if (isOpen) {
      loadAssistants();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    setLoadingAssistants(isAssistantLoading);
  }, [isAssistantLoading]);

  useEffect(() => {
    if (currentTask && assistant) {
      onUpdate(currentTask, assistant);
    }
  }, [currentTask, assistant, onUpdate]);

  const saveTask = async (taskToSave: Task) => {
    const payload = {
      name: taskToSave.name,
      description: taskToSave.description,
      task_type: taskToSave.task_type,
      config: taskToSave.config,
      assignedAssistant: taskToSave.assignedAssistant,
      integration: taskToSave.integration,
    };

    const url = `/api/workflows/${taskToSave.workflow_id}/tasks/${taskToSave.workflow_task_id}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error || err?.message || "Failed to save task");
    }
  };

  const handleTest = async () => {
    try {
      if (!currentTask.assignedAssistant?.id) {
        throw new Error("Please assign an agent before testing");
      }

      setIsLoading(true);
      setIsStreaming(true);
      setTestOutput(null);

      if (!currentTask.config?.input?.prompt) {
        throw new Error("Please provide a prompt before testing");
      }

      // Save first so state persists and next nodes can use it
      await saveTask(currentTask);
      // Pass current configuration so the server can honor latest toggles immediately
      const result = await onTest((currentTask?.config as unknown as Record<string, unknown>) || {});
      setTestOutput(result as TestOutput);
    } catch (err) {
      console.error("Error testing task:", err);
      toast({
        title:
          typeof err === "string"
            ? err
            : err instanceof Error
            ? err.message
            : "Failed to test task",
        variant: "destructive",
      });
      setTestOutput({
        type: "error",
        error: err instanceof Error ? err.message : "Unknown error occurred",
      });
    } finally {
      setIsLoading(false);
      // allow streaming indicator to be cleared by completion event if provided
      setIsStreaming(false);
    }
  };

  const handleAssistantSelect = async (selectedAssistant: Assistant) => {
    try {
      const response = await fetch(
        `/api/workflows/${currentTask.workflow_id}/tasks/${currentTask.workflow_task_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...currentTask,
            assignedAssistant: {
              id: selectedAssistant.assistant_id,
              name: selectedAssistant.name,
              avatar: selectedAssistant.metadata.agent_avatar,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update task agent");
      }

      const updatedTask = {
        ...currentTask,
        assignedAssistant: {
          id: selectedAssistant.assistant_id,
          name: selectedAssistant.name,
          avatar: selectedAssistant.metadata.agent_avatar,
        },
      } as Task;
      setCurrentTask(updatedTask);
      setAssistants([selectedAssistant]);
      setIsAssistantSelectOpen(false);
      onUpdate(updatedTask, selectedAssistant);

      toast({
        title: "Agent assigned successfully",
      });
    } catch (error) {
      console.error("Error assigning agent:", error);
      toast({
        title: "Failed to assign agent",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl">
          <TaskModalHeader
            task={currentTask}
            assistant={assistant ?? null}
            isLoading={isLoading || loadingAssistants}
            onTest={handleTest}
            onSave={() => saveTask(currentTask)}
            onChangeAssistant={() => setIsAssistantSelectOpen(true)}
          />

          <div className="grid grid-cols-3 gap-4 mt-4">
            <PreviousNodeOutputPanel
              data={previousNodeOutput || null}
              outputFormat={prevOutputFormat}
              setOutputFormat={setPrevOutputFormat}
            />

            {loadingAssistants ? (
              <div className="border rounded-lg p-4 flex items-center justify-center">
                Loading agent information...
              </div>
            ) : !assistant ? (
              <div className="border rounded-lg p-4 flex items-center justify-center">
                <Button
                  variant="outline"
                  onClick={() => setIsAssistantSelectOpen(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Agent
                </Button>
              </div>
            ) : (
              <TaskConfigurationPanel
                currentTask={currentTask}
                setCurrentTask={setCurrentTask}
                assistant={assistant}
              />
            )}

            <TestOutputPanel
              testOutput={testOutput}
              outputFormat={testOutputFormat}
              setOutputFormat={(fmt) => setTestOutputFormat(fmt)}
              isStreaming={isStreaming}
            />
          </div>
        </DialogContent>
      </Dialog>

      <AgentSelectModal
        isOpen={isAssistantSelectOpen}
        onClose={() => setIsAssistantSelectOpen(false)}
        onSelect={handleAssistantSelect}
        assistants={assistants}
        loading={loadingAssistants}
      />
    </>
  );
}
