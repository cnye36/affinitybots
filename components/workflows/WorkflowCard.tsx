"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-1">{workflow?.name || "Untitled Workflow"}</h2>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span>Last run: {formatDateTime(workflow?.last_run_at)}</span>
          <span>•</span>
          <span>{nodeCount} {nodeCount === 1 ? "node" : "nodes"}</span>
        </div>
      </div>

      {displayAssistants.length > 0 && (
        <div className="flex items-center gap-1">
          {displayAssistants.map((a, idx) => (
            <Avatar key={(a.id || a.name || idx) as string} className="h-6 w-6 ring-2 ring-background">
              {a.avatar ? (
                <AvatarImage src={a.avatar} alt={a.name || "Agent"} />
              ) : (
                <AvatarFallback className="text-[10px]">
                  {(a.name || "AG").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
          ))}
          {overflow > 0 && (
            <div className="h-6 px-1 rounded-full border text-[10px] flex items-center justify-center bg-muted/50">
              +{overflow}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


