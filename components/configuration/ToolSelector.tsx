"use client"

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { AVAILABLE_MCP_SERVERS } from "@/lib/tools/mcpToolIndex";
import { Alert, AlertDescription } from "@/components/ui/alert";

type MCPServer = {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredCredentials: string[];
  credentials?: Record<string, string>;
};

type MCPServers = Record<string, MCPServer>;

interface ToolSelectorProps {
  enabledMCPServers: string[];
  onMCPServersChange: (servers: string[]) => void;
}

export function ToolSelector({
  enabledMCPServers = [],
  onMCPServersChange,
}: ToolSelectorProps) {
  const [openConfigs, setOpenConfigs] = useState<Record<string, boolean>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>(
    {}
  );
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const servers = AVAILABLE_MCP_SERVERS as MCPServers;

  const toggleConfig = (toolId: string) => {
    setOpenConfigs((prev) => ({
      ...prev,
      [toolId]: !prev[toolId],
    }));
  };

  const togglePasswordVisibility = (toolId: string, credentialKey: string) => {
    const key = `${toolId}-${credentialKey}`;
    setShowPasswords((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleConfigChange = (
    toolId: string,
    changes: Record<string, string>
  ) => {
    const server = servers[toolId];
    if (!server) return;

    // Update the server's credentials
    server.credentials = {
      ...server.credentials,
      ...changes,
    };
    validateToolConfig(toolId);
  };

  const handleToggleTool = (serverId: string) => {
    if (!onMCPServersChange) return;

    const isEnabled = enabledMCPServers.includes(serverId);
    const server = servers[serverId];

    if (!isEnabled && server.requiredCredentials.length > 0) {
      const isValid = validateToolConfig(serverId);
      if (!isValid) {
        setOpenConfigs((prev) => ({
          ...prev,
          [serverId]: true,
        }));
        return;
      }
    }

    const updatedServers = isEnabled
      ? enabledMCPServers.filter((id) => id !== serverId)
      : [...enabledMCPServers, serverId];

    onMCPServersChange(updatedServers);
  };

  const validateToolConfig = (serverId: string): boolean => {
    const server = servers[serverId];
    if (!server.requiredCredentials.length) return true;

    const credentials = server.credentials || {};
    const missingCredentials = server.requiredCredentials.filter(
      (cred: string) => !credentials[cred]
    );

    if (missingCredentials.length > 0) {
      setValidationErrors((prev) => ({
        ...prev,
        [serverId]: `Missing required credentials: ${missingCredentials
          .map((cred: string) =>
            cred
              .split("_")
              .map(
                (word: string) => word.charAt(0).toUpperCase() + word.slice(1)
              )
              .join(" ")
          )
          .join(", ")}`,
      }));
      return false;
    }

    setValidationErrors((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([key]) => key !== serverId)
      )
    );
    return true;
  };

  return (
    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
      <h3 className="text-lg font-semibold sticky top-0 bg-background py-2">
        Tools
      </h3>
      <div className="space-y-2">
        {Object.entries(servers).map(([id, tool]) => (
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
                {tool.requiredCredentials.length > 0 && (
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                )}
                <Switch
                  checked={enabledMCPServers.includes(id)}
                  onCheckedChange={() => handleToggleTool(id)}
                  disabled={id === "tavily"} // Tavily is always enabled
                />
              </div>
            </div>

            {tool.requiredCredentials.length > 0 && (
              <CollapsibleContent className="p-4 bg-muted/50 rounded-lg mt-2 space-y-4">
                {validationErrors[id] && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{validationErrors[id]}</AlertDescription>
                  </Alert>
                )}

                {tool.requiredCredentials.map((cred: string) => (
                  <div key={cred} className="space-y-2">
                    <Label
                      htmlFor={`${id}-${cred}`}
                      className="flex items-center space-x-1"
                    >
                      <span>
                        {cred
                          .split("_")
                          .map(
                            (word: string) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                      </span>
                      <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id={`${id}-${cred}`}
                        type={
                          showPasswords[`${id}-${cred}`] ? "text" : "password"
                        }
                        value={servers[id]?.credentials?.[cred] ?? ""}
                        onChange={(e) =>
                          handleConfigChange(id, {
                            [cred]: e.target.value,
                          })
                        }
                        required
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => togglePasswordVisibility(id, cred)}
                      >
                        {showPasswords[`${id}-${cred}`] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            )}
          </Collapsible>
        ))}
      </div>
    </div>
  );
}
