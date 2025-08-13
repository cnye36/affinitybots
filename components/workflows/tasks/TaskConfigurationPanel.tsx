import React, { useCallback, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Task } from "@/types/workflow";
import { toast } from "@/hooks/use-toast";
import { Assistant } from "@/types/assistant";

interface TaskConfigurationPanelProps {
  currentTask: Task;
  setCurrentTask: (task: Task) => void;
  assistant: Assistant | null;
}

export function TaskConfigurationPanel({
  currentTask,
  setCurrentTask,
  assistant,
}: TaskConfigurationPanelProps) {
  // Track the current in-flight save so we can cancel if a newer change happens
  const saveAbortControllerRef = useRef<AbortController | null>(null);

  // Debounced save function with retry and minimal payload
  const debouncedSave = useCallback(async (task: Task) => {
    // Build minimal payload to avoid sending large objects
    const payload = {
      name: task.name,
      description: task.description,
      task_type: task.task_type,
      config: task.config,
      assignedAssistant: task.assignedAssistant,
      integration: task.integration,
    };

    // Abort any previous in-flight request
    if (saveAbortControllerRef.current) {
      saveAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    saveAbortControllerRef.current = controller;

    const url = `/api/workflows/${task.workflow_id}/tasks/${task.workflow_task_id}`;

    const saveWithRetry = async (attempt: number): Promise<void> => {
      try {
        const response = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok) {
          // Try to extract an error message if possible, but still retry on 5xx
          let message = "Failed to update task";
          try {
            const errJson = await response.json();
            if (errJson?.error || errJson?.message) {
              message = errJson.error || errJson.message;
            }
          } catch {}

          // Retry for 5xx responses
          if (response.status >= 500 && attempt < 3) {
            await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt)));
            return saveWithRetry(attempt + 1);
          }
          throw new Error(message);
        }
      } catch (error) {
        // If aborted due to a newer save, silently exit
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        // Network errors (e.g., dev server recompiling) — retry a few times
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt)));
          return saveWithRetry(attempt + 1);
        }
        console.error("Error saving task:", error);
        toast({
          title: "Failed to save changes",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      }
    };

    await saveWithRetry(0);
  }, [toast]);

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
                assistant?.name || "the agent"
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
