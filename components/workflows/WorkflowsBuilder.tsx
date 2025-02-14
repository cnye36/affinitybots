'use client'

import { useState, useEffect } from "react";
import { Edge, ReactFlowProvider, Node } from "reactflow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkflowCanvas } from "./WorkflowCanvas";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Assistant, Task } from "@/types/index";
import { createClient } from "@/supabase/client";
import { TaskModal } from "./TaskModal";
import { EmptyWorkflowState } from "./EmptyWorkflowState";
import { AgentSelectModal } from "./AgentSelectModal";

interface WorkflowNode extends Node {
  type: "agent" | "task";
  data: {
    assistant_id?: string;
    label: string;
    workflowId?: string;
    type?: string;
    task_id?: string;
    onAddTask?: (agentId: string) => void;
    isFirstAgent?: boolean;
    hasTask?: boolean;
    onAddAgent?: (sourceAgentId: string) => void;
  };
}

interface WorkflowsBuilderProps {
  initialWorkflowId?: string;
}

function WorkflowBuilder({ initialWorkflowId }: WorkflowsBuilderProps) {
  const router = useRouter();
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
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isAgentSelectOpen, setIsAgentSelectOpen] = useState(false);
  const supabase = createClient();

  // Create a new workflow immediately if we don't have an ID
  useEffect(() => {
    const createWorkflow = async () => {
      if (workflowId) return; // Skip if we already have a workflow ID

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/auth/login");
          return;
        }

        const { data, error } = await supabase
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

        setWorkflowId(data.workflow_id);
        router.push(`/workflows/${data.workflow_id}`);
      } catch (err) {
        console.error("Error creating workflow:", err);
        toast({
          title: "Failed to create workflow",
          variant: "destructive",
        });
      }
    };

    createWorkflow();
  }, [supabase, router, workflowId, workflowName]);

  // Load existing workflow if ID is provided
  useEffect(() => {
    const loadWorkflow = async () => {
      if (!workflowId) return;

      setLoading(true);
      try {
        const { data: workflow, error: fetchError } = await supabase
          .from("workflows")
          .select("*")
          .eq("workflow_id", workflowId)
          .single();

        if (fetchError) throw fetchError;

        if (workflow) {
          setWorkflowName(workflow.name);
          // Update nodes to include workflowId and onAddTask handler
          setNodes(
            workflow.nodes.map((node: WorkflowNode) => ({
              ...node,
              data: {
                ...node.data,
                workflowId,
                onAddTask: handleAddTask,
              },
            }))
          );
          setEdges(workflow.edges);
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
      }
    };

    loadWorkflow();
  }, [workflowId, router, supabase]);

  useEffect(() => {
    const fetchAssistants = async () => {
      try {
        setLoadingAssistants(true);
        const response = await fetch("/api/assistants");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setAssistants(data);
      } catch (err) {
        console.error("Error fetching assistants:", err);
        toast({
          title: "Failed to load assistants.",
          variant: "destructive",
        });
      } finally {
        setLoadingAssistants(false);
      }
    };

    fetchAssistants();
  }, []);

  const handleError = (err: unknown) => {
    console.error("Error:", err);
    if (err && typeof err === "object" && "code" in err && "message" in err) {
      // This is likely a Postgrest error
      toast({
        title: err.message as string,
        variant: "destructive",
      });
    } else if (err instanceof Error) {
      toast({
        title: err.message,
        variant: "destructive",
      });
    }
  };

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
        // Update existing workflow
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
              },
            }))
          );
          setEdges(data[0].edges);
        } else {
          throw new Error("No data returned from update");
        }
      } else {
        // Create new workflow
        const { data, error } = await supabase
          .from("workflows")
          .insert(workflowData)
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          toast({
            title: "Workflow saved successfully",
            variant: "default",
          });

          const newWorkflowId = data[0].workflow_id;

          // Update nodes with the new workflowId
          setNodes(
            data[0].nodes.map((node: WorkflowNode) => ({
              ...node,
              data: {
                ...node.data,
                workflowId: newWorkflowId,
              },
            }))
          );
          setEdges(data[0].edges);

          router.push(`/workflows/${newWorkflowId}`);
        } else {
          throw new Error("No data returned from insert");
        }
      }
    } catch (err) {
      handleError(err);
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
    try {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Workflow executed successfully",
          variant: "default",
        });
        // Optionally, handle executionResult
      } else {
        throw new Error(data.error || "Failed to execute workflow");
      }
    } catch (error) {
      console.error("Error executing workflow:", error);
      toast({
        title: "Failed to execute workflow",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleAddTask = (agentId: string) => {
    setSelectedAgentId(agentId);
    setIsTaskModalOpen(true);
  };

  const handleAddNextAgent = (sourceAgentId: string) => {
    setSelectedAgentId(sourceAgentId);
    setIsAgentSelectOpen(true);
  };

  const handleAgentSelect = async (assistant: Assistant) => {
    if (!workflowId) {
      toast({
        title: "Please save the workflow first",
        description: "You need to save the workflow before adding an agent",
        variant: "destructive",
      });
      return;
    }

    // Find source node if we're adding from an existing agent
    const sourceNode = selectedAgentId
      ? nodes.find((node) => node.data.assistant_id === selectedAgentId)
      : null;

    // Calculate position based on source node or default to center
    const position = sourceNode
      ? { x: sourceNode.position.x, y: sourceNode.position.y + 300 }
      : { x: 400, y: 200 };

    // Create new agent node
    const newNode: WorkflowNode = {
      id: `agent-${assistant.assistant_id}`,
      type: "agent",
      position,
      data: {
        label: assistant.name,
        assistant_id: assistant.assistant_id,
        workflowId,
        onAddTask: handleAddTask,
        onAddAgent: handleAddNextAgent,
        isFirstAgent: !selectedAgentId,
        hasTask: false,
      },
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

    setNodes((nds) => [...nds, newNode]);
    setIsAgentSelectOpen(false);
    setSelectedAgentId(null);
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (!workflowId || !selectedAgentId) {
      toast({
        title: "Cannot create task without workflow or agent",
        variant: "destructive",
      });
      return;
    }

    try {
      const taskPayload = {
        assistant_id: selectedAgentId,
        workflow_id: workflowId,
        ...taskData,
      };
      console.log("Task payload:", taskPayload);

      const response = await fetch(`/api/workflows/${workflowId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error response:", errorData);
        throw new Error(errorData.error || "Failed to create task");
      }
      const newTask = await response.json();

      // Find source node and update its hasTask flag
      const sourceNode = nodes.find(
        (node) => node.data.assistant_id === selectedAgentId
      );

      if (!sourceNode) return;

      const position = {
        x: sourceNode.position.x + 300,
        y: sourceNode.position.y,
      };

      // Create new task node
      const newTaskNode: WorkflowNode = {
        id: `task-${newTask.task_id}`,
        type: "task",
        position,
        data: {
          ...newTask,
          label: newTask.name,
          workflowId,
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
          node.id === sourceNode.id
            ? { ...node, data: { ...node.data, hasTask: true } }
            : node
        )
      );

      setNodes((nds) => [...nds, newTaskNode]);
      setEdges((eds) => [...eds, newEdge]);
      setIsTaskModalOpen(false);
    } catch (err) {
      console.error("Error saving task:", err);
      toast({
        title: "Failed to save task",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleAddFirstAgent = () => {
    setIsAgentSelectOpen(true);
  };

  const getWorkflowState = () => {
    if (nodes.length === 0) return "empty";
    return "add-agent";
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
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/workflows")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Workflows
          </Button>
          <Input
            placeholder="Enter workflow name"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving
              ? "Saving..."
              : workflowId
              ? "Update Workflow"
              : "Save Workflow"}
          </Button>
          <Button onClick={handleExecuteWorkflow} disabled={isExecuting}>
            {isExecuting ? "Executing..." : "Execute Workflow"}
          </Button>
        </div>
      </div>
      <div className="flex flex-1 relative">
        <ReactFlowProvider>
          <WorkflowCanvas
            nodes={nodes}
            setNodes={setNodes}
            edges={edges}
            setEdges={setEdges}
            initialWorkflowId={workflowId}
          />
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="pointer-events-auto">
                <EmptyWorkflowState
                  type={getWorkflowState()}
                  onAddFirstAgent={handleAddFirstAgent}
                />
              </div>
            </div>
          )}
        </ReactFlowProvider>
      </div>
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedAgentId(null);
        }}
        onSave={handleSaveTask}
        assistant_id={selectedAgentId || ""}
        workflow_id={workflowId || ""}
      />
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

