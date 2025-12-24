"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Brain } from "lucide-react";

// Model options for orchestrator
const MODEL_OPTIONS = [
  { value: "openai:gpt-5", label: "GPT-5" },
  { value: "openai:gpt-4.1", label: "GPT-4.1 Turbo" },
  { value: "anthropic:claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet" },
  { value: "anthropic:claude-opus-4-5-20251101", label: "Claude Opus 4.5" },
  { value: "google:gemini-2-flash", label: "Gemini 2.0 Flash" },
];

interface OrchestratorConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string;
  initialConfig?: {
    system_prompt: string;
    user_prompt: string;
    model: string;
  };
  onSave: (config: any) => void;
}

export function OrchestratorConfigModal({
  open,
  onOpenChange,
  workflowId,
  initialConfig,
  onSave,
}: OrchestratorConfigModalProps) {
  const defaultSystemPrompt = `You are a manager agent coordinating a team of AI assistants.

Your job is to:
1. Analyze the user's request
2. Break it down into sub-tasks
3. Delegate each sub-task to the appropriate agent
4. Review agent outputs and decide next steps
5. Signal completion when the goal is achieved

Available agents and their capabilities will be provided below.

Respond with JSON only:
- To delegate: {"agent": "Agent Name", "instruction": "what to do"}
- To complete: {"complete": true, "final_result": "summary"}`;

  const [systemPrompt, setSystemPrompt] = useState(
    initialConfig?.system_prompt || defaultSystemPrompt
  );

  const [userPrompt, setUserPrompt] = useState(
    initialConfig?.user_prompt || ""
  );

  const [model, setModel] = useState(
    initialConfig?.model || "openai:gpt-5"
  );

  // Update state when initialConfig changes
  useEffect(() => {
    if (initialConfig) {
      setSystemPrompt(initialConfig.system_prompt || defaultSystemPrompt);
      setUserPrompt(initialConfig.user_prompt || "");
      setModel(initialConfig.model || "openai:gpt-5");
    }
  }, [initialConfig]);

  const handleSave = () => {
    onSave({
      manager: {
        system_prompt: systemPrompt,
        user_prompt: userPrompt,
        model: model,
      },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <DialogTitle className="text-xl">Configure Orchestrator</DialogTitle>
          </div>
          <DialogDescription>
            Set up the manager agent that will coordinate sub-agents in this workflow
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Model Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Model</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Choose the AI model for the orchestrator agent
            </p>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODEL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">System Prompt</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Instructions for how the orchestrator should coordinate agents
            </p>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={10}
              placeholder="You are a manager agent..."
              className="font-mono text-sm"
            />
          </div>

          {/* User Prompt / Goal */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">User Prompt / Goal</Label>
            <p className="text-xs text-muted-foreground mb-2">
              The overall task or goal you want to accomplish
            </p>
            <Textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={4}
              placeholder="Research market trends and write a comprehensive report..."
              className="text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white"
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
