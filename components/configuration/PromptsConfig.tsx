"use client";

import { Label } from "@/components/ui/label";
import { AssistantConfiguration } from "@/types/assistant";
import { useEffect, useRef, useState } from "react";

interface PromptsConfigProps {
  config: AssistantConfiguration;
  onChange: (field: keyof AssistantConfiguration, value: unknown) => void;
}

export function PromptsConfig({ config, onChange }: PromptsConfigProps) {
  const [draftPrompt, setDraftPrompt] = useState(config.prompt_template || "");
  const isFocusedRef = useRef(false);

  // Keep draft in sync with external updates, but never clobber while user is typing.
  useEffect(() => {
    if (isFocusedRef.current) return;
    setDraftPrompt(config.prompt_template || "");
  }, [config.prompt_template]);

  const commit = () => {
    isFocusedRef.current = false;
    const current = config.prompt_template || "";
    if (draftPrompt === current) return;
    onChange("prompt_template", draftPrompt);
  };

  // Commit when unmounting (e.g. closing panel) if the user was editing.
  useEffect(() => {
    return () => {
      if (!isFocusedRef.current) return;
      const current = config.prompt_template || "";
      if (draftPrompt === current) return;
      onChange("prompt_template", draftPrompt);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="prompt_template">System Prompt</Label>
        <textarea
          id="prompt_template"
          value={draftPrompt}
          onFocus={() => {
            isFocusedRef.current = true;
          }}
          onBlur={commit}
          onChange={(e) => setDraftPrompt(e.target.value)}
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
