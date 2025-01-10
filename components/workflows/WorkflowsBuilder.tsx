'use client'

import { useState, useCallback, useEffect } from 'react'
import { Edge, ReactFlowProvider, Node } from "reactflow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AgentSidebar } from "./AgentSidebar";
import { WorkflowCanvas } from "./WorkflowCanvas";
import { SidebarTrigger } from "./SidebarTrigger";
import axios, { isAxiosError } from "axios";
import { toast, ToastContainer } from "react-toastify";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  description?: string;
  model_type: string;
  prompt_template: string;
  tools: string[];
  config: {
    temperature?: number;
    enableKnowledge?: boolean;
    tone?: string;
    language?: string;
    toolsConfig?: Record<string, unknown>;
  };
}

interface WorkflowsBuilderProps {
  initialWorkflowId?: string;
}

function WorkflowBuilder({ initialWorkflowId }: WorkflowsBuilderProps) {
  const router = useRouter();
  const [workflowName, setWorkflowName] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load existing workflow if ID is provided
  useEffect(() => {
    const loadWorkflow = async () => {
      if (!initialWorkflowId) return;

      setLoading(true);
      try {
        const response = await axios.get(
          `/api/workflows?id=${initialWorkflowId}`
        );
        const workflow = response.data;
        setWorkflowName(workflow.name);
        // Update nodes to include workflowId
        setNodes(
          workflow.nodes.map((node: Node) => ({
            ...node,
            data: {
              ...node.data,
              workflowId: initialWorkflowId,
            },
          }))
        );
        setEdges(workflow.edges);
      } catch (err: unknown) {
        console.error("Error loading workflow:", err);
        if (isAxiosError(err) && err.response?.status === 404) {
          toast.error("Workflow not found");
          router.push("/workflows");
          return;
        }
        if (isAxiosError(err) && err.response?.status === 401) {
          toast.error("Please sign in to continue");
          router.push("/auth/login");
          return;
        }
        toast.error("Error loading workflow");
      } finally {
        setLoading(false);
      }
    };

    loadWorkflow();
  }, [initialWorkflowId, router]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await axios.get("/api/agents");
        setAgents(response.data.agents);
      } catch (err: unknown) {
        console.error("Error fetching agents:", err);
        if (isAxiosError(err) && err.response?.status === 401) {
          toast.error("Please sign in to continue");
          router.push("/auth/login");
          return;
        }
        setError("Failed to load agents.");
      } finally {
        setLoadingAgents(false);
      }
    };

    fetchAgents();
  }, [router]);

  const handleSave = async () => {
    if (saving) return;

    if (!workflowName.trim()) {
      toast.error("Please enter a workflow name");
      return;
    }

    if (nodes.length === 0) {
      toast.error("Workflow must contain at least one agent.");
      return;
    }

    const saveToast = toast.loading("Saving workflow...");
    setSaving(true);

    try {
      const workflowData = {
        name: workflowName.trim(),
        nodes,
        edges,
      };

      if (initialWorkflowId) {
        // Update existing workflow
        const response = await axios.put("/api/workflows", {
          ...workflowData,
          id: initialWorkflowId,
        });

        if (response.data && response.data.id) {
          toast.update(saveToast, {
            render: "Workflow updated successfully",
            type: "success",
            isLoading: false,
            autoClose: 3000,
          });

          setNodes(response.data.nodes);
          setEdges(response.data.edges);
        } else {
          throw new Error("Invalid response from server");
        }
      } else {
        // Create new workflow
        const response = await axios.post("/api/workflows", workflowData);

        if (response.data && response.data.id) {
          toast.update(saveToast, {
            render: "Workflow saved successfully",
            type: "success",
            isLoading: false,
            autoClose: 3000,
          });

          // Update nodes with the new workflowId
          setNodes(
            nodes.map((node) => ({
              ...node,
              data: {
                ...node.data,
                workflowId: response.data.id,
              },
            }))
          );
          setEdges(response.data.edges);

          router.push(`/workflows/${response.data.id}`);
        } else {
          throw new Error("Invalid response from server");
        }
      }
    } catch (err: unknown) {
      console.error("Error saving workflow:", err);
      if (isAxiosError(err) && err.response?.status === 401) {
        toast.update(saveToast, {
          render: "Please sign in to save workflows",
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
        router.push("/auth/login");
        return;
      }
      toast.update(saveToast, {
        render:
          isAxiosError(err) && err.response?.data?.error
            ? err.response.data.error
            : "An error occurred while saving the workflow.",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
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
            : initialWorkflowId
            ? "Update Workflow"
            : "Save Workflow"}
        </Button>
      </div>
      <div className="flex flex-1 relative">
        <ReactFlowProvider>
          <WorkflowCanvas
            nodes={nodes}
            setNodes={setNodes}
            edges={edges}
            setEdges={setEdges}
            initialWorkflowId={initialWorkflowId}
          />
        </ReactFlowProvider>
        <SidebarTrigger onHover={handleMouseEnter} />
        <AgentSidebar
          isOpen={isSidebarOpen}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          agents={agents}
          loading={loadingAgents}
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

