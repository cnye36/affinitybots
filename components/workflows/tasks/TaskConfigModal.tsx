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
  workflowType?: "sequential" | "orchestrator";
}

type OutputFormat = "json" | "markdown" | "formatted";

type TestOutput = {
  type?: string;
  content?: string;
  result?: unknown;
  error?: string;
};

const STORAGE_KEY_PREV_FORMAT = "workflow-output-format-previous";
const STORAGE_KEY_TEST_FORMAT = "workflow-output-format-test";

// Helper to load format preference from localStorage
const loadFormatPreference = (key: string, defaultValue: OutputFormat): OutputFormat => {
  if (typeof window === "undefined") return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    if (stored && (stored === "json" || stored === "markdown" || stored === "formatted")) {
      return stored as OutputFormat;
    }
  } catch (error) {
    console.error("Error loading format preference:", error);
  }
  return defaultValue;
};

// Helper to save format preference to localStorage
const saveFormatPreference = (key: string, value: OutputFormat): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error("Error saving format preference:", error);
  }
};

export function TaskConfigModal({
  isOpen,
  onClose,
  task,
  previousNodeOutput,
  onTest,
  onUpdate,
  workflowType = "sequential",
}: TaskConfigModalProps) {
  const [currentTask, setCurrentTask] = useState<Task>(task);
  const [prevOutputFormat, setPrevOutputFormat] = useState<OutputFormat>(() => 
    loadFormatPreference(STORAGE_KEY_PREV_FORMAT, "formatted")
  );
  const [testOutputFormat, setTestOutputFormat] = useState<OutputFormat>(() => 
    loadFormatPreference(STORAGE_KEY_TEST_FORMAT, "formatted")
  );
  const [isLoading, setIsLoading] = useState(false);

  // Reload format preferences when modal opens
  useEffect(() => {
    if (isOpen) {
      setPrevOutputFormat(loadFormatPreference(STORAGE_KEY_PREV_FORMAT, "formatted"));
      setTestOutputFormat(loadFormatPreference(STORAGE_KEY_TEST_FORMAT, "formatted"));
    }
  }, [isOpen]);
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
              setOutputFormat={(format) => {
                setPrevOutputFormat(format);
                saveFormatPreference(STORAGE_KEY_PREV_FORMAT, format);
              }}
            />

            {loadingAssistants ? (
              <div className="relative overflow-hidden rounded-xl border-2 border-violet-200/50 dark:border-violet-800/50 bg-gradient-to-br from-violet-50/30 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-950/20">
                <div className="flex flex-col items-center justify-center p-12 min-h-[600px]">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-200 dark:border-violet-800 border-t-violet-600 dark:border-t-violet-400 mb-4"></div>
                  <p className="text-sm text-muted-foreground">Loading agent information...</p>
                </div>
              </div>
            ) : !assistant ? (
              <div className="relative overflow-hidden rounded-xl border-2 border-violet-200/50 dark:border-violet-800/50 bg-gradient-to-br from-violet-50/30 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-950/20">
                <div className="flex flex-col items-center justify-center p-12 min-h-[600px]">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 mb-6">
                    <UserPlus className="h-12 w-12 text-violet-600 dark:text-violet-400" />
                  </div>
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                    No Agent Assigned
                  </h3>
                  <p className="text-sm text-muted-foreground text-center max-w-[280px] mb-6">
                    Assign an AI agent to this task to configure its behavior and execute workflows
                  </p>
                  <Button
                    onClick={() => setIsAssistantSelectOpen(true)}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign Agent
                  </Button>
                </div>
              </div>
            ) : (
              <TaskConfigurationPanel
                currentTask={currentTask}
                setCurrentTask={setCurrentTask}
                assistant={assistant}
                workflowType={workflowType}
              />
            )}

            <TestOutputPanel
              testOutput={testOutput}
              outputFormat={testOutputFormat}
              setOutputFormat={(format) => {
                setTestOutputFormat(format);
                saveFormatPreference(STORAGE_KEY_TEST_FORMAT, format);
              }}
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
