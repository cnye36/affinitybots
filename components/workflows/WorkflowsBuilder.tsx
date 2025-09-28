"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Edge, ReactFlowProvider } from "reactflow";
import { useRouter } from "next/navigation";
import {
  TaskType,
  WorkflowNode,
  TriggerNodeData,
  TaskNodeData,
  TriggerType,
} from "@/types/workflow";
import { createClient } from "@/supabase/client";
import { EmptyWorkflowState } from "../../EmptyWorkflowState";
import { AgentSelectModal } from "./AgentSelectModal";
import { TriggerSelectModal } from "./TriggerSelectModal";
import { WorkflowCanvas } from "./WorkflowCanvas";
import { WorkflowHeader } from "./WorkflowHeader";
import { executeWorkflow } from "./WorkflowExecutionManager";
import { toast } from "@/hooks/useToast";
import { TaskSidebar } from "./tasks/TaskSidebar";
import { WorkflowExecutions } from "./WorkflowExecutions";
import { TriggerConfigModal } from "./TriggerConfigModal";

import { Assistant } from "@/types/assistant";

interface WorkflowsBuilderProps {
  initialWorkflowId?: string;
}

interface WorkflowTrigger {
  trigger_id: string;
  name: string;
  description: string;
  trigger_type: TriggerType;
  workflow_id: string;
  config: Record<string, unknown>;
}

interface StoredWorkflowNode {
  id: string;
  type: "task";
  position: { x: number; y: number };
  data: {
    workflow_task_id: string;
    name: string;
    description: string;
    task_type: TaskType;
    workflow_id: string;
    assignedAssistant?: {
      id: string;
      name: string;
      avatar?: string;
    };
    config: {
      input: {
        source: string;
        parameters: Record<string, unknown>;
      };
      output: {
        destination: string;
      };
    };
  };
}

