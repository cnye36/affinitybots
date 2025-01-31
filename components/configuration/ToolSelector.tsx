"use client"

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, X } from "lucide-react";
import { ToolID, ToolConfig, ToolsConfig } from "@/types/index";

// Define available tools
const AVAILABLE_TOOLS = [
  {
    id: "web_search" as ToolID,
    name: "Web Search",
    description: "Search the web for information",
    defaultConfig: {
      maxResults: 3,
    },
  },
  {
    id: "wikipedia" as ToolID,
    name: "Wikipedia",
    description: "Search Wikipedia articles",
    defaultConfig: {
      maxResults: 2,
    },
  },
  {
    id: "wolfram_alpha" as ToolID,
    name: "Wolfram Alpha",
    description: "Perform calculations and answer queries",
    defaultConfig: {
      maxResults: 1,
    },
  },
];

interface ToolSelectorProps {
  tools: ToolsConfig;
  onToolsChange: (toolId: string, config: ToolConfig) => void;
}

export function ToolSelector({ tools, onToolsChange }: ToolSelectorProps) {
  const handleToggleTool = (toolId: ToolID) => {
    const tool = AVAILABLE_TOOLS.find((t) => t.id === toolId);
    if (!tool) return;

    const isEnabled = tools[toolId]?.isEnabled ?? false;
    onToolsChange(toolId, {
      isEnabled: !isEnabled,
      config: tools[toolId]?.config ?? tool.defaultConfig,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {AVAILABLE_TOOLS.map((tool) => (
          <div
            key={tool.id}
            className="flex items-center justify-between p-4 bg-muted rounded-lg"
          >
            <div className="space-y-1">
              <div className="font-medium">{tool.name}</div>
              <div className="text-sm text-muted-foreground">
                {tool.description}
              </div>
            </div>
            <Switch
              checked={tools[tool.id]?.isEnabled ?? false}
              onCheckedChange={() => handleToggleTool(tool.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
