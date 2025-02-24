'use client'

import { useState, useEffect, useCallback, useRef } from "react";
import { Edge, ReactFlowProvider } from "reactflow";
import { useRouter } from "next/navigation";
import { TaskType } from "@/types/workflow";
import { Assistant } from "@/types/langgraph";
import { WorkflowNode } from "@/types/workflow";
import { createClient } from "@/supabase/client";
import { EmptyWorkflowState } from "./EmptyWorkflowState";
import { AgentSelectModal } from "./AgentSelectModal";
import { WorkflowCanvas } from "./WorkflowCanvas";
import { WorkflowHeader } from "./WorkflowHeader";
import { executeWorkflow } from "./WorkflowExecutionManager";
import { addAgent, addTask } from "./WorkflowNodeManager";
import { toast } from "@/hooks/use-toast";
import { TaskSidebar } from "./TaskSidebar";

interface WorkflowsBuilderProps {
  initialWorkflowId?: string;
}

function WorkflowBuilder({ initialWorkflowId }: WorkflowsBuilderProps) {
  const router = useRouter();
  const supabase = createClient();

  const [workflowName, setWorkflowName] = useState("Undefined Workflow");
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loadingAssistants, setLoadingAssistants] = useState(true);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [workflowId, setWorkflowId] = useState<string | undefined>(
    initialWorkflowId
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [isTaskSidebarOpen, setIsTaskSidebarOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isAgentSelectOpen, setIsAgentSelectOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const createdWorkflowRef = useRef(false);

  const handleAddTask = useCallback((agentId: string) => {
    setSelectedAgentId(agentId);
    setIsTaskSidebarOpen(true);
  }, []);

  const handleAddNextAgent = useCallback((sourceAgentId: string) => {
    setSelectedAgentId(sourceAgentId);
    setIsAgentSelectOpen(true);
  }, []);

  const handleConfigureTask = useCallback((taskId: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === "task" && node.data.workflow_task_id === taskId) {
          return {
            ...node,
            data: {
              ...node.data,
              isConfigOpen: true,
              onConfigClose: () => {
                setSelectedTaskId(null);
                setNodes((prevNodes) =>
                  prevNodes.map((n) =>
                    n.type === "task" && n.data.workflow_task_id === taskId
                      ? { ...n, data: { ...n.data, isConfigOpen: false } }
                      : n
                  )
                );
              },
            },
          };
        }
        return node;
      })
    );
  }, []);

  const handleTaskConfigClose = useCallback(() => {
    setSelectedTaskId(null);
  }, []);

  // Add event listener for task updates
  useEffect(() => {
    const handleTaskUpdate = (
      event: CustomEvent<{
        taskId: string;
        updates: {
          name: string;
          description: string;
          type: TaskType;
          config: {
            input: {
              source: string;
              parameters: Record<string, unknown>;
              prompt?: string;
            };
            output: {
              destination: string;
            };
          };
        };
      }>
    ) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.type === "task" &&
          node.data.workflow_task_id === event.detail.taskId
            ? {
                ...node,
                data: {
                  ...node.data,
                  ...event.detail.updates,
                  config: {
                    ...event.detail.updates.config,
                    input: {
                      ...event.detail.updates.config.input,
                      prompt: event.detail.updates.config.input.prompt || "",
                    },
                  },
                },
              }
            : node
        )
      );
    };

    window.addEventListener(
      "updateTaskNode",
      handleTaskUpdate as EventListener
    );
    return () => {
      window.removeEventListener(
        "updateTaskNode",
        handleTaskUpdate as EventListener
      );
    };
  }, []);

  // Create a new workflow immediately if we don't have an ID
  useEffect(() => {
    const initializeWorkflow = async () => {
      // Skip if we already have a workflow ID or if we've already created one
      if (workflowId || initialWorkflowId || createdWorkflowRef.current) return;
      createdWorkflowRef.current = true;

      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/auth/login");
          return;
        }

        // Create new workflow
        const { data: newWorkflow, error } = await supabase
          .from("workflows")
          .insert({
            name: workflowName,
            owner_id: user.id,
            nodes: [],
            edges: [],
            status: "draft",
            is_active: false,
          })
          .select()
          .single();

        if (error) throw error;

        // Set state without triggering navigation
        setWorkflowId(newWorkflow.workflow_id);
        setWorkflowName(newWorkflow.name);

        // Update URL without full navigation
        window.history.pushState(
          {},
          "",
          `/workflows/${newWorkflow.workflow_id}`
        );
      } catch (err) {
        console.error("Error creating workflow:", err);
        toast({
          title: "Failed to create workflow",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    initializeWorkflow();
  }, []);

  // Load existing workflow if ID is provided
  useEffect(() => {
    const loadWorkflow = async () => {
      // Only load if we have a workflowId (either initial or created) and we're not already loading
      if ((!workflowId && !initialWorkflowId) || loading) return;

      const idToLoad = workflowId || initialWorkflowId;
      setLoading(true);
      try {
        // Load workflow and assistants in parallel
        const [workflowResult, assistantsResponse] = await Promise.all([
          supabase
            .from("workflows")
            .select("*")
            .eq("workflow_id", idToLoad)
            .single(),
          fetch("/api/assistants"),
        ]);

        if (workflowResult.error) throw workflowResult.error;
        const workflow = workflowResult.data;

        if (workflow) {
          setWorkflowId(workflow.workflow_id);
          setWorkflowName(workflow.name);
          setNodes(
            workflow.nodes.map((node: WorkflowNode) => ({
              ...node,
              data: {
                ...node.data,
                workflowId: workflow.workflow_id,
                onAddTask: handleAddTask,
                onAddAgent: handleAddNextAgent,
                onConfigureTask: handleConfigureTask,
                isConfigOpen: false,
              },
            }))
          );
          setEdges(workflow.edges);
        }

        if (!assistantsResponse.ok) {
          throw new Error(`HTTP error! status: ${assistantsResponse.status}`);
        }
        const assistantsData = await assistantsResponse.json();
        setAssistants(assistantsData);
      } catch (err) {
        console.error("Error loading workflow:", err);
        toast({
          title: "Error loading workflow",
          variant: "destructive",
        });
        router.push("/workflows");
      } finally {
        setLoading(false);
        setLoadingAssistants(false);
      }
    };

    loadWorkflow();
  }, [workflowId, initialWorkflowId]);

  const handleSave = async () => {
    if (saving) return;

    if (!workflowName.trim()) {
      toast({
        title: "Please enter a workflow name",
        variant: "destructive",
      });
      return;
    }

    if (nodes.length === 0) {
      toast({
        title: "Workflow must contain at least one assistant.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const workflowData = {
        name: workflowName.trim(),
        nodes,
        edges,
        owner_id: undefined,
      };

      if (workflowId) {
        const { data, error } = await supabase
          .from("workflows")
          .update(workflowData)
          .eq("workflow_id", workflowId)
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          toast({
            title: "Workflow updated successfully",
            variant: "default",
          });

          setNodes(
            data[0].nodes.map((node: WorkflowNode) => ({
              ...node,
              data: {
                ...node.data,
                workflowId,
                onAddTask: handleAddTask,
                onAddAgent: handleAddNextAgent,
              },
            }))
          );
          setEdges(data[0].edges);
        }
      } else {
        const { data, error } = await supabase
          .from("workflows")
          .insert(workflowData)
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          const newWorkflowId = data[0].workflow_id;
          setWorkflowId(newWorkflowId);
          router.push(`/workflows/${newWorkflowId}`);

          toast({
            title: "Workflow saved successfully",
            variant: "default",
          });
        }
      }
    } catch (err) {
      console.error("Error saving workflow:", err);
      toast({
        title: "Failed to save workflow",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExecuteWorkflow = async () => {
    if (!workflowId) {
      toast({
        title: "Workflow ID is missing",
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);
    await executeWorkflow({
      workflowId,
      setNodes,
      setIsExecuting,
    });
  };

  const handleAgentSelect = async (assistant: Assistant) => {
    if (!workflowId) {
      toast({
        title: "Cannot add agent",
        description: "Workflow must be created first",
        variant: "destructive",
      });
      return;
    }

    await addAgent({
      workflowId,
      nodes,
      setNodes,
      setEdges,
      assistant,
      sourceAgentId: selectedAgentId || undefined,
      handlers: {
        onAddTask: handleAddTask,
        onAddAgent: handleAddNextAgent,
        onConfigureTask: handleConfigureTask,
      },
    });
    setIsAgentSelectOpen(false);
    setSelectedAgentId(null);
  };

  const handleTaskSelect = async (taskData: {
    type: TaskType;
    label: string;
    description: string;
  }) => {
    if (!selectedAgentId || !workflowId) {
      toast({
        title: "Cannot add task",
        description: "Both workflow and agent must be selected",
        variant: "destructive",
      });
      return;
    }

    try {
      const newTask = await addTask({
        workflowId,
        nodes,
        setNodes,
        setEdges,
        agentId: selectedAgentId,
        taskData: {
          type: taskData.type,
          name: taskData.label,
          description: taskData.description,
          assistant_id: selectedAgentId,
          workflow_id: workflowId,
        },
      });

      if (newTask?.workflow_task_id) {
        setSelectedTaskId(newTask.workflow_task_id);
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Failed to create task",
        variant: "destructive",
      });
    }

    setIsTaskSidebarOpen(false);
    setSelectedAgentId(null);
  };

  const handleAddFirstAgent = () => {
    setIsAgentSelectOpen(true);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-lg">Loading workflow...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col relative">
      <WorkflowHeader
        workflowName={workflowName}
        setWorkflowName={setWorkflowName}
        onSave={handleSave}
        onExecute={handleExecuteWorkflow}
        onBack={() => router.push("/workflows")}
        saving={saving}
        executing={isExecuting}
        workflowId={workflowId}
      />
      <div className="flex-1 relative">
        <WorkflowCanvas
          nodes={nodes}
          setNodes={setNodes}
          edges={edges}
          setEdges={setEdges}
          initialWorkflowId={workflowId}
          selectedTaskId={selectedTaskId}
          onTaskConfigClose={handleTaskConfigClose}
        />
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto">
              <EmptyWorkflowState
                type="empty"
                onAddFirstAgent={handleAddFirstAgent}
              />
            </div>
          </div>
        )}
        <TaskSidebar
          isOpen={isTaskSidebarOpen}
          onClose={() => {
            setIsTaskSidebarOpen(false);
            setSelectedAgentId(null);
          }}
          onTaskSelect={handleTaskSelect}
        />
      </div>
      <AgentSelectModal
        isOpen={isAgentSelectOpen}
        onClose={() => setIsAgentSelectOpen(false)}
        onSelect={handleAgentSelect}
        assistants={assistants}
        loading={loadingAssistants}
      />
    </div>
  );
}

export function WorkflowsBuilder(props: WorkflowsBuilderProps) {
  return (
    <ReactFlowProvider>
      <WorkflowBuilder {...props} />
    </ReactFlowProvider>
  );
}

