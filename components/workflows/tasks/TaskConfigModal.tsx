import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Task } from "@/types/workflow";
import { toast } from "@/hooks/useToast";
import { TaskModalHeader } from "./TaskModalHeader";
import { PreviousNodeOutputPanel } from "./PreviousNodeOutputPanel";
import { TaskConfigurationPanel } from "./TaskConfigurationPanel";
import { TestOutputPanel } from "./TestOutputPanel";
import { Button } from "@/components/ui/button";
import { UserPlus, X } from "lucide-react";
import { AgentSelectModal } from "../AgentSelectModal";
import { Assistant } from "@/types/assistant";
import { useAgent } from "@/hooks/useAgent";
import { createClient } from "@/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
    loadFormatPreference(STORAGE_KEY_PREV_FORMAT, "json")
  );
  const [testOutputFormat, setTestOutputFormat] = useState<OutputFormat>(() => 
    loadFormatPreference(STORAGE_KEY_TEST_FORMAT, "json")
  );
  const [isLoading, setIsLoading] = useState(false);

  // Reload format preferences when modal opens
  useEffect(() => {
    if (isOpen) {
      setPrevOutputFormat(loadFormatPreference(STORAGE_KEY_PREV_FORMAT, "json"));
      setTestOutputFormat(loadFormatPreference(STORAGE_KEY_TEST_FORMAT, "json"));
    }
  }, [isOpen]);
  const [testOutput, setTestOutput] = useState<TestOutput | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadedPreviousNodeOutput, setLoadedPreviousNodeOutput] = useState<TaskOutput | null>(previousNodeOutput || null);
  const { assistant, isLoading: isAssistantLoading } = useAgent(
    currentTask.assignedAssistant?.id,
    { enabled: isOpen }
  );
  const [isAssistantSelectOpen, setIsAssistantSelectOpen] = useState(false);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loadingAssistants, setLoadingAssistants] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile/tablet
  useEffect(() => {
    const updateIsMobile = () => {
      if (typeof window === "undefined") return;
      setIsMobile(window.innerWidth < 1024); // Below lg breakpoint
    };
    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);
    return () => window.removeEventListener("resize", updateIsMobile);
  }, []);

  useEffect(() => {
    // Only sync from props when opening or switching to a different task id
    if (isOpen) {
      // Update loaded previousNodeOutput from prop
      setLoadedPreviousNodeOutput(previousNodeOutput || null);
      
      // Load the latest task data from the database to ensure we have the most recent prompt
      const loadLatestTask = async () => {
        try {
          const supabase = createClient();
          
          // Load workflow to get edges and find upstream node if previousNodeOutput is missing
          if (!previousNodeOutput) {
            const { data: workflow } = await supabase
              .from("workflows")
              .select("edges, nodes")
              .eq("workflow_id", task.workflow_id)
              .single();
            
            if (workflow) {
              const edges = workflow.edges || [];
              const nodes = workflow.nodes || [];
              
              // Find incoming edge to this task
              const taskNodeId = `task-${task.workflow_task_id}`;
              const incomingEdge = edges.find((e: any) => e.target === taskNodeId);
              
              if (incomingEdge) {
                // Find source node
                const sourceNode = nodes.find((n: any) => n.id === incomingEdge.source);
                if (sourceNode && sourceNode.type === "task") {
                  const sourceTaskId = sourceNode.data?.workflow_task_id;
                  if (sourceTaskId) {
                    // Load source task to get test output
                    const { data: sourceTask } = await supabase
                      .from("workflow_tasks")
                      .select("*")
                      .eq("workflow_task_id", sourceTaskId)
                      .single();
                    
                    if (sourceTask?.metadata?.testOutput) {
                      const upstreamTaskOutput: TaskOutput = {
                        result: sourceTask.metadata.testOutput.result,
                        metadata: sourceTask.metadata.testOutput.metadata,
                      };
                      setLoadedPreviousNodeOutput(upstreamTaskOutput);
                    }
                  }
                }
              }
            }
          }
          
          const response = await fetch(
            `/api/workflows/${task.workflow_id}/tasks/${task.workflow_task_id}`
          );
          if (response.ok) {
            const latestTask = await response.json();
            // Transform the task to ensure assignedAssistant is properly set
            const transformedTask: Task = {
              ...latestTask,
              assignedAssistant: latestTask.config?.assigned_assistant
                ? {
                    id: latestTask.config.assigned_assistant.id,
                    name: latestTask.config.assigned_assistant.name,
                    avatar: latestTask.config.assigned_assistant.avatar,
                  }
                : latestTask.assignedAssistant || undefined,
            };
            
            setCurrentTask(transformedTask);
            
            // Load persisted test output from metadata
            if (latestTask.metadata) {
              if (latestTask.metadata.testOutput) {
                setTestOutput(latestTask.metadata.testOutput as TestOutput);
              }
            }
          } else {
            // Fallback to prop task if fetch fails
            const transformedTask: Task = {
              ...task,
              assignedAssistant: task.config?.assigned_assistant
                ? {
                    id: task.config.assigned_assistant.id,
                    name: task.config.assigned_assistant.name,
                    avatar: task.config.assigned_assistant.avatar,
                  }
                : task.assignedAssistant || undefined,
            };
            setCurrentTask(transformedTask);
            
            if (task.metadata?.testOutput) {
              setTestOutput(task.metadata.testOutput as TestOutput);
            }
          }
        } catch (error) {
          console.error("Error loading latest task:", error);
          // Fallback to prop task
          const transformedTask: Task = {
            ...task,
            assignedAssistant: task.config?.assigned_assistant
              ? {
                  id: task.config.assigned_assistant.id,
                  name: task.config.assigned_assistant.name,
                  avatar: task.config.assigned_assistant.avatar,
                }
              : task.assignedAssistant || undefined,
          };
          setCurrentTask(transformedTask);
        }
      };
      
      loadLatestTask();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, task.workflow_task_id, previousNodeOutput]);

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

  // Only update parent when task or assistant actually changes meaningfully
  // Don't trigger on every render to avoid unnecessary updates
  useEffect(() => {
    if (currentTask && assistant && currentTask.assignedAssistant?.id === assistant.assistant_id) {
      onUpdate(currentTask, assistant);
    }
  }, [currentTask.workflow_task_id, currentTask.assignedAssistant?.id, assistant?.assistant_id, onUpdate]);

  const saveTask = async (taskToSave: Task) => {
    const payload = {
      name: taskToSave.name,
      description: taskToSave.description,
      task_type: taskToSave.task_type,
      config: taskToSave.config,
      assignedAssistant: taskToSave.assignedAssistant,
      integration: taskToSave.integration,
      metadata: taskToSave.metadata || {},
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
    
    // Reload the task to get the latest data
    const updatedTask = await response.json();
    
    // Transform the API response to match our Task interface
    // The API stores assigned_assistant in config, but we need it at the top level
    const transformedTask: Task = {
      ...updatedTask,
      assignedAssistant: updatedTask.config?.assigned_assistant
        ? {
            id: updatedTask.config.assigned_assistant.id,
            name: updatedTask.config.assigned_assistant.name,
            avatar: updatedTask.config.assigned_assistant.avatar,
          }
        : updatedTask.assignedAssistant || undefined,
    };
    
    return transformedTask;
  };

  const handleTest = async () => {
    try {
      if (!currentTask.assignedAssistant?.id) {
        throw new Error("Please assign an agent before testing");
      }

      setIsLoading(true);
      setIsStreaming(true);
      // Clear test output when starting a new test
      setTestOutput(null);

      if (!currentTask.config?.input?.prompt) {
        throw new Error("Please provide a prompt before testing");
      }

      // Save first so state persists and next nodes can use it
      const savedTask = await saveTask(currentTask);
      if (savedTask) {
        setCurrentTask(savedTask);
      }
      
      // Pass current configuration so the server can honor latest toggles immediately
      const result = await onTest((currentTask?.config as unknown as Record<string, unknown>) || {});
      const testOutputData = result as TestOutput;
      
      // Only set output if we have actual content (not empty or just the prompt)
      if (testOutputData && testOutputData.content && testOutputData.content.trim() !== currentTask.config?.input?.prompt) {
        setTestOutput(testOutputData);
        
        // Persist test output in task metadata
        const updatedTask = {
          ...currentTask,
          metadata: {
            ...(currentTask.metadata || {}),
            testOutput: testOutputData,
            lastTestAt: new Date().toISOString(),
          },
        };
        setCurrentTask(updatedTask);
        await saveTask(updatedTask);
      }
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
      const errorOutput: TestOutput = {
        type: "error",
        error: err instanceof Error ? err.message : "Unknown error occurred",
      };
      setTestOutput(errorOutput);
      
      // Persist error output too
      const updatedTask = {
        ...currentTask,
        metadata: {
          ...(currentTask.metadata || {}),
          testOutput: errorOutput,
          lastTestAt: new Date().toISOString(),
        },
      };
      setCurrentTask(updatedTask);
      await saveTask(updatedTask);
    } finally {
      setIsLoading(false);
      // allow streaming indicator to be cleared by completion event if provided
      setIsStreaming(false);
    }
  };

  const handleAssistantSelect = async (selectedAssistant: Assistant) => {
    try {
      const isAgentChange = currentTask.assignedAssistant?.id !== selectedAssistant.assistant_id;
      const shouldClearDownstream = workflowType === "sequential" && isAgentChange;
      const { testOutput: _testOutput, lastTestAt: _lastTestAt, ...remainingMetadata } =
        (currentTask.metadata || {}) as Record<string, unknown>;
      const cleanedMetadata = shouldClearDownstream ? remainingMetadata : currentTask.metadata;

      const response = await fetch(
        `/api/workflows/${currentTask.workflow_id}/tasks/${currentTask.workflow_task_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...currentTask,
            metadata: cleanedMetadata,
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
        metadata: cleanedMetadata,
      } as Task;
      setCurrentTask(updatedTask);
      if (shouldClearDownstream) {
        setTestOutput(null);
        window.dispatchEvent(
          new CustomEvent("taskAgentChanged", {
            detail: {
              workflowId: currentTask.workflow_id,
              taskId: currentTask.workflow_task_id,
            },
          })
        );
      }
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
        <DialogContent className="max-w-7xl max-h-[90vh] lg:max-h-[90vh] w-[calc(100%-2rem)] md:w-[calc(100%-4rem)]">
          {/* Close button - visible on all screens */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>

          <TaskModalHeader
            task={currentTask}
            assistant={assistant ?? null}
            isLoading={isLoading || loadingAssistants}
            onTest={handleTest}
            onChangeAssistant={() => setIsAssistantSelectOpen(true)}
          />

          {/* Desktop: Grid layout, Mobile/Tablet: Accordion layout */}
          {isMobile ? (
            <div className="overflow-y-auto max-h-[calc(90vh-200px)] mt-4">
              <Accordion type="multiple" className="space-y-3">
                {/* Previous Node Output Accordion */}
                <AccordionItem value="previous-output" className="border-2 border-emerald-200/50 dark:border-emerald-800/50 rounded-xl bg-gradient-to-br from-emerald-50/30 to-green-50/30 dark:from-emerald-950/20 dark:to-green-950/20">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <h3 className="font-semibold text-sm bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
                        Previous Node Output
                      </h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-2 pb-2">
                    <PreviousNodeOutputPanel
                      data={loadedPreviousNodeOutput || previousNodeOutput || null}
                      outputFormat={prevOutputFormat}
                      setOutputFormat={(format) => {
                        setPrevOutputFormat(format);
                        saveFormatPreference(STORAGE_KEY_PREV_FORMAT, format);
                      }}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* Task Configuration Accordion */}
                <AccordionItem value="task-config" className="border-2 border-violet-200/50 dark:border-violet-800/50 rounded-xl bg-gradient-to-br from-violet-50/30 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-950/20">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-violet-500" />
                      <h3 className="font-semibold text-sm bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
                        Task Configuration
                      </h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-2 pb-2">
                    {loadingAssistants ? (
                      <div className="relative overflow-hidden rounded-xl border-2 border-violet-200/50 dark:border-violet-800/50 bg-gradient-to-br from-violet-50/30 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-950/20">
                        <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-200 dark:border-violet-800 border-t-violet-600 dark:border-t-violet-400 mb-4"></div>
                          <p className="text-sm text-muted-foreground">Loading agent information...</p>
                        </div>
                      </div>
                    ) : !assistant ? (
                      <div className="relative overflow-hidden rounded-xl border-2 border-violet-200/50 dark:border-violet-800/50 bg-gradient-to-br from-violet-50/30 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-950/20">
                        <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
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
                        onSave={async () => {
                          const taskToSave = {
                            ...currentTask,
                            assignedAssistant: currentTask.assignedAssistant || (currentTask.config?.assigned_assistant
                              ? {
                                  id: currentTask.config.assigned_assistant.id,
                                  name: currentTask.config.assigned_assistant.name,
                                  avatar: currentTask.config.assigned_assistant.avatar,
                                }
                              : undefined),
                          };

                          const updatedTask = await saveTask(taskToSave);
                          if (updatedTask) {
                            setCurrentTask(updatedTask);
                            const assistantToPass = assistant || (updatedTask.assignedAssistant ? {
                              assistant_id: updatedTask.assignedAssistant.id,
                              name: updatedTask.assignedAssistant.name,
                              metadata: {
                                agent_avatar: updatedTask.assignedAssistant.avatar,
                              },
                            } as Assistant : null);
                            onUpdate(updatedTask, assistantToPass);
                          }
                        }}
                      />
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* Test Output Accordion */}
                <AccordionItem value="test-output" className="border-2 border-blue-200/50 dark:border-blue-800/50 rounded-xl bg-gradient-to-br from-blue-50/30 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/20">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <h3 className="font-semibold text-sm bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                        Test Output
                      </h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-2 pb-2">
                    <TestOutputPanel
                      testOutput={testOutput}
                      outputFormat={testOutputFormat}
                      setOutputFormat={(format) => {
                        if (!isStreaming) {
                          setTestOutputFormat(format);
                          saveFormatPreference(STORAGE_KEY_TEST_FORMAT, format);
                        }
                      }}
                      isStreaming={isStreaming}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 mt-4 overflow-y-auto max-h-[calc(90vh-200px)]">
              <PreviousNodeOutputPanel
                data={loadedPreviousNodeOutput || previousNodeOutput || null}
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
                  onSave={async () => {
                    const taskToSave = {
                      ...currentTask,
                      assignedAssistant: currentTask.assignedAssistant || (currentTask.config?.assigned_assistant
                        ? {
                            id: currentTask.config.assigned_assistant.id,
                            name: currentTask.config.assigned_assistant.name,
                            avatar: currentTask.config.assigned_assistant.avatar,
                          }
                        : undefined),
                    };

                    const updatedTask = await saveTask(taskToSave);
                    if (updatedTask) {
                      setCurrentTask(updatedTask);
                      const assistantToPass = assistant || (updatedTask.assignedAssistant ? {
                        assistant_id: updatedTask.assignedAssistant.id,
                        name: updatedTask.assignedAssistant.name,
                        metadata: {
                          agent_avatar: updatedTask.assignedAssistant.avatar,
                        },
                      } as Assistant : null);
                      onUpdate(updatedTask, assistantToPass);
                    }
                  }}
                />
              )}

              <TestOutputPanel
                testOutput={testOutput}
                outputFormat={testOutputFormat}
                setOutputFormat={(format) => {
                  if (!isStreaming) {
                    setTestOutputFormat(format);
                    saveFormatPreference(STORAGE_KEY_TEST_FORMAT, format);
                  }
                }}
                isStreaming={isStreaming}
              />
            </div>
          )}
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
