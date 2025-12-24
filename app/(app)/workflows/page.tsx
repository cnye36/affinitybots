"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Trash2, Plus, Zap, Sparkles, Network, Clock, CheckCircle2 } from "lucide-react";
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
import { motion } from "framer-motion";

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [workflowToDelete, setWorkflowToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null);
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

      // Fetch user creation date for tutorial logic
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserCreatedAt(user.created_at);
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
      <TutorialLayout tutorials={[workflowsTutorial]} userCreatedAt={userCreatedAt}>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-12">
            <div className="h-12 w-64 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg mb-3 animate-pulse" />
            <div className="h-6 w-96 bg-muted/30 rounded-lg animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="relative rounded-xl border border-border bg-card p-6 overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                <div className="h-6 w-3/4 bg-muted/30 rounded mb-4 animate-pulse" />
                <div className="h-4 w-1/2 bg-muted/20 rounded mb-6 animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-6 w-6 rounded-full bg-muted/30 animate-pulse" />
                  <div className="h-6 w-6 rounded-full bg-muted/30 animate-pulse" />
                  <div className="h-6 w-6 rounded-full bg-muted/30 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </TutorialLayout>
    );
  }

  if (error) {
    return (
      <TutorialLayout tutorials={[workflowsTutorial]} userCreatedAt={userCreatedAt}>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            My Workflows
          </h1>
          <div className="text-red-500">Error: {error}</div>
        </div>
      </TutorialLayout>
    );
  }

  return (
    <TutorialLayout tutorials={[workflowsTutorial]} userCreatedAt={userCreatedAt}>
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

      <div className="container mx-auto px-4 py-8">
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6"
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              My Workflows
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              Automate your work with intelligent agent workflows
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link href="/workflows/new" className="inline-block w-full sm:w-auto">
              <Button
                size="lg"
                className="group relative w-full sm:w-auto overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0"
                data-tutorial="create-workflow-button"
              >
                <div className="absolute top-0 -right-4 w-8 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform rotate-12 group-hover:right-full transition-all duration-700 ease-out" />

                <div className="relative flex items-center justify-center gap-2">
                  <motion.div
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Zap className="h-5 w-5" />
                  </motion.div>
                  <span className="font-semibold">Create New Workflow</span>
                  <Sparkles className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
              </Button>
            </Link>
          </motion.div>
        </div>

        {workflows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-tutorial="workflows-grid">
            {workflows.map((workflow, index) => (
              <motion.div
                key={workflow.workflow_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                onClick={() =>
                  router.push(`/workflows/${workflow.workflow_id}`)
                }
                className="group relative rounded-xl border border-border bg-card shadow-sm hover:shadow-2xl hover:border-blue-500/50 transition-all duration-300 cursor-pointer hover:scale-[1.02] overflow-hidden"
              >
                {/* Gradient glow effect on hover */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl opacity-0 group-hover:opacity-20 blur transition-all duration-300" />

                {/* Subtle shine effect */}
                <div className="absolute top-0 -right-4 w-8 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform rotate-12 group-hover:right-full transition-all duration-700 ease-out" />

                {/* Delete button */}
                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <button
                    type="button"
                    onClick={(e) =>
                      handleDeleteWorkflow(
                        e,
                        workflow.workflow_id,
                        workflow.name
                      )
                    }
                    className={`${buttonVariants({
                      variant: "ghost",
                      size: "icon",
                    })} hover:bg-red-500/10 hover:text-red-500 transition-colors duration-200`}
                    title="Delete Workflow"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="relative p-6">
                  <WorkflowCard workflow={workflow} />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="relative min-h-[600px] flex items-center justify-center py-16 px-4">
            <div className="relative max-w-4xl mx-auto text-center">
              {/* Main icon with gradient */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  duration: 0.6,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
                className="mb-8 flex justify-center"
              >
                <div className="relative bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-8 rounded-3xl border border-blue-500/20">
                  <Zap className="h-20 w-20 text-blue-600" />
                  <motion.div
                    className="absolute -top-2 -right-2 bg-blue-500/10 rounded-full p-1.5"
                    animate={{
                      rotate: [0, 10, 0, -10, 0],
                      scale: [1, 1.1, 1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Sparkles className="h-6 w-6 text-blue-600" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Heading with gradient */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent"
              >
                Create Your First Workflow
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
              >
                Build powerful automation workflows that chain multiple AI agents together to handle complex tasks automatically.
              </motion.p>

              {/* Features grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
              >
                {[
                  {
                    icon: Network,
                    title: "Chain Multiple Agents",
                    description: "Connect AI agents in sequence to handle complex workflows",
                  },
                  {
                    icon: Clock,
                    title: "Schedule Automation",
                    description: "Run workflows automatically on a schedule or via triggers",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Save Time & Effort",
                    description: "Automate repetitive tasks and focus on what matters",
                  },
                ].map((feature, index) => {
                  const IconComponent = feature.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                      className="group relative rounded-xl border border-border bg-card p-6 hover:shadow-md hover:border-blue-500/30 transition-all duration-200"
                    >
                      <div className="relative">
                        <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 mb-4 ring-1 ring-blue-500/20">
                          <IconComponent className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <Link href="/workflows/new">
                  <Button
                    size="lg"
                    className="group relative overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 text-base px-8 py-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0"
                  >
                    <div className="absolute top-0 -right-4 w-8 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform rotate-12 group-hover:right-full transition-all duration-700 ease-out" />

                    <div className="relative flex items-center gap-3">
                      <motion.div
                        whileHover={{ rotate: 180 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Zap className="h-5 w-5" />
                      </motion.div>
                      <span className="font-semibold">Create Your First Workflow</span>
                      <Sparkles className="h-5 w-5 opacity-70 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Button>
                </Link>
              </motion.div>

              {/* Subtle hint text */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="mt-8 text-sm text-muted-foreground"
              >
                Build workflows in minutes with our visual workflow builder
              </motion.p>
            </div>
          </div>
        )}
      </div>
    </TutorialLayout>
  );
}
