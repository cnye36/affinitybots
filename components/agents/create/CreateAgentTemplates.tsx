"use client";

import { AGENT_TEMPLATES } from "@/app/(app)/agents/new/templates";
import { AgentTemplateCard } from "@/components/agents/create/AgentTemplateCard";

interface CreateAgentTemplatesProps {
  onSelect: (prompt: string, template: (typeof AGENT_TEMPLATES)[0]) => void;
  isSubmitting: boolean;
}

export function CreateAgentTemplates({
  onSelect,
  isSubmitting,
}: CreateAgentTemplatesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {AGENT_TEMPLATES.map((template) => (
        <AgentTemplateCard
          key={template.id}
          template={template}
          onClick={() => onSelect(template.basePrompt, template)}
          disabled={isSubmitting}
        />
      ))}
    </div>
  );
}
