import React, { useCallback, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import logger from "@/lib/logger";
import { Task } from "@/types/workflow";
import { Agent } from "@/types/agent";
import { toast } from "@/hooks/use-toast";

interface TaskConfigurationPanelProps {
  currentTask: Task;
  setCurrentTask: (task: Task) => void;
  agent: Agent | null;
}

export function TaskConfigurationPanel({
  currentTask,
  setCurrentTask,
  agent,
}: TaskConfigurationPanelProps) {
  // Debounced save function
  const debouncedSave = useCallback(async (task: Task) => {
    try {
      const response = await fetch(
        `/api/workflows/${task.workflow_id}/tasks/${task.workflow_task_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(task),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update task");
      }
    } catch (error) {
      logger.error("Error saving task:", error);
      toast({
        title: "Failed to save changes",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, []);

  // Save changes when task is updated
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedSave(currentTask);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [currentTask, debouncedSave]);

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-medium mb-4">Configuration</h3>
      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {/* Task Name */}
          <div className="space-y-2">
            <Label>Task Name</Label>
            <Input
              value={currentTask.name}
              onChange={(e) =>
                setCurrentTask({ ...currentTask, name: e.target.value })
              }
            />
          </div>

          {/* Task Description (Optional) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Description
              <span className="text-xs text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              value={currentTask.description || ""}
              onChange={(e) =>
                setCurrentTask({
                  ...currentTask,
                  description: e.target.value,
                })
              }
              placeholder="Add a description to help identify this task's purpose"
            />
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Prompt
              <span className="text-xs text-muted-foreground">(Required)</span>
            </Label>
            <Textarea
              value={currentTask.config?.input?.prompt || ""}
              onChange={(e) => {
                setCurrentTask({
                  ...currentTask,
                  config: {
                    ...currentTask.config,
                    input: {
                      ...currentTask.config.input,
                      prompt: e.target.value,
                    },
                  },
                });
              }}
              placeholder={`Enter your prompt for ${
                agent?.name || "the agent"
              }...`}
              className="min-h-[200px]"
              required
            />
          </div>

          {/* Advanced Configuration */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Advanced Configuration
              <span className="text-xs text-muted-foreground">(JSON)</span>
            </Label>
            <Textarea
              value={JSON.stringify(currentTask.config, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setCurrentTask({
                    ...currentTask,
                    config: parsed,
                  });
                } catch {
                  // Allow invalid JSON while typing
                }
              }}
              className="font-mono"
              rows={10}
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
