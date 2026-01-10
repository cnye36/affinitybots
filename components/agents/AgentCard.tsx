"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/useToast";
import { useEffect, useState } from "react";
import { mutate } from "swr";
import { Assistant } from "@/types/assistant";
import Image from "next/image";
import { OFFICIAL_MCP_SERVERS } from "@/lib/mcp/officialMcpServers";
import { getLlmLabel } from "@/lib/llm/catalog";
import { getMcpServerLogo } from "@/lib/utils/mcpServerLogo";
import { useTheme } from "next-themes";

interface AgentCardProps {
  assistant: Assistant;

  onDelete: (assistantId: string) => void;
}

export function AgentCard({ assistant, onDelete }: AgentCardProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    // Prevent navigation when clicking delete button
    if ((e.target as HTMLElement).closest(".delete-button")) {
      e.stopPropagation();
      return;
    }

    if (!assistant.assistant_id || assistant.assistant_id === "undefined") {
      console.error("Invalid agent ID");
      return;
    }

    // Ensure the ID is properly formatted before navigation
    const assistantId = encodeURIComponent(assistant.assistant_id.trim());
    router.push(`/agents/${assistantId}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/agents/${assistant.assistant_id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete agent");
      }

      await mutate("/api/agents");
      onDelete(assistant.assistant_id);
      setIsDeleteDialogOpen(false);
      toast({
        title: "Agent deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast({
        title: "Failed to delete agent",
        variant: "destructive",
      });
    }
  };

  // Get the avatar URL from the config (optional chaining for safety)
  const avatarUrl = assistant.metadata?.agent_avatar || "";
  
  const getEnabledMcpServers = (): string[] => {
    const enabled_mcp_servers: any = assistant.config?.configurable?.enabled_mcp_servers;

    if (Array.isArray(enabled_mcp_servers)) {
      return enabled_mcp_servers as string[];
    }
    
    if (
      enabled_mcp_servers &&
      typeof enabled_mcp_servers === "object"
    ) {
      return Object.entries(enabled_mcp_servers)
        .filter(([, v]) => (v as { isEnabled?: boolean })?.isEnabled)
        .map(([k]) => k);
    }
    return [];
  };
  
  const modelLabel = getLlmLabel(
    assistant.config?.configurable?.llm,
    assistant.config?.configurable?.model
  );
  
  // Load logos for enabled tools from official servers
  const [toolLogos, setToolLogos] = useState<Record<string, string>>({});
  const enabledServers = getEnabledMcpServers();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const currentTheme = (resolvedTheme || theme || "light") as "light" | "dark";
    const logos: Record<string, string> = {};
    
    enabledServers.forEach((serverName) => {
      const server = OFFICIAL_MCP_SERVERS.find((s) => s.serverName === serverName);
      if (server) {
        const logoUrl = getMcpServerLogo(server, currentTheme);
        if (logoUrl) {
          logos[serverName] = logoUrl;
        }
      }
    });
    
    setToolLogos(logos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, theme, resolvedTheme, assistant.assistant_id, enabledServers.join(",")]);
  
  return (
    <>
      <div
        className="group relative rounded-xl border border-border bg-card shadow-sm hover:shadow-2xl hover:border-violet-500/50 transition-all duration-300 cursor-pointer hover:scale-[1.02] overflow-hidden"
        onClick={handleClick}
      >
        {/* Gradient border glow on hover */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl opacity-0 group-hover:opacity-50 dark:group-hover:opacity-20 blur transition duration-300" />

        {/* Subtle shine effect on hover */}
        <div className="absolute top-0 -right-4 w-8 h-full bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent transform rotate-12 group-hover:right-full transition-all duration-700 ease-out" />

        <div className="relative p-6">
          {/* Avatar and content section */}
          <div className="flex items-start space-x-4 mb-4">
            {/* Avatar with subtle ring */}
            <div className="relative">
              <div
                className="h-14 w-14 rounded-full ring-2 ring-border group-hover:ring-primary/30 flex items-center justify-center text-sm font-semibold text-white shadow-sm transition-all duration-200"
                style={{
                  backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundColor: !avatarUrl
                    ? `hsl(${(assistant.name.length * 30) % 360}, 70%, 50%)`
                    : undefined,
                }}
              >
                {!avatarUrl && assistant.name.slice(0, 2).toUpperCase()}
              </div>
            </div>

            {/* Agent info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="text-lg font-bold truncate bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent group-hover:from-violet-700 group-hover:to-purple-700 dark:group-hover:from-violet-300 dark:group-hover:to-purple-300 transition-all duration-200">
                  {assistant.name}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[10px] font-medium whitespace-nowrap flex-shrink-0">
                  {modelLabel}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {assistant.metadata?.description || "No description provided"}
              </p>
            </div>
          </div>

          {/* Tools section */}
          <div className="flex flex-col gap-3 pt-4 border-t border-border/50">
            {/* Tools */}
            {enabledServers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Tools:</span>
                <div className="flex items-center gap-1.5">
                  {enabledServers.slice(0, 5).map((name) => {
                    const src = toolLogos[name];
                    return (
                      <div
                        key={name}
                        className="relative w-6 h-6 overflow-hidden bg-muted flex items-center justify-center text-[10px] hover:scale-110 hover:ring-primary/30 transition-all duration-200 shadow-sm"
                        title={name}
                      >
                        {src ? (
                          <Image
                            src={src}
                            alt={name}
                            width={24}
                            height={24}
                            className="object-cover"
                          />
                        ) : (
                          <span>🛠️</span>
                        )}
                      </div>
                    );
                  })}
                  {enabledServers.length > 5 && (
                    <div className="w-6 h-6 rounded-full ring-2 ring-border bg-muted text-[10px] flex items-center justify-center font-semibold text-foreground hover:scale-110 hover:ring-primary/30 transition-all duration-200">
                      +{enabledServers.length - 5}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Delete button */}
            <div className="flex justify-end pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="delete-button opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-500/10 hover:text-red-500 text-xs h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              agent and any workflows using this agent will fail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Agent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
