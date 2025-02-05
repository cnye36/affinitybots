import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Task, TaskType } from "@/types";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => Promise<void>;
  agentId: string;
  workflowId: string;
  initialTask?: Task;
}

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: "process_input", label: "Process Input" },
  { value: "generate_content", label: "Generate Content" },
  { value: "analyze_data", label: "Analyze Data" },
  { value: "make_decision", label: "Make Decision" },
  { value: "transform_data", label: "Transform Data" },
  { value: "api_call", label: "API Call" },
  { value: "custom", label: "Custom" },
];

export function TaskModal({
  isOpen,
  onClose,
  onSave,
  agentId,
  workflowId,
  initialTask,
}: TaskModalProps) {
  const [name, setName] = useState(initialTask?.name || "");
  const [description, setDescription] = useState(
    initialTask?.description || ""
  );
  const [type, setType] = useState<TaskType>(
    initialTask?.type || "process_input"
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await onSave({
        name,
        description,
        type,
        agentId,
        workflowId,
        config: initialTask?.config || {
          input: {
            source: "previous_agent",
          },
          output: {
            destination: "next_agent",
          },
        },
      });
      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleExecuteTask = async () => {
    if (!initialTask?.task_id) {
      toast.error("Task ID is missing");
      return;
    }

    try {
      const response = await fetch(
        `/api/workflows/${workflowId}/tasks/${initialTask.task_id}/execute`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Task executed successfully");
        console.log("Execution Result:", data.executionResult);
        // Optionally, display the result in the UI
      } else {
        throw new Error(data.error || "Failed to execute task");
      }
    } catch (error) {
      console.error("Error executing task:", error);
      toast.error("Failed to execute task");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialTask ? "Edit Task" : "Add New Task"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Task Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter task name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Task Type</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as TaskType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select task type" />
              </SelectTrigger>
              <SelectContent>
                {TASK_TYPES.map((taskType) => (
                  <SelectItem key={taskType.value} value={taskType.value}>
                    {taskType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Task"}
            </Button>
            {initialTask && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleExecuteTask}
              >
                Execute Task
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
