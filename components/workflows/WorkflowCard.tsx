"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Network, GitBranch, GitMerge, Calendar, MousePointerClick, Webhook, AlarmClock, Plug, FormInput } from "lucide-react";

interface WorkflowCardProps {
  workflow: any;
}

function formatDateTime(dt?: string | null): string {
  if (!dt) return "Never";
  try {
    const d = new Date(dt);
    if (isNaN(d.getTime())) return "Never";
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return "Never";
  }
}

function getTriggerIcon(type: string) {
  switch (type) {
    case "manual":
      return MousePointerClick;
    case "webhook":
      return Webhook;
    case "schedule":
      return AlarmClock;
    case "integration":
      return Plug;
    case "form":
      return FormInput;
    default:
      return MousePointerClick;
  }
}

function getTriggerLabel(type: string): string {
  switch (type) {
    case "manual":
      return "Manual";
    case "webhook":
      return "Webhook";
    case "schedule":
      return "Schedule";
    case "integration":
      return "Integration";
    case "form":
      return "Form";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

export function WorkflowCard({ workflow }: WorkflowCardProps) {
  const nodes: any[] = Array.isArray(workflow?.nodes) ? (workflow.nodes as any[]) : [];

  // Count task nodes (fallback to total nodes if type not present)
  const taskNodes = nodes.filter((n) => (n?.type ?? "task") === "task");
  const nodeCount = (taskNodes.length || nodes.length || 0) as number;

  // Get triggers
  const triggers: any[] = Array.isArray(workflow?.workflow_triggers) ? workflow.workflow_triggers : [];
  const primaryTrigger = triggers.length > 0 ? triggers[0] : null;

  // Collect unique assistants from node data
  const assistants: { id?: string; name?: string; avatar?: string }[] = [];
  const seen = new Set<string>();
  (taskNodes.length ? taskNodes : nodes).forEach((n) => {
    const data = n?.data || {};
    const a = data.assignedAssistant || data.assigned_assistant || data?.config?.assigned_assistant;
    if (a) {
      const key = a.id || a.name || JSON.stringify(a);
      if (key && !seen.has(key)) {
        seen.add(key);
        assistants.push({ id: a.id, name: a.name, avatar: a.avatar });
      }
    }
  });

  const displayAssistants = assistants.slice(0, 6);
  const overflow = assistants.length - displayAssistants.length;

  // Check if workflow was run recently (within last 24 hours)
  const isRecentlyRun = workflow?.last_run_at &&
    new Date().getTime() - new Date(workflow.last_run_at).getTime() < 24 * 60 * 60 * 1000;

  // Check if workflow is active
  const isActive = workflow?.is_active === true;

  // Determine workflow type (defaults to sequential)
  const workflowType = workflow?.workflow_type || "sequential";
  const isOrchestrator = workflowType === "orchestrator";

  return (
    <div className="space-y-5">
      {/* Workflow name with gradient on hover */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-cyan-700 dark:group-hover:from-blue-300 dark:group-hover:to-cyan-300 transition-all duration-200">
              {workflow?.name || "Untitled Workflow"}
            </h2>
            {/* Active indicator */}
            {isActive && (
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
            )}
          </div>
          {/* Workflow type badge */}
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
            isOrchestrator
              ? "bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20"
              : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"
          }`}>
            {isOrchestrator ? (
              <>
                <GitMerge className="h-3 w-3" />
                <span>Orchestrator</span>
              </>
            ) : (
              <>
                <GitBranch className="h-3 w-3" />
                <span>Sequential</span>
              </>
            )}
          </div>
        </div>

        {/* Metadata with icons */}
        <div className="flex flex-col gap-2.5">
          {/* Active status */}
          {isActive && (
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">Active</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-purple-600/70" />
            <span className="font-medium">Created:</span>
            <span>{formatDateTime(workflow?.created_at)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 text-blue-600/70" />
            <span className="font-medium">Last run:</span>
            <span className={isRecentlyRun ? "text-emerald-600 font-medium" : ""}>
              {formatDateTime(workflow?.last_run_at)}
            </span>
            {isRecentlyRun && (
              <div className="ml-1 h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {/* Trigger info */}
            {primaryTrigger && (() => {
              const TriggerIcon = getTriggerIcon(primaryTrigger.trigger_type);
              const triggerLabel = getTriggerLabel(primaryTrigger.trigger_type);
              return (
                <div className="flex items-center gap-2">
                  <TriggerIcon className="h-4 w-4 text-amber-600/70" />
                  <span className="font-medium">{triggerLabel}</span>
                  {triggers.length > 1 && (
                    <span className="text-xs text-muted-foreground/70">+{triggers.length - 1}</span>
                  )}
                </div>
              );
            })()}

            {/* Agent count */}
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-cyan-600/70" />
              <span className="font-medium">{nodeCount} {nodeCount === 1 ? "agent" : "agents"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Agent avatars with enhanced styling */}
      {displayAssistants.length > 0 && (
        <div className="pt-4 border-t border-border/50">
          <div className="text-xs text-muted-foreground font-medium mb-2.5">Agents</div>
          <div className="flex items-center gap-1.5">
            {displayAssistants.map((a, idx) => (
              <Avatar
                key={(a.id || a.name || idx) as string}
                className="h-8 w-8 ring-2 ring-border group-hover:ring-blue-500/30 transition-all duration-200 hover:scale-110 shadow-sm"
              >
                {a.avatar ? (
                  <AvatarImage src={a.avatar} alt={a.name || "Agent"} />
                ) : (
                  <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-700">
                    {(a.name || "AG").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
            ))}
            {overflow > 0 && (
              <div className="h-8 px-2 rounded-full border border-border bg-gradient-to-br from-blue-500/5 to-cyan-500/5 text-xs font-semibold flex items-center justify-center text-blue-700 ring-2 ring-border group-hover:ring-blue-500/30 transition-all duration-200">
                +{overflow}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


