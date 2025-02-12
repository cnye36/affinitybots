"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Workflow } from "@/types/index";

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        router.push("/auth/login");
        return;
      }
    };

    checkSession();
  }, [supabase.auth, router]);

  useEffect(() => {
    let mounted = true;

    async function fetchWorkflows() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setError("Please sign in to view workflows");
          return;
        }

        const { data: workflowsData, error: fetchError } = await supabase
          .from("workflows")
          .select("*")
          .eq("owner_id", session.user.id)
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        if (mounted) {
          setWorkflows(workflowsData || []);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          console.error("Error fetching workflows:", err);
          setError(
            err instanceof Error ? err.message : "An unexpected error occurred"
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchWorkflows();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const handleDeleteWorkflow = async (
    e: React.MouseEvent,
    workflowId: string,
    workflowName: string
  ) => {
    e.stopPropagation(); // Prevent the click from bubbling up to the parent
    const confirmDelete = window.confirm(
      `Are you absolutely sure you want to delete the workflow "${workflowName}"? ` +
        "This will permanently delete the workflow and ALL associated tasks. " +
        "This action cannot be undone."
    );

    if (confirmDelete) {
      try {
        const { error: deleteError } = await supabase
          .from("workflows")
          .delete()
          .eq("workflow_id", workflowId);

        if (deleteError) throw deleteError;

        setWorkflows(workflows.filter((w) => w.workflow_id !== workflowId));
        toast({
          title: `Workflow "${workflowName}" deleted successfully`,
        });
      } catch (error) {
        console.error("Error deleting workflow:", error);
        toast({
          title: "Failed to delete workflow",
          description:
            error instanceof Error
              ? error.message
              : "Failed to delete workflow",
        });
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
              key={workflow.workflow_id}
              onClick={() => router.push(`/workflows/${workflow.workflow_id}`)}
              className="bg-card border rounded-xl p-6 hover:shadow-lg transition-all duration-200 relative group cursor-pointer"
            >
              <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) =>
                    handleDeleteWorkflow(e, workflow.workflow_id, workflow.name)
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
