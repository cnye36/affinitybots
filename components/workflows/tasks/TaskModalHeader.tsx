import React, { useState } from "react";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Settings2, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Task } from "@/types/workflow";
import { Agent } from "@/types/agent";
import { Badge } from "@/components/ui/badge";
import { AgentConfigModal } from "../../configuration/AgentConfigModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TaskModalHeaderProps {
  task: Task;
  agent: Agent | null;
  isLoading: boolean;
  onTest: () => Promise<void>;
  onChangeAgent: () => void;
}

export function TaskModalHeader({
  task,
  agent,
  isLoading,
  onTest,
  onChangeAgent,
}: TaskModalHeaderProps) {
  const [isAgentConfigOpen, setIsAgentConfigOpen] = useState(false);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="sr-only">
          Configure Task: {task.name}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Configure the settings and prompt for this task
        </DialogDescription>

        <div className="space-y-4">
          {/* Agent Info and Task Name */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {agent ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Agent:</span>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={agent?.agent_avatar}
                        alt={agent?.name}
                      />
                      <AvatarFallback
                        style={{
                          backgroundColor: `hsl(${
                            (agent?.name?.length || 0 * 30) % 360
                          }, 70%, 50%)`,
                        }}
                      >
                        {agent?.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{agent?.name}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setIsAgentConfigOpen(true)}
                          >
                            <Settings2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Configure Agent</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button variant="ghost" size="sm" onClick={onChangeAgent}>
                      Change
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Agent:</span>
                  <Button variant="outline" size="sm" onClick={onChangeAgent}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign Agent
                  </Button>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Task:</span>
                <span className="font-medium">{task.name}</span>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={onTest}
                disabled={isLoading || !agent}
                variant="secondary"
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Test
              </Button>
            </div>
          </div>

          {/* Agent Capabilities */}
          {agent && (
            <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/50 p-2">
              {agent?.config?.model && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Model:
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {agent.config.model}
                  </Badge>
                </div>
              )}
              {agent.config?.tools && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Tools:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(agent.config.tools).map((tool) => (
                      <Badge key={tool} variant="secondary" className="text-xs">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {agent.config?.memory?.enabled && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Memory:
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {agent.config.memory.max_entries} entries
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogHeader>

      {/* Agent Configuration Modal */}
      {agent && (
        <AgentConfigModal
          open={isAgentConfigOpen}
          onOpenChange={setIsAgentConfigOpen}
          agent={agent}
        />
      )}
    </>
  );
}
