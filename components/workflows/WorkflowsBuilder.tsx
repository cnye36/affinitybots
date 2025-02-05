'use client'

import { useState, useCallback, useEffect } from 'react'
import { Edge, ReactFlowProvider, Node } from "reactflow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AgentSidebar } from "./AgentSidebar";
import { WorkflowCanvas } from "./WorkflowCanvas";
import { SidebarTrigger } from "./SidebarTrigger";
import { toast, ToastContainer } from "react-toastify";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Assistant } from "@/types/index";
import { createClient } from "@/supabase/client";

interface WorkflowNode extends Node {
  data: {
    assistant_id: string;
    label: string;
    workflowId?: string;
  };
}

interface WorkflowsBuilderProps {
  initialWorkflowId?: string;
}

function WorkflowBuilder({ initialWorkflowId }: WorkflowsBuilderProps) {
  const router = useRouter();
  const [workflowName, setWorkflowName] = useState("Undefined Workflow");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loadingAssistants, setLoadingAssistants] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [workflowId, setWorkflowId] = useState<string | undefined>(
    initialWorkflowId
  );
  const [isExecuting, setIsExecuting] = useState(false);
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
        toast.error("Failed to create workflow");
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
          // Update nodes to include workflowId
          setNodes(
            workflow.nodes.map((node: WorkflowNode) => ({
              ...node,
              data: {
                ...node.data,
                workflowId,
              },
            }))
          );
          setEdges(workflow.edges);
        }
      } catch (err) {
        console.error("Error loading workflow:", err);
        toast.error("Error loading workflow");
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
        setError("Failed to load assistants.");
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
      toast.error(err.message as string);
    } else if (err instanceof Error) {
      toast.error(err.message);
    } else {
      toast.error("An unexpected error occurred");
    }
  };

  const handleSave = async () => {
    if (saving) return;

    if (!workflowName.trim()) {
      toast.error("Please enter a workflow name");
      return;
    }

    if (nodes.length === 0) {
      toast.error("Workflow must contain at least one assistant.");
      return;
    }

    const saveToast = toast.loading("Saving workflow...");
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
          toast.update(saveToast, {
            render: "Workflow updated successfully",
            type: "success",
            isLoading: false,
            autoClose: 3000,
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
          toast.update(saveToast, {
            render: "Workflow saved successfully",
            type: "success",
            isLoading: false,
            autoClose: 3000,
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

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    setIsSidebarOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  useEffect(() => {
    if (!isHovering && isSidebarOpen) {
      const timer = setTimeout(() => {
        setIsSidebarOpen(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isHovering, isSidebarOpen]);

  const handleExecuteWorkflow = async () => {
    if (!workflowId) {
      toast.error("Workflow ID is missing");
      return;
    }

    setIsExecuting(true);
    try {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Workflow executed successfully");
        // Optionally, handle executionResult
      } else {
        throw new Error(data.error || "Failed to execute workflow");
      }
    } catch (error) {
      console.error("Error executing workflow:", error);
      toast.error("Failed to execute workflow");
    } finally {
      setIsExecuting(false);
    }
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
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
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
      <div className="flex flex-1 relative">
        <ReactFlowProvider>
          <WorkflowCanvas
            nodes={nodes}
            setNodes={setNodes}
            edges={edges}
            setEdges={setEdges}
            initialWorkflowId={workflowId}
          />
        </ReactFlowProvider>
        <SidebarTrigger onHover={handleMouseEnter} />
        <AgentSidebar
          isOpen={isSidebarOpen}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          assistants={assistants}
          loading={loadingAssistants}
          error={error}
        />
      </div>
    </div>
  );
}

// Wrap the component with ReactFlowProvider
export function WorkflowsBuilder(props: WorkflowsBuilderProps) {
  return (
    <ReactFlowProvider>
      <WorkflowBuilder {...props} />
    </ReactFlowProvider>
  );
}