function WorkflowBuilder({ initialWorkflowId }: WorkflowsBuilderProps) {
  const router = useRouter();
  const supabase = createClient();

  const isValidUuid = (value?: string | null) =>
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    );

  const [workflowName, setWorkflowName] = useState("Undefined Workflow");
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [workflowId, setWorkflowId] = useState<string | undefined>(
    initialWorkflowId
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [isTaskSidebarOpen, setIsTaskSidebarOpen] = useState(false);
  const [isAgentSelectOpen, setIsAgentSelectOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskForAgent, setSelectedTaskForAgent] = useState<
    string | null
  >(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [pendingTask, setPendingTask] = useState<{
    name: string;
    description: string;
    task_type: TaskType;
  } | null>(null);
  const [isAgentSelectionLoading, setIsAgentSelectionLoading] = useState(false);
  const [mode, setMode] = useState<"editor" | "executions">("editor");
  const [isTriggerConfigOpen, setIsTriggerConfigOpen] = useState(false);
  const [selectedTriggerId, setSelectedTriggerId] = useState<string | null>(null);

  const createdWorkflowRef = useRef(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedSnapshotRef = useRef<string>("");

  type DbWorkflowTask = {
    workflow_task_id: string;
    name: string;
    description?: string;
    task_type: TaskType;
    position?: number;
    config?: any;
  };

  const handleConfigureTrigger = useCallback((triggerId: string) => {
    setSelectedTriggerId(triggerId);
    setIsTriggerConfigOpen(true);
  }, []);

  const [isTriggerSelectOpen, setIsTriggerSelectOpen] = useState(false);

  const handleAddTrigger = useCallback(async () => {
    if (!workflowId) {
      toast({
        title: "Cannot add trigger",
        description: "Workflow must be created first",
        variant: "destructive",
      });
      return;
    }
    setIsTriggerSelectOpen(true);
  }, [workflowId]);

  const handleCreateTrigger = useCallback(async (payload: { trigger_type: TriggerType; name: string; description?: string; config: Record<string, unknown>; }) => {
    if (!workflowId) return;
    try {
      const { data: newTrigger, error } = await supabase
        .from("workflow_triggers")
        .insert({
          workflow_id: workflowId,
          name: payload.name,
          description: payload.description,
          trigger_type: payload.trigger_type,
          config: payload.config,
        })
        .select()
        .single();
      if (error) throw error;

      const newNode: WorkflowNode = {
        id: `trigger-${newTrigger.trigger_id}`,
        type: "trigger" as const,
        position: { x: 100, y: 100 },
        data: {
          ...newTrigger,
          workflow_id: workflowId,
          hasConnectedTask: false,
          onOpenTaskSidebar: () => setIsTaskSidebarOpen(true),
          onConfigureTrigger: handleConfigureTrigger,
        } as TriggerNodeData,
      };
      setNodes((nds) => [...nds, newNode]);
      toast({ title: "Trigger added", variant: "default" });
    } catch (err) {
      console.error("Error creating trigger:", err);
      toast({ title: "Failed to create trigger", variant: "destructive" });
    }
  }, [workflowId, supabase, handleConfigureTrigger]);

  const handleAssignAgent = useCallback((taskId: string) => {
    setSelectedTaskForAgent(taskId);
    setIsAgentSelectOpen(true);
  }, []);

  const handleConfigureTask = useCallback((taskId: string) => {
    setNodes((nds: WorkflowNode[]) =>
      nds.map((node: WorkflowNode) => {
        if (node.type === "task" && node.data.workflow_task_id === taskId) {
          return {
            ...node,
            data: {
              ...node.data,
              isConfigOpen: true,
              onConfigClose: () => {
                setSelectedTaskId(null);
                setNodes((prevNodes: WorkflowNode[]) =>
                  prevNodes.map((n: WorkflowNode) =>
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
      setNodes((nds: WorkflowNode[]) =>
        nds.map((node: WorkflowNode) =>
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
    // Listen for test completion to propagate as previousNodeOutput to the next node in sequence
    const handleTaskTestCompleted = (
      e: CustomEvent<{
        workflowTaskId: string;
        output: { result: unknown; metadata?: Record<string, unknown> };
      }>
    ) => {
      setNodes((nds: WorkflowNode[]) => {
        // Find the current node id and its next by edges
        const currentNode = nds.find(
          (n) => n.type === "task" && n.data.workflow_task_id === e.detail.workflowTaskId
        );
        if (!currentNode) return nds;
        const currentNodeId = currentNode.id;
        let nextNodeId: string | null = null;
        const nextEdge = edges.find((edge) => edge.source === currentNodeId);
        if (nextEdge) {
          nextNodeId = nextEdge.target;
        } else {
          // Fallback 1: use position index if present
          const taskNodes = nds.filter((n) => n.type === "task");
          // Prefer explicit data.position if set, otherwise x coordinate
          const sorted = [...taskNodes].sort((a, b) => {
            const aPos = (a.data as any)?.position ?? a.position.x;
            const bPos = (b.data as any)?.position ?? b.position.x;
            return (aPos || 0) - (bPos || 0);
          });
          const idx = sorted.findIndex((n) => n.id === currentNodeId);
          if (idx >= 0 && idx < sorted.length - 1) {
            nextNodeId = sorted[idx + 1].id;
          }
        }
        if (!nextNodeId) return nds;
        return nds.map((n) =>
          n.id === nextNodeId && n.type === "task"
            ? ({
                ...n,
                data: {
                  ...n.data,
                  previousNodeOutput: {
                    result: e.detail.output.result,
                    metadata: e.detail.output.metadata || {},
                  },
                  // Attach the last thread id from the test stream if provided via window metadata event
                  previousNodeThreadId: (window as any)?.__lastTestThreadId || n.data?.previousNodeThreadId,
                },
              } as WorkflowNode)
            : n
        );
      });
    };
    window.addEventListener(
      "taskTestCompleted",
      handleTaskTestCompleted as EventListener
    );
    return () => {
      window.removeEventListener(
        "updateTaskNode",
        handleTaskUpdate as EventListener
      );
      window.removeEventListener(
        "taskTestCompleted",
        handleTaskTestCompleted as EventListener
      );
    };
  }, [edges]);

  // Create a new workflow immediately if we don't have an ID
  useEffect(() => {
    const initializeWorkflow = async () => {
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

        // Create new empty workflow
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
      if ((!workflowId && !initialWorkflowId) || loading) return;

      const idToLoad = workflowId || initialWorkflowId;
      if (!isValidUuid(idToLoad)) {
        // Avoid querying with an invalid UUID (prevents 22P02 errors)
        setLoading(false);
        setLoadingAgents(false);
        return;
      }
      setLoading(true);
      try {
        const [workflowResult, triggersResult] = await Promise.all([
          supabase
            .from("workflows")
            .select("*")
            .eq("workflow_id", idToLoad)
            .single(),
          supabase
            .from("workflow_triggers")
            .select("*")
            .eq("workflow_id", idToLoad),
        ]);

        if (workflowResult.error) throw workflowResult.error;
        if (triggersResult.error) throw triggersResult.error;

        const workflow = workflowResult.data;
        const triggers = triggersResult.data as WorkflowTrigger[];

        if (workflow) {
          setWorkflowId(workflow.workflow_id);
          setWorkflowName(workflow.name);

          const storedNodes = (workflow.nodes || []) as StoredWorkflowNode[];

          if (Array.isArray(storedNodes) && storedNodes.length > 0) {
            // Combine trigger nodes with stored task nodes
            const allNodes: WorkflowNode[] = [
              ...triggers.map((trigger: WorkflowTrigger) => ({
                id: `trigger-${trigger.trigger_id}`,
                type: "trigger" as const,
                position: { x: 100, y: 100 },
                data: {
                  ...trigger,
                  workflow_id: workflow.workflow_id,
                  hasConnectedTask:
                    Array.isArray(workflow.edges) &&
                    workflow.edges.some(
                      (edge: Edge) =>
                        edge.source === `trigger-${trigger.trigger_id}`
                    ),
                  onOpenTaskSidebar: () => setIsTaskSidebarOpen(true),
                  onConfigureTrigger: handleConfigureTrigger,
                } as TriggerNodeData,
              })),
              ...storedNodes.map((node: StoredWorkflowNode) => ({
                ...node,
                type: "task" as const,
                data: {
                  workflow_task_id: node.data.workflow_task_id,
                  workflow_id: workflow.workflow_id,
                  name: node.data.name,
                  description: node.data.description,
                  task_type: node.data.task_type,
                  assignedAssistant: node.data.assignedAssistant,
                  config: node.data.config,
                  onAssignAssistant: handleAssignAgent,
                  onConfigureTask: handleConfigureTask,
                  isConfigOpen: false,
                  status: "idle",
                } as unknown as TaskNodeData,
              })),
            ];

            setNodes(allNodes);
            setEdges(workflow.edges);
          } else {
            // Fallback: reconstruct nodes from workflow_tasks if stored nodes are empty
            const { data: tasks, error: tasksError } = await supabase
              .from("workflow_tasks")
              .select("*")
              .eq("workflow_id", idToLoad)
              .order("position", { ascending: true });

            if (tasksError) throw tasksError;

            const taskNodes: WorkflowNode[] = ((tasks || []) as DbWorkflowTask[]).map((t: DbWorkflowTask) => ({
              id: `task-${t.workflow_task_id}`,
              type: "task" as const,
              position: { x: 300 + (t.position || 0) * 400, y: 100 },
              data: {
                workflow_task_id: t.workflow_task_id,
                name: t.name,
                description: t.description || "",
                task_type: t.task_type,
                workflow_id: workflow.workflow_id,
                assignedAssistant: t.config?.assigned_assistant,
                config: t.config?.input && t.config?.output
                  ? {
                      input: {
                        source: t.config.input.source || "previous_node",
                        parameters: t.config.input.parameters || {},
                        prompt: t.config.input.prompt || "",
                      },
                      output: {
                        destination: t.config.output.destination || "next_node",
                      },
                    }
                  : {
                      input: { source: "previous_node", parameters: {}, prompt: "" },
                      output: { destination: "next_node" },
                    },
                status: "idle",
                onAssignAssistant: handleAssignAgent,
                onConfigureTask: handleConfigureTask,
                isConfigOpen: false,
                onConfigClose: () => setSelectedTaskId(null),
              } as unknown as TaskNodeData,
            }));

            // Build simple sequential edges based on position
            const sortedTaskNodes = [...taskNodes].sort((a, b) => {
              const aPos = ((tasks || []) as DbWorkflowTask[]).find((t: DbWorkflowTask) => `task-${t.workflow_task_id}` === a.id)?.position ?? 0;
              const bPos = ((tasks || []) as DbWorkflowTask[]).find((t: DbWorkflowTask) => `task-${t.workflow_task_id}` === b.id)?.position ?? 0;
              return aPos - bPos;
            });

            const sequentialEdges: Edge[] = [];
            for (let i = 0; i < sortedTaskNodes.length - 1; i++) {
              sequentialEdges.push({
                id: `edge-${sortedTaskNodes[i].id}-${sortedTaskNodes[i + 1].id}`,
                source: sortedTaskNodes[i].id,
                target: sortedTaskNodes[i + 1].id,
                type: "custom",
              });
            }

            // Trigger nodes
            const triggerNodes: WorkflowNode[] = triggers.map(
              (trigger: WorkflowTrigger) => ({
                id: `trigger-${trigger.trigger_id}`,
                type: "trigger" as const,
                position: { x: 100, y: 100 },
                data: {
                  ...trigger,
                  workflow_id: workflow.workflow_id,
                  hasConnectedTask: sortedTaskNodes.length > 0,
                  onOpenTaskSidebar: () => setIsTaskSidebarOpen(true),
                  onConfigureTrigger: handleConfigureTrigger,
                } as TriggerNodeData,
              })
            );

            // Connect trigger to first task if exists
            if (triggerNodes.length > 0 && sortedTaskNodes.length > 0) {
              sequentialEdges.unshift({
                id: `edge-${triggerNodes[0].id}-${sortedTaskNodes[0].id}`,
                source: triggerNodes[0].id,
                target: sortedTaskNodes[0].id,
                type: "custom",
              });
            }

            setNodes([...triggerNodes, ...taskNodes]);
            setEdges(sequentialEdges);
          }
        }
      } catch (err) {
        console.error("Error loading workflow:", err);
        toast({
          title: "Error loading workflow",
          variant: "destructive",
        });
        router.push("/workflows");
      } finally {
        setLoading(false);
        setLoadingAgents(false);
      }
    };

    loadWorkflow();
  }, [workflowId, initialWorkflowId, handleAssignAgent, handleConfigureTask, handleConfigureTrigger]);

  // Autosave nodes and edges to workflows table (debounced)
  useEffect(() => {
    if (!workflowId || !isValidUuid(workflowId)) return;

    // Serialize only task nodes (avoid functions in data)
    const serializableNodes: StoredWorkflowNode[] = nodes
      .filter((n) => n.type === "task")
      .map((n) => ({
        id: n.id,
        type: "task",
        position: n.position,
        data: {
          workflow_task_id: (n.data as any).workflow_task_id,
          name: (n.data as any).name,
          description: (n.data as any).description,
          task_type: (n.data as any).task_type,
          workflow_id: (n.data as any).workflow_id,
          assignedAssistant: (n.data as any).assignedAssistant,
          config: (n.data as any).config,
        },
      }));

    const serializableEdges: Edge[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: e.type,
    } as Edge));

    const snapshot = JSON.stringify({ serializableNodes, serializableEdges });
    if (snapshot === lastSavedSnapshotRef.current) return;

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from("workflows")
          .update({ nodes: serializableNodes, edges: serializableEdges })
          .eq("workflow_id", workflowId);
        if (!error) {
          lastSavedSnapshotRef.current = snapshot;
        }
      } catch (e) {
        // Non-blocking; autosave errors are logged silently
        console.error("Autosave failed:", e);
      }
    }, 800);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [nodes, edges, workflowId, supabase]);

  // Load assistants
  useEffect(() => {
    const loadAssistants = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not authenticated");
        }

        interface UserAgent {
          assistant: Assistant;
        }

        const { data: agentsData, error } = await supabase
          .from("user_assistants")
          .select(
            `
            assistant:assistant (*)
          `
          )
          .eq("user_id", user.id);

        if (error) throw error;

        // Extract just the agent data from the joined results
        setAssistants(agentsData?.map((ua: UserAgent) => ua.assistant) || []);
      } catch (err) {
        console.error("Error loading agents:", err);
        toast({
          title: "Failed to load agents",
          variant: "destructive",
        });
      } finally {
        setLoadingAgents(false);
      }
    };

    loadAssistants();
  }, [supabase]);

  // Set trigger as active when workflow is loaded
  useEffect(() => {
    if (nodes.length > 0 && !activeNodeId) {
      const triggerNode = nodes.find((n) => n.type === "trigger");
      if (triggerNode) {
        setActiveNodeId(triggerNode.id);
      }
    }
  }, [nodes, activeNodeId]);

  // Handle adding task from an existing task
  const handleAddTaskFromNode = useCallback(
    (sourceNodeId: string) => {
      // Store the source node ID to use when the task is created
      const sourceNode = nodes.find((n) => n.id === sourceNodeId);
      if (sourceNode) {
        setActiveNodeId(sourceNode.id);
      }
      setIsTaskSidebarOpen(true);
    },
    [nodes]
  );

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
                onAssignAgent: handleAssignAgent,
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
        title: "Cannot assign agent",
        description: "Workflow must be selected",
        variant: "destructive",
      });
      return;
    }

    setIsAgentSelectionLoading(true);

    try {
      // Case 1: Creating a new task with an assigned agent
      if (selectedTaskForAgent === "pending" && pendingTask) {
        // Create the task with the selected assistant
        const taskPayload = {
          workflow_id: workflowId,
          name: pendingTask.name,
          description: pendingTask.description,
          task_type: pendingTask.task_type,
          assistant_id: assistant.assistant_id,
          agent_name: assistant.name,
          agent_avatar: assistant.metadata.agent_avatar,
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

        const newTask = await response.json();

        const newNode: WorkflowNode = {
          id: `task-${newTask.workflow_task_id}`,
          type: "task" as const,
          position: { x: 300, y: 100 },
          data: {
            workflow_task_id: newTask.workflow_task_id,
            name: newTask.name,
            description: newTask.description || "",
            task_type: newTask.task_type,
            workflow_id: workflowId,
            assignedAssistant:
              newTask.config?.assigned_assistant || {
                id: assistant.assistant_id,
                name: assistant.name,
                avatar: assistant.metadata.agent_avatar,
              },
            config: {
              input: {
                source: "previous_node",
                parameters: {},
                prompt: "",
              },
              output: {
                destination: "next_node",
              },
            },
            status: "idle",
            onAssignAssistant: handleAssignAgent,
            onConfigureTask: handleConfigureTask,
            isConfigOpen: false,
            onConfigClose: () => {
              setSelectedTaskId(null);
              setNodes((prevNodes) =>
                prevNodes.map((n) =>
                  n.type === "task" &&
                  n.data.workflow_task_id === newTask.workflow_task_id
                    ? { ...n, data: { ...n.data, isConfigOpen: false } }
                    : n
                )
              );
            },
          } as unknown as TaskNodeData,
        };

        // Position the new node relative to the active node
        if (activeNodeId) {
          const sourceNode = nodes.find((n) => n.id === activeNodeId);
          if (sourceNode) {
            newNode.position = {
              x: sourceNode.position.x + 400,
              y: sourceNode.position.y,
            };

            // Create an edge from the source node to the new node
            const newEdge = {
              id: `edge-${sourceNode.id}-${newNode.id}`,
              source: sourceNode.id,
              target: newNode.id,
              type: "custom",
            };
            setEdges((eds) => [...eds, newEdge]);
          }
        }

        setNodes((nds) => [...nds, newNode]);
        setIsTaskSidebarOpen(false);
        setSelectedTaskId(newTask.workflow_task_id);
        setActiveNodeId(newNode.id);

        // Update the trigger node to indicate it has a connected task
        if (
          activeNodeId &&
          nodes.find((n) => n.id === activeNodeId)?.type === "trigger"
        ) {
          setNodes((currentNodes) =>
            currentNodes.map((node) =>
              node.id === activeNodeId && node.type === "trigger"
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      hasConnectedTask: true,
                    },
                  }
                : node
            )
          );
        }

        // Clean up
        setPendingTask(null);
        setIsAgentSelectOpen(false);
        setSelectedTaskForAgent(null);

        toast({
          title: "Task created with assigned agent",
          variant: "default",
        });
        setIsAgentSelectionLoading(false);
        return;
      }

      // Case 2: Updating an existing task with an assistant
      if (!selectedTaskForAgent || selectedTaskForAgent === "pending") {
        toast({
          title: "Cannot assign agent",
          description: "Task must be selected",
          variant: "destructive",
        });
        setIsAgentSelectionLoading(false);
        return;
      }

      // Update the task with the selected agent in the database
      const { error: updateError } = await supabase
        .from("workflow_tasks")
        .update({
          // Store agent ID in assistant_id field for database queries
          assistant_id: assistant.assistant_id,
          // Store full agent details in config for UI
          config: {
            ...(await supabase
              .from("workflow_tasks")
              .select("config")
              .eq("workflow_task_id", selectedTaskForAgent)
              .single()
              .then(
                (result: { data: { config: Record<string, unknown> } }) =>
                  result.data?.config || {}
              )),
            assigned_assistant: {
              id: assistant.assistant_id,
              name: assistant.name,
              avatar: assistant.metadata.agent_avatar,
            },
          },
        })
        .eq("workflow_task_id", selectedTaskForAgent);

      if (updateError) throw updateError;

      // Update the node in the UI
      setNodes((nds) =>
        nds.map((node) => {
          if (
            node.type === "task" &&
            node.data.workflow_task_id === selectedTaskForAgent
          ) {
            return {
              ...node,
              data: {
                ...node.data,
                assignedAssistant: {
                  id: assistant.assistant_id,
                  name: assistant.name,
                  avatar: assistant.metadata.agent_avatar,
                },
              },
            };
          }
          return node;
        })
      );

      setIsAgentSelectOpen(false);
      setSelectedTaskForAgent(null);

      toast({
        title: "Agent assigned to task",
        description: `${assistant.name} has been assigned to this task`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error assigning agent:", error);
      toast({
        title: "Failed to assign agent",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsAgentSelectionLoading(false);
    }
  };

  // Handle task selection
  const handleTaskSelect = async (taskOption: {
    type: TaskType;
    label: string;
    description: string;
  }) => {
    if (!workflowId) {
      toast({
        title: "Cannot create task without workflow",
        variant: "destructive",
      });
      return;
    }

    // Store the task details temporarily for all task types
    setSelectedTaskForAgent("pending");
    // Store these details in state to use later
    const pendingTaskDetails = {
      name: taskOption.label,
      description: taskOption.description,
      task_type: taskOption.type,
    };
    // Store in component state for later use
    setPendingTask(pendingTaskDetails);
    // Open the agent selection modal
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
        mode={mode}
        onModeChange={setMode}
      />
      <div className="flex-1 relative min-h-0 overflow-hidden">
        {mode === "editor" ? (
          <>
            <WorkflowCanvas
              nodes={nodes}
              setNodes={setNodes}
              edges={edges}
              setEdges={setEdges}
              initialWorkflowId={workflowId}
              selectedTaskId={selectedTaskId}
              onTaskConfigClose={handleTaskConfigClose}
              activeNodeId={activeNodeId}
              setActiveNodeId={setActiveNodeId}
              onAddTask={handleAddTaskFromNode}
            />
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto">
                  <EmptyWorkflowState onAddTrigger={handleAddTrigger} />
                </div>
              </div>
            )}
            <TaskSidebar
              isOpen={isTaskSidebarOpen}
              onClose={() => {
                setIsTaskSidebarOpen(false);
              }}
              onTaskSelect={handleTaskSelect}
            />
          </>
        ) : (
          workflowId ? (
            <div className="h-full overflow-auto">
              <WorkflowExecutions workflowId={workflowId} />
            </div>
          ) : (
            <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
              Save the workflow first to view executions
            </div>
          )
        )}
      </div>
      <AgentSelectModal
        isOpen={isAgentSelectOpen}
        onClose={() => {
          setIsAgentSelectOpen(false);
          setSelectedTaskForAgent(null);
        }}
        onSelect={handleAgentSelect}
        assistants={assistants}
        loading={loadingAgents || isAgentSelectionLoading}
      />

      <TriggerSelectModal
        isOpen={isTriggerSelectOpen}
        onClose={() => setIsTriggerSelectOpen(false)}
        onCreate={handleCreateTrigger}
      />

      <TriggerConfigModal
        open={isTriggerConfigOpen}
        onOpenChange={(v) => setIsTriggerConfigOpen(v)}
        workflowId={workflowId || ""}
        triggerId={selectedTriggerId}
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
