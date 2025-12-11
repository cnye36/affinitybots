"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Trash2, Plus } from "lucide-react";
import { createClient } from "@/supabase/client";
import { toast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import { Workflow } from "@/types/workflow";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { WorkflowCard } from "@/components/workflows/WorkflowCard";
import { TutorialLayout } from "@/components/tutorial/TutorialLayout";
import { workflowsTutorial } from "@/lib/tutorials";

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [workflowToDelete, setWorkflowToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
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
    setWorkflowToDelete({ id: workflowId, name: workflowName });
  };

  const confirmDelete = async () => {
    if (!workflowToDelete) return;

    try {
      const { error: deleteError } = await supabase
        .from("workflows")
        .delete()
        .eq("workflow_id", workflowToDelete.id);

      if (deleteError) throw deleteError;

      setWorkflows(
        workflows.filter((w) => w.workflow_id !== workflowToDelete.id)
      );
      toast({
        title: `Workflow "${workflowToDelete.name}" deleted successfully`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error deleting workflow:", error);
      toast({
        title: "Failed to delete workflow",
        description:
          error instanceof Error ? error.message : "Failed to delete workflow",
        variant: "destructive",
      });
    } finally {
      setWorkflowToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <TutorialLayout tutorials={[workflowsTutorial]}>
        <div className="container mx-auto py-6">Loading...</div>
      </TutorialLayout>
    );
  }

  if (error) {
    return (
      <TutorialLayout tutorials={[workflowsTutorial]}>
        <div className="container mx-auto py-6">
          <h1 className="text-2xl font-bold mb-4">My Workflows</h1>
          <div className="text-red-500">Error: {error}</div>
        </div>
      </TutorialLayout>
    );
  }

  return (
    <TutorialLayout tutorials={[workflowsTutorial]}>
      <AlertDialog
        open={!!workflowToDelete}
        onOpenChange={() => setWorkflowToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the workflow &quot;
              {workflowToDelete?.name}&quot; and ALL associated tasks. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Workflow
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Workflows</h1>
          <Link href="/workflows/new">
            <Button data-tutorial="create-workflow-button">Create New Workflow</Button>
          </Link>
        </div>

        {workflows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-tutorial="workflows-grid">
            {workflows.map((workflow) => (
              <div
                key={workflow.workflow_id}
                onClick={() =>
                  router.push(`/workflows/${workflow.workflow_id}`)
                }
                className="bg-card border rounded-xl p-6 hover:shadow-lg transition-all duration-200 relative group cursor-pointer"
              >
                <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) =>
                      handleDeleteWorkflow(
                        e,
                        workflow.workflow_id,
                        workflow.name
                      )
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
                <WorkflowCard workflow={workflow} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted/50 rounded-full p-4 mb-6">
              <Plus className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Create your first workflow
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Get started by creating a workflow to organize and automate your
              tasks.
            </p>
            <Link href="/workflows/new">
              <Button size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Create New Workflow
              </Button>
            </Link>
          </div>
        )}
      </div>
    </TutorialLayout>
  );
}
