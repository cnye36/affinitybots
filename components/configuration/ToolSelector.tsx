"use client"

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AVAILABLE_TOOLS, ToolConfig } from "@/lib/tools/config";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ToolSelectorProps {
  selectedTools: string[];
  onToolToggle: (
    toolId: string,
    enabled: boolean,
    config?: Record<string, unknown>
  ) => void;
}

type ToolConfigMap = Record<string, Record<string, string>>;

export function ToolSelector({
  selectedTools,
  onToolToggle,
}: ToolSelectorProps) {
  const [toolConfigs, setToolConfigs] = useState<ToolConfigMap>({});
  const [searchQuery, setSearchQuery] = useState("");

  const handleToolToggle = (tool: ToolConfig, enabled: boolean) => {
    if (enabled && tool.configOptions) {
      const config = tool.configOptions.reduce<Record<string, string>>(
        (acc, option) => ({
          ...acc,
          [option.name]: String(option.default || ""),
        }),
        {} as Record<string, string>
      );
      setToolConfigs((prev) => ({ ...prev, [tool.id]: config }));
    }
    onToolToggle(tool.id, enabled, toolConfigs[tool.id]);
  };

  const handleConfigChange = (
    toolId: string,
    optionName: string,
    value: string
  ) => {
    const newConfig = {
      ...toolConfigs[toolId],
      [optionName]: value,
    };
    setToolConfigs((prev) => ({
      ...prev,
      [toolId]: newConfig,
    }));
    if (selectedTools.includes(toolId)) {
      onToolToggle(toolId, true, newConfig);
    }
  };

  const filteredTools = AVAILABLE_TOOLS.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedTools = groupByCategory(filteredTools);

  return (
    <div className="space-y-4">
      <div className="sticky top-0 bg-background z-10 pb-4">
        <Input
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <ScrollArea className="h-[60vh] pr-4">
        <div className="space-y-6">
          {Object.entries(groupedTools).map(([category, tools]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-lg font-semibold capitalize sticky top-0 bg-background/95 backdrop-blur py-2">
                {category}
              </h3>
              <div className="space-y-4">
                {tools.map((tool) => (
                  <div
                    key={tool.id}
                    className={cn(
                      "flex items-start justify-between p-4 rounded-lg border transition-colors",
                      selectedTools.includes(tool.id) &&
                        "border-primary/50 bg-primary/5"
                    )}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="mt-1">
                        <tool.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={tool.id}>{tool.name}</Label>
                          {tool.isCore && (
                            <Badge variant="secondary" className="text-xs">
                              Core
                            </Badge>
                          )}
                          {tool.requiresAuth && (
                            <Badge variant="outline" className="text-xs">
                              Requires Auth
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {tool.description}
                        </p>
                        {selectedTools.includes(tool.id) &&
                          tool.configOptions && (
                            <div className="mt-4 space-y-3 border-t pt-3">
                              {tool.configOptions.map((option) => (
                                <div key={option.name} className="space-y-2">
                                  <Label
                                    htmlFor={`${tool.id}-${option.name}`}
                                    className="text-xs"
                                  >
                                    {option.description}
                                  </Label>
                                  <Input
                                    id={`${tool.id}-${option.name}`}
                                    type={option.isSecret ? "password" : "text"}
                                    placeholder={option.name}
                                    value={
                                      toolConfigs[tool.id]?.[option.name] || ""
                                    }
                                    onChange={(e) =>
                                      handleConfigChange(
                                        tool.id,
                                        option.name,
                                        e.target.value
                                      )
                                    }
                                    className="h-8"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>
                    <Switch
                      id={tool.id}
                      checked={selectedTools.includes(tool.id)}
                      onCheckedChange={(checked) =>
                        handleToolToggle(tool, checked)
                      }
                      disabled={tool.isCore} // Core tools cannot be disabled
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function groupByCategory(tools: ToolConfig[]) {
  return tools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = []
    }
    acc[tool.category].push(tool)
    return acc
  }, {} as Record<string, ToolConfig[]>)
} 