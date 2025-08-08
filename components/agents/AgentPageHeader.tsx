"use client";

import { Agent } from "@/types/agent";
import { AgentConfigButton } from "@/components/configuration/AgentConfigButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeftIcon, Database, Brain, Wrench } from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Assistant } from "@/types/assistant";

interface AgentPageHeaderProps {
  assistant: Assistant;
}

export function AgentPageHeader({ assistant }: AgentPageHeaderProps) {
  const router = useRouter();
  // Get first letter of agent name for avatar fallback
  const avatarFallback = assistant.name.charAt(0).toUpperCase();

  const avatarUrl = assistant.metadata.agent_avatar;

  // Get configuration states
  const hasMemory = assistant.config.configurable.memory?.enabled;
  const hasKnowledge = assistant.config.configurable.knowledge_base?.isEnabled;

  // Count active tools
  const activeToolsCount = Object.values(assistant.config.configurable.tools || {}).filter(
    (tool) => (tool as { isEnabled?: boolean })?.isEnabled
  ).length;

  return (
    <div className="flex-none border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2 -ml-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Agents
        </Button>

        <div className="flex items-center gap-4 ml-8">
          <Avatar className="h-12 w-12">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={assistant.name} />
            ) : (
              <AvatarFallback
                className="bg-primary/10"
                style={{
                  backgroundColor: `hsl(${
                    (assistant.name.length * 30) % 360
                  }, 70%, 50%)`,
                }}
              >
                {avatarFallback}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{assistant.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="flex gap-2 items-center border-r pr-4 mr-4">
            {hasMemory && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="secondary" className="gap-1">
                    <Brain className="h-3 w-3" />
                    Memory
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  Agent can remember information about you
                </TooltipContent>
              </Tooltip>
            )}

            {hasKnowledge && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="secondary" className="gap-1">
                    <Database className="h-3 w-3" />
                    Knowledge
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  This agent has access to knowledge base
                </TooltipContent>
              </Tooltip>
            )}

            {activeToolsCount > 0 && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="secondary" className="gap-1">
                    <Wrench className="h-3 w-3" />
                    {activeToolsCount}{" "}
                    {activeToolsCount === 1 ? "Tool" : "Tools"}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {`${activeToolsCount} ${
                    activeToolsCount === 1 ? "tool is" : "tools are"
                  } enabled`}
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <AgentConfigButton assistant={assistant} />
        </div>
      </div>
    </div>
  );
}
