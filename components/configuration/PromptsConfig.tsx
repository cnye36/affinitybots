"use client";

import { Label } from "@/components/ui/label";
import { AssistantConfiguration } from "@/types/assistant";

interface PromptsConfigProps {
  config: AssistantConfiguration;
  onChange: (field: keyof AssistantConfiguration, value: unknown) => void;
}

export function PromptsConfig({ config, onChange }: PromptsConfigProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange("prompt_template", e.target.value);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="prompt_template">System Prompt</Label>
        <textarea
          id="prompt_template"
          value={config.prompt_template || ""}
          onChange={handleChange}
          placeholder="Enter the system prompt template for your agent..."
          className="flex min-h-[175px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        />
        <p className="text-sm text-muted-foreground">
          Define the core behavior and capabilities of your agent. This prompt
          will guide how the agent responds and operates.
        </p>
      </div>
    </div>
  );
}
