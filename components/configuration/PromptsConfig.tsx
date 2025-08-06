"use client";

import { Label } from "@/components/ui/label";
import { AgentConfiguration } from "@/types/agent";

interface PromptsConfigProps {
  config: AgentConfiguration;
  onChange: (field: keyof AgentConfiguration, value: unknown) => void;
}

export function PromptsConfig({ config, onChange }: PromptsConfigProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log("Textarea onChange triggered:", e.target.value);
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
          onFocus={() => console.log("Textarea focused")}
          onBlur={() => console.log("Textarea blurred")}
          onKeyDown={(e) => console.log("Key pressed:", e.key)}
          placeholder="Enter the system prompt template for your agent..."
          className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        />
        <p className="text-sm text-muted-foreground">
          Define the core behavior and capabilities of your agent. This prompt
          will guide how the agent responds and operates.
        </p>
      </div>
    </div>
  );
}
