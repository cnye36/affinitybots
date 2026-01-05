import React, { useState } from "react";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Settings2, UserPlus, Wrench } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Task } from "@/types/workflow";
import { Badge } from "@/components/ui/badge";
import { AgentConfigModal } from "../../configuration/AgentConfigModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Assistant } from "@/types/assistant";
import { getLlmLabel } from "@/lib/llm/catalog";

interface TaskModalHeaderProps {
  task: Task;
  assistant: Assistant | null;
  isLoading: boolean;
  onTest: () => Promise<void>;
  onChangeAssistant: () => void;
  onSave?: () => Promise<void> | void;
}

export function TaskModalHeader({
  task,
  assistant,
  isLoading,
  onTest,
  onChangeAssistant,
}: TaskModalHeaderProps) {
  const [isAgentConfigOpen, setIsAgentConfigOpen] = useState(false);
  // Compute enabled MCP servers and display their names as pills
  const enabledServerNames: string[] = (() => {
    const enabledMcp = assistant?.config?.configurable?.enabled_mcp_servers as
      | string[]
      | Record<string, { isEnabled?: boolean }>
      | undefined;
    if (Array.isArray(enabledMcp)) return enabledMcp;
    if (enabledMcp && typeof enabledMcp === "object") {
      return Object.entries(enabledMcp)
        .filter(([, v]) => (v as { isEnabled?: boolean })?.isEnabled)
        .map(([k]) => k);
    }
    return [];
  })();

  const formatToolLabel = (qualified: string) => {
    // e.g. "@exa/exa" -> "Exa"; "@supabase-community/supabase-mcp" -> "Supabase-mcp"
    const base = qualified.split('/').pop() || qualified;
    return base.charAt(0).toUpperCase() + base.slice(1);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="sr-only">
          Configure Task: {task.name}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Configure the settings and prompt for this task
        </DialogDescription>

        <div className="space-y-3 md:space-y-4">
          {/* Agent Info and Task Name */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 md:gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 lg:gap-6 min-w-0">
              {assistant ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs md:text-sm text-muted-foreground flex-shrink-0">Agent:</span>
                  <div className="flex items-center gap-1.5 md:gap-2 min-w-0 flex-1">
                    <Avatar className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0">
                      <AvatarImage
                        src={assistant?.metadata.agent_avatar}
                        alt={assistant?.name}
                      />
                      <AvatarFallback
                        style={{
                          backgroundColor: `hsl(${
                            (assistant?.name?.length || 0 * 30) % 360
                          }, 70%, 50%)`,
                        }}
                      >
                        {assistant?.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm md:text-base truncate">{assistant?.name}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0"
                            onClick={() => setIsAgentConfigOpen(true)}
                          >
                            <Settings2 className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Configure Agent</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button variant="ghost" size="sm" onClick={onChangeAssistant} className="flex-shrink-0 text-xs md:text-sm">
                      Change
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs md:text-sm text-muted-foreground">Agent:</span>
                  <Button variant="outline" size="sm" onClick={onChangeAssistant} className="text-xs md:text-sm">
                    <UserPlus className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                    Assign Agent
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs md:text-sm text-muted-foreground flex-shrink-0">Task:</span>
                <span className="font-medium text-sm md:text-base truncate">{task.name}</span>
              </div>
            </div>
            <div className="flex gap-2 md:gap-3 flex-shrink-0">
              <Button
                onClick={onTest}
                disabled={isLoading || !assistant}
                variant="secondary"
                className="gap-1.5 md:gap-2 text-xs md:text-sm"
                size="sm"
              >
                <Play className="h-3 w-3 md:h-4 md:w-4" />
                Test
              </Button>
            </div>
          </div>

          {/* Agent Capabilities */}
          {assistant && (
            <div className="flex flex-wrap items-center gap-2 md:gap-3 rounded-md border bg-muted/50 p-2">
              {(assistant?.config?.configurable?.llm || assistant?.config?.configurable?.model) && (
                <div className="flex items-center gap-1.5 md:gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Model:</span>
                  <Badge variant="secondary" className="text-[10px] md:text-xs">
                    {getLlmLabel(
                      assistant.config.configurable.llm,
                      assistant.config.configurable.model
                    )}
                  </Badge>
                </div>
              )}
              {enabledServerNames.length > 0 && (
                <div className="flex items-center gap-1.5 md:gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Tools:</span>
                  <div className="flex flex-wrap gap-1">
                    {enabledServerNames.map((serverName) => (
                      <Badge key={serverName} variant="secondary" className="gap-1 text-[10px] md:text-xs">
                        <Wrench className="h-2.5 w-2.5 md:h-3 md:w-3" />
                        {formatToolLabel(serverName)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {assistant.config?.configurable?.memory?.enabled && (
                <div className="flex items-center gap-1.5 md:gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Memory:</span>
                  <Badge variant="secondary" className="text-[10px] md:text-xs">
                    {assistant.config.configurable.memory.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogHeader>

      {/* Agent Configuration Modal */}
      {assistant && (
        <AgentConfigModal
          open={isAgentConfigOpen}
          onOpenChange={setIsAgentConfigOpen}
          assistant={assistant}
        />
      )}
    </>
  );
}
