import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Task } from "@/types/workflow";
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
          

          
          {/* Output Options */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">Output Options</Label>
            <div className="text-xs text-muted-foreground">
              Enable structured JSON output to have the model produce JSON directly.
            </div>
            <div className="flex items-center gap-2">
              <input
                id="structured-json"
                type="checkbox"
                className="h-4 w-4"
                checked={Boolean((currentTask as any)?.config?.outputOptions?.structuredJson)}
                onChange={(e) =>
                  setCurrentTask({
                    ...currentTask,
                    config: {
                      ...currentTask.config,
                      outputOptions: {
                        ...((currentTask as any)?.config?.outputOptions || {}),
                        structuredJson: e.target.checked,
                      },
                    },
                  })
                }
              />
              <Label htmlFor="structured-json">Output as JSON (structured)</Label>
            </div>
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
