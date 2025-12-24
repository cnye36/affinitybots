"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Network } from "lucide-react";

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

export function WorkflowCard({ workflow }: WorkflowCardProps) {
  const nodes: any[] = Array.isArray(workflow?.nodes) ? (workflow.nodes as any[]) : [];

  // Count task nodes (fallback to total nodes if type not present)
  const taskNodes = nodes.filter((n) => (n?.type ?? "task") === "task");
  const nodeCount = (taskNodes.length || nodes.length || 0) as number;

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

  return (
    <div className="space-y-5">
      {/* Workflow name with gradient on hover */}
      <div>
        <h2 className="text-xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-cyan-700 dark:group-hover:from-blue-300 dark:group-hover:to-cyan-300 transition-all duration-200">
          {workflow?.name || "Untitled Workflow"}
        </h2>

        {/* Metadata with icons */}
        <div className="flex flex-col gap-2.5">
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

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Network className="h-4 w-4 text-cyan-600/70" />
            <span className="font-medium">{nodeCount} {nodeCount === 1 ? "node" : "nodes"}</span>
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


