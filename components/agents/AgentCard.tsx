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
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { mutate } from "swr";
import { Assistant } from "@/types/assistant";
import Image from "next/image";
import { OFFICIAL_MCP_SERVERS } from "@/lib/mcp/officialMcpServers";

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
      const response = await fetch(`/api/assistants/${assistant.assistant_id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete agent");
      }

      await mutate("/api/assistants");
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
  
  const formatModelName = (modelId?: string): string => {
    if (!modelId) return "Not specified";
    let cleaned = modelId.trim();
    // Drop common date/version suffixes
    cleaned = cleaned.replace(/-\d{4}-\d{2}-\d{2}$/i, ""); // -YYYY-MM-DD
    cleaned = cleaned.replace(/-\d{8}$/i, ""); // -YYYYMMDD

    // Explicit known mappings / prefixes
    if (/^gpt-5/i.test(cleaned)) return "GPT 5";
    if (/^gpt-4o/i.test(cleaned)) return "GPT 4o";
    if (/^o3-mini/i.test(cleaned)) return "O3 Mini";
    if (/^gemini-2\.5-pro/i.test(cleaned)) return "Gemini 2.5 Pro";
    if (/^gemini-1\.5-pro/i.test(cleaned)) return "Gemini 1.5 Pro";
    if (/^claude-3-7-sonnet/i.test(cleaned)) return "Claude 3.7 Sonnet";
    if (/^claude-3-5-sonnet/i.test(cleaned)) return "Claude 3.5 Sonnet";

    // Generic fallback: title-case tokens and known words
    const tokenMap: Record<string, string> = {
      gpt: "GPT",
      gemini: "Gemini",
      claude: "Claude",
      sonnet: "Sonnet",
      opus: "Opus",
      haiku: "Haiku",
      pro: "Pro",
      mini: "Mini",
      flash: "Flash",
      turbo: "Turbo",
    };
    const tokens = cleaned.split("-");
    const pretty = tokens
      .filter(Boolean)
      .map((t) => tokenMap[t.toLowerCase()] || (t.match(/^[a-z]/) ? t[0].toUpperCase() + t.slice(1) : t))
      .join(" ");
    return pretty;
  };
  
  // Load logos for enabled tools (official mapping first, then Smithery bulk)
  const [toolLogos, setToolLogos] = useState<Record<string, string>>({});
  const enabledServers = getEnabledMcpServers();

  useEffect(() => {
    let isCancelled = false;

    async function loadLogos() {
      // Start with official server logos
      const initialLogos: Record<string, string> = {};
      OFFICIAL_MCP_SERVERS.forEach((s) => {
        if (enabledServers.includes(s.qualifiedName) && s.logoUrl) {
          initialLogos[s.qualifiedName] = s.logoUrl as string;
        }
      });

      if (!isCancelled) setToolLogos((prev) => ({ ...prev, ...initialLogos }));

      if (enabledServers.length === 0) return;

      try {
        const response = await fetch("/api/smithery/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qualifiedNames: enabledServers }),
        });
        if (response.ok) {
          const data = await response.json();
          const map: Record<string, string> = {};
          Object.entries(data?.servers || {}).forEach(
            ([qualifiedName, serverData]: [string, any]) => {
              const url = (serverData as any)?.iconUrl || (serverData as any)?.logo;
              if (url) map[qualifiedName] = url as string;
            }
          );
          if (!isCancelled && Object.keys(map).length > 0) {
            setToolLogos((prev) => ({ ...prev, ...map }));
          }
        }
      } catch {
        // non-fatal; fall back to no extra logos
      }
    }

    loadLogos();
    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistant.assistant_id]);
  
  return (
    <>
      <div
        className="border rounded-lg p-4 sm:p-6 hover:border-primary transition-colors cursor-pointer relative group"
        onClick={handleClick}
      >
        <Button
          variant="ghost"
          size="icon"
          className="delete-button absolute right-1 sm:right-2 top-1 sm:top-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
        <div className="flex items-start space-x-2 sm:space-x-4">
          <div
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-full ring-2 ring-background flex items-center justify-center text-xs sm:text-sm font-medium text-white"
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
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold mb-1 truncate">
              {assistant.name}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
              {assistant.metadata?.description || "No description provided"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
          <span className="flex items-center">
            Model: {formatModelName(assistant.config?.configurable?.model)}
          </span>
          {enabledServers.length > 0 && (
            <>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center gap-2">
                {enabledServers.slice(0, 4).map((name) => {
                  const src = toolLogos[name];
                  return (
                    <div
                      key={name}
                      className="w-5 h-5 rounded-full ring-2 ring-background overflow-hidden bg-muted flex items-center justify-center text-[10px]"
                      title={name}
                    >
                      {src ? (
                        <Image
                          src={src}
                          alt={name}
                          width={20}
                          height={20}
                          className="object-cover"
                        />
                      ) : (
                        <span>🛠️</span>
                      )}
                    </div>
                  );
                })}
                {enabledServers.length > 4 && (
                  <div className="w-5 h-5 rounded-full ring-2 ring-background bg-muted text-[10px] flex items-center justify-center">
                    +{enabledServers.length - 4}
                  </div>
                )}
              </div>
            </>
          )}
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
