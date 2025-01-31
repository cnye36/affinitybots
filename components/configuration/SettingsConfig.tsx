"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { AgentConfigurableOptions } from "@/types/index";

interface SettingsConfigProps {
  config: AgentConfigurableOptions;
  onChange: (field: keyof AgentConfigurableOptions, value: unknown) => void;
}

export function SettingsConfig({ config, onChange }: SettingsConfigProps) {
  const handleMemoryChange = (
    field: keyof typeof config.memory,
    value: unknown
  ) => {
    onChange("memory", {
      ...config.memory,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Memory</Label>
            <p className="text-sm text-muted-foreground">
              Enable memory to let your agent remember past conversations
            </p>
          </div>
          <Switch
            checked={config.memory.enabled}
            onCheckedChange={(checked) =>
              handleMemoryChange("enabled", checked)
            }
          />
        </div>

        {config.memory.enabled && (
          <>
            <div className="space-y-2">
              <Label>Memory Window: {config.memory.max_entries} messages</Label>
              <Slider
                value={[config.memory.max_entries]}
                min={5}
                max={50}
                step={5}
                onValueChange={([value]) =>
                  handleMemoryChange("max_entries", value)
                }
              />
              <p className="text-sm text-muted-foreground">
                Number of past messages to consider
              </p>
            </div>

            <div className="space-y-2">
              <Label>
                Relevance Threshold: {config.memory.relevance_threshold}
              </Label>
              <Slider
                value={[config.memory.relevance_threshold]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={([value]) =>
                  handleMemoryChange("relevance_threshold", value)
                }
              />
              <p className="text-sm text-muted-foreground">
                Minimum relevance score for retrieving past messages
              </p>
            </div>
          </>
        )}
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-medium mb-2">Danger Zone</h3>
        <p className="text-sm text-muted-foreground mb-4">
          These actions are destructive and cannot be undone.
        </p>
        <Button variant="destructive">Delete Agent</Button>
      </div>
    </div>
  );
}
