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
    <div className="relative overflow-hidden rounded-xl border-2 border-violet-200/50 dark:border-violet-800/50 bg-gradient-to-br from-violet-50/30 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-950/20">
      {/* Subtle animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-violet-200/50 dark:border-violet-800/30 bg-gradient-to-r from-violet-500/5 to-purple-500/5">
          <h3 className="font-semibold text-base bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
            Task Configuration
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Define how this agent task executes in your workflow
          </p>
        </div>

        <ScrollArea className="h-[600px]">
          <div className="space-y-6 p-6">
          {/* Basic Info Section */}
          <div className="space-y-4 rounded-lg border border-violet-200/30 dark:border-violet-800/30 bg-background/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-1 rounded-full bg-violet-500" />
              <h4 className="text-sm font-medium text-foreground">Basic Information</h4>
            </div>

            {/* Task Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Task Name</Label>
              <Input
                value={currentTask.name}
                onChange={(e) =>
                  setCurrentTask({ ...currentTask, name: e.target.value })
                }
                className="bg-background"
              />
            </div>

            {/* Task Description (Optional) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                Description
                <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
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
                className="bg-background resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* Prompt Configuration Section */}
          <div className="space-y-4 rounded-lg border border-violet-200/30 dark:border-violet-800/30 bg-background/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-1 rounded-full bg-violet-500" />
              <h4 className="text-sm font-medium text-foreground">Prompt Configuration</h4>
            </div>

            {/* Context Options */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Input Source</Label>
              <Select
                value={
                  ((currentTask as any)?.config?.context?.inputSource === "previous_output")
                    ? "previous_output"
                    : "prompt"
                }
                onValueChange={(value) => {
                  const inputSource = (value as "prompt" | "previous_output");
                  const thread = (inputSource === "previous_output")
                    ? { mode: "workflow" as const }
                    : { mode: "new" as const };
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
                <SelectTrigger onClick={(e) => e.stopPropagation()} className="bg-background">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="previous_output">Previous Node Output</SelectItem>
                  <SelectItem value="prompt">Custom Prompt</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose whether to use output from the previous task or define a custom prompt
              </p>
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                Prompt
                <span className="text-xs text-violet-600 dark:text-violet-400 font-normal">(Required)</span>
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
                placeholder={`Enter instructions for ${assistant?.name || "the agent"}...\n\nExample: "Analyze the data from the previous step and summarize key insights."`}
                className="min-h-[200px] bg-background resize-none font-mono text-sm"
                required
              />
            </div>
          </div>

          {/* Tool Approval Section */}
          <div className="space-y-4 rounded-lg border border-violet-200/30 dark:border-violet-800/30 bg-background/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-1 rounded-full bg-violet-500" />
              <h4 className="text-sm font-medium text-foreground">Tool Approvals</h4>
            </div>

            <div className="rounded-lg border border-violet-200/50 dark:border-violet-800/50 bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/30 dark:to-purple-950/30 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-foreground">Auto-approve tools</p>
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
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    When enabled, tools execute automatically during workflow runs. Disable only for manual testing when you want to review each tool call before execution.
                  </p>
                </div>
              </div>
            </div>
          </div>


          {/* Output Options */}
          <div className="space-y-4 rounded-lg border border-violet-200/30 dark:border-violet-800/30 bg-background/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-1 rounded-full bg-violet-500" />
              <h4 className="text-sm font-medium text-foreground">Output Options</h4>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-violet-200/50 dark:border-violet-800/50 bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/30 dark:to-purple-950/30 p-4">
              <input
                id="structured-json"
                type="checkbox"
                className="h-4 w-4 mt-0.5 rounded border-violet-300 dark:border-violet-700 text-violet-600 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
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
              <div className="flex-1">
                <Label htmlFor="structured-json" className="text-sm font-medium cursor-pointer">
                  Enable Structured JSON Output
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Force the model to output valid JSON for easier parsing and integration
                </p>
              </div>
            </div>
          </div>

          {/* Advanced Configuration */}
          <details className="group rounded-lg border border-violet-200/30 dark:border-violet-800/30 bg-background/50">
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-violet-50/50 dark:hover:bg-violet-950/20 transition-colors rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-violet-500" />
                <h4 className="text-sm font-medium text-foreground">Advanced Configuration</h4>
                <span className="text-xs text-muted-foreground">(JSON)</span>
              </div>
              <svg
                className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-4 pb-4 pt-2">
              <p className="text-xs text-muted-foreground mb-3">
                Direct access to the raw configuration JSON. Use with caution.
              </p>
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
                className="font-mono text-xs bg-background resize-none"
                rows={12}
              />
            </div>
          </details>

        </div>
      </ScrollArea>
      </div>
    </div>
  );
}
