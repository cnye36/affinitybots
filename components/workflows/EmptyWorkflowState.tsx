import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EmptyWorkflowStateProps {
  onAddTrigger: () => void;
}

export function EmptyWorkflowState({ onAddTrigger }: EmptyWorkflowStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Plus className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-semibold">Start Building Your Workflow</h3>
        <p className="text-sm text-muted-foreground max-w-[400px]">
          Begin by adding a trigger to start your workflow. This will determine
          when and how your workflow runs.
        </p>
      </div>
      <Button onClick={onAddTrigger} className="mt-2">
        Start Here
      </Button>
    </div>
  );
}
