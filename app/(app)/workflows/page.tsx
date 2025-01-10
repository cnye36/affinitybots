"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Trash2, Settings } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-toastify";

interface Workflow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  nodes: Array<{
    data: {
      agentId: string;
      label: string;
    };
  }>;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchWorkflows() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setError(userError?.message || "Unauthorized");
          return;
        }

        const { data, error } = await supabase
          .from("workflows")
          .select("id, name, created_at, updated_at, nodes")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          setError(error.message);
        } else {
          setWorkflows(data || []);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchWorkflows();
  }, [supabase]);

  const handleDeleteWorkflow = async (
    workflowId: string,
    workflowName: string
  ) => {
    const confirmDelete = window.confirm(
      `Are you absolutely sure you want to delete the workflow "${workflowName}"? ` +
        "This will permanently delete the workflow and ALL associated tasks. " +
        "This action cannot be undone."
    );

    if (confirmDelete) {
      try {
        const response = await fetch(`/api/workflows?id=${workflowId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete workflow");
        }

        // Remove the workflow from the local state
        setWorkflows(workflows.filter((w) => w.id !== workflowId));

        // Show success toast
        toast.success(`Workflow "${workflowName}" deleted successfully`);
      } catch (error) {
        console.error("Error deleting workflow:", error);
        // Show error toast
        toast.error(
          error instanceof Error ? error.message : "Failed to delete workflow"
        );
      }
    }
  };

  if (isLoading) {
    return <div className="container mx-auto py-6">Loading...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-4">My Workflows</h1>
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Workflows</h1>
        <Link href="/workflows/new">
          <Button>Create New Workflow</Button>
        </Link>
      </div>

      {workflows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="bg-card border rounded-xl p-6 hover:shadow-lg transition-all duration-200 relative group"
            >
              <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  href={`/workflows/${workflow.id}`}
                  className={buttonVariants({ variant: "ghost", size: "icon" })}
                  title="Configure Workflow"
                >
                  <Settings className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    handleDeleteWorkflow(workflow.id, workflow.name)
                  }
                  className={buttonVariants({
                    variant: "ghost",
                    size: "icon",
                  })}
                  title="Delete Workflow"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-1">
                    {workflow.name}
                  </h2>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>
                      Created{" "}
                      {new Date(workflow.created_at).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>
                      Updated{" "}
                      {new Date(workflow.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex -space-x-2 overflow-hidden">
                  {workflow.nodes?.map((node, index) => (
                    <div
                      key={`${workflow.id}-agent-${index}`}
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-background"
                      style={{
                        backgroundColor: `hsl(${
                          (index * 360) / (workflow.nodes?.length || 1)
                        }, 70%, 50%)`,
                      }}
                    >
                      {/* This will be replaced with actual agent avatars */}
                      <span className="sr-only">Agent in workflow</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground">
          <p>
            No workflows found. Click &quot;Create New Workflow&quot; to get
            started.
          </p>
        </div>
      )}
    </div>
  );
}
