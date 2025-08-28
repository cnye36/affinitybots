"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Memory</Label>
            <p className="text-sm text-muted-foreground">
              Enable memory to let your agent remember information about you
            </p>
          </div>
          <Switch
            checked={config.memory?.enabled || false}
            onCheckedChange={handleMemoryToggle}
          />
        </div>

        {config.memory?.enabled && (
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={navigateToMemoryManager}
              disabled={!assistantId}
            >
              Manage Memories
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              View and manage stored information your agent has learned about
              you
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
