import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";

interface WorkflowHeaderProps {
  workflowName: string;
  setWorkflowName: (name: string) => void;
  onSave: () => void;
  onExecute: () => void;
  onBack: () => void;
  saving: boolean;
  executing: boolean;
  workflowId?: string;
}

export function WorkflowHeader({
  workflowName,
  setWorkflowName,
  onSave,
  onExecute,
  onBack,
  saving,
  executing,
  workflowId,
}: WorkflowHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
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
      <div className="flex gap-2">
        <Button onClick={onSave} disabled={saving}>
          {saving
            ? "Saving..."
            : workflowId
            ? "Update Workflow"
            : "Save Workflow"}
        </Button>
        <Button onClick={onExecute} disabled={executing}>
          {executing ? "Executing..." : "Execute Workflow"}
        </Button>
      </div>
    </div>
  );
}
