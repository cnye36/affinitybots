"use client";

import { AGENT_TEMPLATES } from "@/app/(app)/agents/new/templates";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentTemplateCardProps {
  template: (typeof AGENT_TEMPLATES)[0];
  onClick: () => void;
  disabled: boolean;
}

export function AgentTemplateCard({
  template,
  onClick,
  disabled,
}: AgentTemplateCardProps) {
  return (
    <div
      className={cn(
        "gradient-border p-6 rounded-lg cursor-pointer hover:scale-[1.02] transition-transform relative",
        disabled && "opacity-50 cursor-not-allowed hover:scale-100"
      )}
      onClick={disabled ? undefined : onClick}
    >
      <div className="flex items-center space-x-4">
        <template.icon className="h-8 w-8 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">{template.name}</h3>
          <p className="text-sm text-muted-foreground">
            {template.description}
          </p>
        </div>
      </div>
      {disabled && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
    </div>
  );
}
