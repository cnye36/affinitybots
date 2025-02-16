"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AgentConfigurableOptions } from "@/types/agent";

interface PromptsConfigProps {
  config: AgentConfigurableOptions;
  onChange: (field: keyof AgentConfigurableOptions, value: unknown) => void;
}

export function PromptsConfig({ config, onChange }: PromptsConfigProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="prompt_template">System Prompt</Label>
        <Textarea
          id="prompt_template"
          value={config.prompt_template}
          onChange={(e) => onChange("prompt_template", e.target.value)}
          placeholder="Enter the system prompt template for your agent..."
          className="min-h-[200px]"
        />
        <p className="text-sm text-muted-foreground">
          Define the core behavior and capabilities of your agent. This prompt
          will guide how the agent responds and operates.
        </p>
      </div>
    </div>
  );
}
