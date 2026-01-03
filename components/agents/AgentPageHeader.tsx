"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeftIcon, Database, Brain, Wrench, Cpu } from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import Image from "next/image";
import { OFFICIAL_MCP_SERVERS } from "@/lib/mcp/officialMcpServers";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Assistant } from "@/types/assistant";
import { useAgentConfigPanel } from "@/contexts/AgentConfigPanelContext";
import { useAgent } from "@/hooks/useAgent";
import { getLlmLabel } from "@/lib/llm/catalog";

interface AgentPageHeaderProps {
  assistant: Assistant;
}

export function AgentPageHeader({ assistant }: AgentPageHeaderProps) {
  const router = useRouter();
  const { isOpen, togglePanel } = useAgentConfigPanel();
  const [isMobile, setIsMobile] = useState(false);

  const { assistant: liveAssistant } = useAgent(assistant.assistant_id, {
    fallbackData: assistant,
  });

  const currentAssistant = liveAssistant || assistant;

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Get first letter of agent name for avatar fallback
  const avatarFallback = currentAssistant.name.charAt(0).toUpperCase();

  const avatarUrl = currentAssistant.metadata.agent_avatar;

  // Get configuration states
  const hasMemory = currentAssistant.config.configurable.memory?.enabled;
  const hasKnowledge = currentAssistant.config.configurable.knowledge_base?.isEnabled;

  // Compute enabled MCP servers and display their names as pills
  const enabledServerNames: string[] = Array.isArray(currentAssistant.config.configurable.enabled_mcp_servers)
    ? currentAssistant.config.configurable.enabled_mcp_servers
    : currentAssistant.config.configurable.enabled_mcp_servers && typeof currentAssistant.config.configurable.enabled_mcp_servers === "object"
    ? Object.entries(currentAssistant.config.configurable.enabled_mcp_servers)
        .filter(([, v]) => (v as { isEnabled?: boolean })?.isEnabled)
        .map(([k]) => k)
    : [];

  const [toolLogos, setToolLogos] = useState<Record<string, string>>({});

  const modelLabel = getLlmLabel(
    currentAssistant.config?.configurable?.llm,
    currentAssistant.config?.configurable?.model
  );

  useEffect(() => {
    let cancelled = false;
    async function loadLogos() {
      const initial: Record<string, string> = {};
      OFFICIAL_MCP_SERVERS.forEach((s) => {
        if (enabledServerNames.includes(s.serverName) && s.logoUrl) {
          initial[s.serverName] = s.logoUrl as string;
        }
      });
      if (!cancelled && Object.keys(initial).length > 0) {
        setToolLogos(initial);
      }
    }
    loadLogos();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAssistant.assistant_id]);

  const formatToolLabel = (serverName: string) => {
    // e.g. "@exa/exa" -> "Exa"; "@supabase-community/supabase-mcp" -> "Supabase-mcp"
    const base = serverName.split('/').pop() || serverName;
    return base.charAt(0).toUpperCase() + base.slice(1);
  };

  return (
    <div className="flex-none border-b border-violet-200/30 dark:border-violet-800/30 bg-gradient-to-r from-violet-500/5 to-purple-500/5 backdrop-blur supports-[backdrop-filter]:bg-background/60" data-tutorial="agent-header">
      <div className="container flex h-20 items-center">
        <Button
          variant="ghost"
          onClick={() => router.push('/agents')}
          className="gap-2 -ml-4 hover:bg-violet-100 dark:hover:bg-violet-950/50"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Agents
        </Button>

        <div className="flex items-center gap-4 ml-8">
          {/* Avatar with gradient ring */}
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-purple-500 dark:from-violet-600 dark:to-purple-600 rounded-full blur-sm opacity-75" />
            <Avatar className="relative h-12 w-12 border-2 border-white dark:border-gray-900">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={assistant.name} />
              ) : (
                <AvatarFallback
                  className="bg-gradient-to-br from-violet-500 to-purple-500 text-white font-semibold"
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
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
              {assistant.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="flex gap-2 items-center border-r border-violet-200/30 dark:border-violet-800/30 pr-4 mr-4">
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="secondary" className="gap-1 bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200/50 dark:border-violet-800/50">
                  <Cpu className="h-3 w-3" />
                  {modelLabel}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                Active model for this agent
              </TooltipContent>
            </Tooltip>

            {hasMemory && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="secondary" className="gap-1 bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/50">
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
                  <Badge variant="secondary" className="gap-1 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/50">
                    <Database className="h-3 w-3" />
                    Knowledge
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  This agent has access to knowledge base
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Enabled tool pills */}
          {enabledServerNames.length > 0 && (
            <div className="flex flex-wrap gap-2 mr-4">
              {enabledServerNames.map((serverName) => (
                <Badge key={serverName} variant="secondary" className="gap-1 bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/50">
                  {toolLogos[serverName] ? (
                    <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-sm overflow-hidden bg-background">
                      <Image
                        src={toolLogos[serverName]}
                        alt={serverName}
                        width={14}
                        height={14}
                        className="object-contain"
                      />
                    </span>
                  ) : (
                    <Wrench className="h-3 w-3" />
                  )}
                  {formatToolLabel(serverName)}
                </Badge>
              ))}
            </div>
          )}

          {/* Config toggle now lives in the chat header/sidebar, so we keep this area clean */}
        </div>
      </div>
    </div>
  );
}
