"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { AgentConfigurableOptions } from "@/types/index";
import { useState } from "react";

interface KnowledgeConfigProps {
  config: AgentConfigurableOptions;
  onChange: (field: keyof AgentConfigurableOptions, value: unknown) => void;
}

export function KnowledgeConfig({ config, onChange }: KnowledgeConfigProps) {
  const [newSource, setNewSource] = useState("");

  const handleAddSource = () => {
    if (!newSource.trim()) return;

    const currentSources =
      (config.tools.knowledge_base?.config.sources as string[]) || [];
    onChange("tools", {
      ...config.tools,
      knowledge_base: {
        isEnabled: true,
        config: {
          sources: [...currentSources, newSource.trim()],
        },
      },
    });
    setNewSource("");
  };

  const handleRemoveSource = (index: number) => {
    const currentSources =
      (config.tools.knowledge_base?.config.sources as string[]) || [];
    const newSources = currentSources.filter((_, i: number) => i !== index);

    onChange("tools", {
      ...config.tools,
      knowledge_base: {
        isEnabled: newSources.length > 0,
        config: {
          sources: newSources,
        },
      },
    });
  };

  const sources =
    (config.tools.knowledge_base?.config.sources as string[]) || [];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label>Knowledge Sources</Label>
          <p className="text-sm text-muted-foreground">
            Add URLs or file paths that your agent can use as knowledge sources
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            value={newSource}
            onChange={(e) => setNewSource(e.target.value)}
            placeholder="Enter URL or file path"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddSource();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAddSource}
            disabled={!newSource.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {sources.map((source: string, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-muted rounded-md"
            >
              <span className="text-sm truncate flex-1">{source}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveSource(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
