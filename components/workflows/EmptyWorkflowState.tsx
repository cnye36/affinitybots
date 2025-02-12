import { Plus } from "lucide-react";

interface EmptyWorkflowStateProps {
  onAddFirstAgent: () => void;
  onAddFirstTask?: () => void;
  type: "empty" | "add-first-task" | "add-agent";
}

export function EmptyWorkflowState({
  onAddFirstAgent,
  onAddFirstTask,
  type,
}: EmptyWorkflowStateProps) {
  return (
    <div className="bg-background/50 backdrop-blur-sm rounded-lg p-6 shadow-lg border">
      {type === "empty" && (
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/50 flex items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
            onClick={onAddFirstAgent}
          >
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <span className="text-lg text-muted-foreground">Add First Agent</span>
        </div>
      )}

      {type === "add-first-task" && onAddFirstTask && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/50 flex items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
              onClick={onAddFirstTask}
            >
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <span className="text-lg text-muted-foreground">Add First Task</span>
          <p className="text-sm text-muted-foreground/70 text-center max-w-sm">
            Add a task to define what this agent should do
          </p>
        </div>
      )}

      {type === "add-agent" && (
        <div className="flex flex-col items-center gap-4">
          <span className="text-lg text-muted-foreground">Add Agent</span>
        </div>
      )}
    </div>
  );
}
