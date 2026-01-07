"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";
import { AssistantConfiguration } from "@/types/assistant";
import { useRouter } from "next/navigation";

interface MemoryConfigProps {
  config: AssistantConfiguration;
  onChange: (field: keyof AssistantConfiguration, value: unknown) => void;
  assistantId?: string;
}

export function MemoryConfig({ config, onChange, assistantId }: MemoryConfigProps) {
  const router = useRouter();

  const handleMemoryToggle = (enabled: boolean) => {
    onChange("memory", {
      ...config.memory,
      enabled,
    });
  };

  const navigateToMemoryManager = () => {
    if (assistantId) {
      router.push(`/agents/${assistantId}/memories`);
    }
  };

  return (
    <div className="space-y-4 w-full overflow-hidden">
      {/* Toggle Section */}
      <div className="flex items-start justify-between gap-4 rounded-lg border border-purple-200/50 dark:border-purple-800/50 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/30 dark:to-pink-950/30 p-4">
        <div className="flex-1 space-y-1">
          <Label className="text-sm font-medium">Enable Memory</Label>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Let your agent remember information about you across conversations
          </p>
        </div>
        <Switch
          checked={config.memory?.enabled || false}
          onCheckedChange={handleMemoryToggle}
          className="data-[state=checked]:bg-purple-600"
        />
      </div>

      {/* Manage Button - Only show when enabled */}
      {config.memory?.enabled && (
        <div className="space-y-2">
          <Button
            variant="outline"
            onClick={navigateToMemoryManager}
            disabled={!assistantId}
            className="w-full justify-center gap-2 border-purple-300 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:border-purple-400 dark:hover:border-purple-600 transition-all"
          >
            <Brain className="h-4 w-4" />
            Manage Memories
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            View and edit stored information
          </p>
        </div>
      )}
    </div>
  );
}
