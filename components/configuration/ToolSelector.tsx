"use client"

import { useState, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { ToolID, ToolsConfig } from "@/types/tools";
import {
  AVAILABLE_TOOLS,
  getDefaultToolConfig,
} from "@/lib/langchain/tools/config";

interface ToolSelectorProps {
  tools: ToolsConfig;
  onToolsChange: (tools: ToolsConfig) => void;
}

export function ToolSelector({ tools, onToolsChange }: ToolSelectorProps) {
  const [openConfigs, setOpenConfigs] = useState<Record<string, boolean>>({});

  const initializedTools = useMemo(
    () => ({
      web_search: tools.web_search ?? getDefaultToolConfig("web_search"),
      wikipedia: tools.wikipedia ?? getDefaultToolConfig("wikipedia"),
      wolfram_alpha:
        tools.wolfram_alpha ?? getDefaultToolConfig("wolfram_alpha"),
      notion: tools.notion ?? getDefaultToolConfig("notion"),
      twitter: tools.twitter ?? getDefaultToolConfig("twitter"),
      google: tools.google ?? getDefaultToolConfig("google"),
    }),
    [tools]
  );

  const toggleConfig = (toolId: string) => {
    setOpenConfigs((prev) => ({
      ...prev,
      [toolId]: !prev[toolId],
    }));
  };

  const handleToggleTool = (toolId: ToolID) => {
    const currentConfig = initializedTools[toolId];
    const toolConfig = AVAILABLE_TOOLS[toolId];

    const updatedTools: ToolsConfig = {
      ...initializedTools,
      [toolId]: {
        ...currentConfig,
        isEnabled: !currentConfig.isEnabled,
        config: !currentConfig.isEnabled ? toolConfig.defaultConfig : {},
        credentials: !currentConfig.isEnabled ? {} : currentConfig.credentials,
      },
    };
    onToolsChange(updatedTools);
  };

  const handleConfigChange = (
    toolId: ToolID,
    changes: Record<string, string>
  ) => {
    const currentConfig = initializedTools[toolId];
    if (!currentConfig?.isEnabled) return;

    const updatedTools: ToolsConfig = {
      ...initializedTools,
      [toolId]: {
        ...currentConfig,
        credentials: {
          ...currentConfig.credentials,
          ...changes,
        },
      },
    };
    onToolsChange(updatedTools);
  };

  return (
    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
      {/* Tools Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold sticky top-0 bg-background py-2">
          Available Tools
        </h3>
        <div className="space-y-2">
          {Object.entries(AVAILABLE_TOOLS).map(([id, tool]) => (
            <Collapsible
              key={id}
              open={openConfigs[id]}
              onOpenChange={() => toggleConfig(id)}
            >
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-4">
                  <tool.icon className="h-6 w-6" />
                  <div className="space-y-1">
                    <div className="font-medium">{tool.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {tool.description}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {initializedTools[id as ToolID]?.isEnabled &&
                    tool.requiredCredentials.length > 0 && (
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                    )}
                  <Switch
                    checked={initializedTools[id as ToolID]?.isEnabled ?? false}
                    onCheckedChange={() => handleToggleTool(id as ToolID)}
                  />
                </div>
              </div>
              {initializedTools[id as ToolID]?.isEnabled &&
                tool.requiredCredentials.length > 0 && (
                  <CollapsibleContent className="p-4 bg-muted/50 rounded-lg mt-2 space-y-4">
                    {tool.requiredCredentials.map((cred) => (
                      <div key={cred} className="space-y-2">
                        <Label
                          htmlFor={`${id}-${cred}`}
                          className="flex items-center space-x-1"
                        >
                          <span>
                            {cred
                              .split("_")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1)
                              )
                              .join(" ")}
                          </span>
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`${id}-${cred}`}
                          type="password"
                          value={
                            initializedTools[id as ToolID]?.credentials?.[
                              cred
                            ] ?? ""
                          }
                          onChange={(e) =>
                            handleConfigChange(id as ToolID, {
                              [cred]: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    ))}
                    {tool.optionalCredentials.map((cred) => (
                      <div key={cred} className="space-y-2">
                        <Label htmlFor={`${id}-${cred}`}>
                          {cred
                            .split("_")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")}
                        </Label>
                        <Input
                          id={`${id}-${cred}`}
                          type="text"
                          value={
                            initializedTools[id as ToolID]?.credentials?.[
                              cred
                            ] ?? ""
                          }
                          onChange={(e) =>
                            handleConfigChange(id as ToolID, {
                              [cred]: e.target.value,
                            })
                          }
                        />
                      </div>
                    ))}
                  </CollapsibleContent>
                )}
            </Collapsible>
          ))}
        </div>
      </div>
    </div>
  );
}
