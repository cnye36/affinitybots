import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Task } from "@/types/workflow";
import { Assistant } from "@/types/assistant";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

                    {/* Context Options - simplified UX */}
                    <div className="space-y-2">
            <Label className="flex items-center gap-2">Source for Prompt</Label>
            <Select
              value={
                ((currentTask as any)?.config?.context?.inputSource === "previous_output")
                  ? "previous_output"
                  : "prompt"
              }
              onValueChange={(value) => {
                const inputSource = (value as "prompt" | "previous_output");
                // Selecting previous_output implies same thread; selecting prompt implies new thread
                const thread = (inputSource === "previous_output")
                  ? { mode: "workflow" as const }
                  : { mode: "new" as const };
                // Prevent click-through to dialog overlay
                setCurrentTask({
                  ...currentTask,
                  config: {
                    ...currentTask.config,
                    context: {
                      ...(currentTask as any).config?.context,
                      inputSource,
                      thread,
                    },
                  },
                });
              }}
            >
              <SelectTrigger onClick={(e) => e.stopPropagation()}>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="previous_output">Previous Node Output</SelectItem>
                <SelectItem value="prompt">Define</SelectItem>
              </SelectContent>
            </Select>
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

          {/* Tool Approval Mode */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Tool Approvals
              <span className="text-xs text-muted-foreground">Stay in control</span>
            </Label>
            <div className="rounded-lg border border-muted/40 bg-muted/20 p-3 text-xs text-muted-foreground">
              <p className="mb-2">
                Automated workflow runs require auto-approval so they never pause waiting for input. Disable auto-approve only when manually testing this task and you want to review every tool call.
              </p>
              <div className="flex items-center justify-between rounded-md bg-background/60 px-3 py-2">
                <div>
                  <p className="font-medium text-foreground">Auto-approve tools</p>
                  <p className="text-xs text-muted-foreground">When off, you&apos;ll approve each tool invocation before it runs.</p>
                </div>
                <Switch
                  checked={((currentTask as any)?.config?.toolApproval?.mode ?? "auto") !== "manual"}
                  onCheckedChange={(checked) => {
                    setCurrentTask({
                      ...currentTask,
                      config: {
                        ...currentTask.config,
                        toolApproval: {
                          ...(currentTask as any)?.config?.toolApproval,
                          mode: checked ? "auto" : "manual",
                        },
                      },
                    });
                  }}
                />
              </div>
            </div>
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
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  e.stopPropagation();
                  setCurrentTask({
                    ...currentTask,
                    config: {
                      ...currentTask.config,
                      outputOptions: {
                        ...((currentTask as any)?.config?.outputOptions || {}),
                        structuredJson: e.target.checked,
                      },
                    },
                  });
                }}
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
