"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle } from "lucide-react";
import { GeneralConfig } from "./GeneralConfig";
import { PromptsConfig } from "./PromptsConfig";
import { ToolSelector } from "@/components/configuration/ToolSelector";
import { MemoryConfig } from "./MemoryConfig";
import { KnowledgeConfig } from "./KnowledgeConfig";
import { AssistantConfiguration, AssistantMetadata } from "@/types/assistant";
import { mutate } from "swr";
import { Assistant } from "@/types/assistant";
import { useAgent } from "@/hooks/useAgent";
 

interface AgentConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistant: Assistant;
}

export function AgentConfigModal({
  open,
  onOpenChange,
  assistant,
}: AgentConfigModalProps) {
  const { assistant: liveAssistant } = useAgent(assistant.assistant_id, {
    fallbackData: assistant,
  });
  const currentAssistant = liveAssistant || assistant;

  const assistantToDraft = (a: Assistant) => ({
    agent_id: a.assistant_id,
    description: a.metadata.description,
    agent_avatar: a.metadata.agent_avatar,
    graph_id: a.graph_id,
    created_at: a.created_at,
    updated_at: a.updated_at,
    name: a.name,
    metadata: {
      owner_id: String(a.metadata.owner_id),
    } as AssistantMetadata,
    config: a.config.configurable as AssistantConfiguration,
  });

  const [config, setConfig] = useState(() => assistantToDraft(currentAssistant));

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedSnapshotRef = useRef<string>("");
  const isInitialSnapshotRef = useRef(true);
  const lastEditKindRef = useRef<"text" | "other">("other");
  
  // Reset draft when opening, but do not require explicit saving (autosave handles persistence).
  useEffect(() => {
    if (!open) return;
    const next = assistantToDraft(currentAssistant);
    setConfig(next);
    const payload = {
      name: next.name,
      metadata: {
        ...next.metadata,
        description: next.description || "",
        agent_avatar: next.agent_avatar || null,
      },
      config: { configurable: next.config },
    };
    lastSavedSnapshotRef.current = JSON.stringify(payload);
    isInitialSnapshotRef.current = true;
    setSaveStatus("idle");
    setSaveError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentAssistant.assistant_id]);

  const handleChange = (field: string, value: unknown) => {
    lastEditKindRef.current = field === "name" || field === "description" ? "text" : "other";
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Optimistically update SWR cache for instant UI consistency.
    const optimistic = {
      ...currentAssistant,
      name: field === "name" ? String(value) : currentAssistant.name,
      metadata: {
        ...currentAssistant.metadata,
        description:
          field === "description" ? String(value) : (currentAssistant.metadata.description || ""),
        agent_avatar:
          field === "agent_avatar" ? (value === null ? undefined : String(value)) : currentAssistant.metadata.agent_avatar,
      },
    } satisfies Assistant;
    void mutate(`/api/agents/${currentAssistant.assistant_id}`, optimistic, false);
  };

  const handleConfigurableChange = (field: string, value: unknown) => {
    lastEditKindRef.current = field === "prompt_template" ? "text" : "other";
    setConfig((prev) => {
      const newConfig = {
        ...prev,
        config: {
          ...prev.config,
          [field]: value,
        },
      };
      
      return newConfig;
    });

    if (field === "prompt_template") return;

    const optimistic = {
      ...currentAssistant,
      config: {
        ...currentAssistant.config,
        configurable: {
          ...currentAssistant.config.configurable,
          [field]: value as any,
        },
      },
    } satisfies Assistant;
    void mutate(`/api/agents/${currentAssistant.assistant_id}`, optimistic, false);
  };

  const handleMCPServersChange = (servers: string[]) => {
    console.log("🔧 MCP Servers changed:", servers);
    lastEditKindRef.current = "other";
    setConfig((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        enabled_mcp_servers: servers,
      },
    }));

    const optimistic = {
      ...currentAssistant,
      config: {
        ...currentAssistant.config,
        configurable: {
          ...currentAssistant.config.configurable,
          enabled_mcp_servers: servers,
        },
      },
    } satisfies Assistant;
    void mutate(`/api/agents/${currentAssistant.assistant_id}`, optimistic, false);
  };

  const updatePayload = useMemo(() => {
    return {
      name: config.name,
      metadata: {
        ...config.metadata,
        description: config.description || "",
        agent_avatar: config.agent_avatar || null,
      },
      config: { configurable: config.config },
    };
  }, [config.agent_avatar, config.config, config.description, config.metadata, config.name]);

  const updateSnapshot = useMemo(() => JSON.stringify(updatePayload), [updatePayload]);

  // Autosave only while modal is open.
  useEffect(() => {
    if (!open) return;
    if (!currentAssistant.assistant_id) return;

    if (isInitialSnapshotRef.current) {
      lastSavedSnapshotRef.current = updateSnapshot;
      isInitialSnapshotRef.current = false;
      return;
    }

    if (updateSnapshot === lastSavedSnapshotRef.current) return;

    const delayMs = lastEditKindRef.current === "text" ? 800 : 250;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      setSaveError(null);
      try {
        const response = await fetch(`/api/agents/${currentAssistant.assistant_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: updateSnapshot,
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          throw new Error(errorText || `Failed to save: ${response.status}`);
        }

        const updatedAgent = (await response.json()) as Assistant;
        const nextDraft = assistantToDraft(updatedAgent);
        const nextPayload = {
          name: nextDraft.name,
          metadata: {
            ...nextDraft.metadata,
            description: nextDraft.description || "",
            agent_avatar: nextDraft.agent_avatar || null,
          },
          config: { configurable: nextDraft.config },
        };

        // Update snapshot from server response to avoid resaving due to normalization,
        // but DO NOT overwrite the local draft state (prevents cursor loss mid-edit).
        lastSavedSnapshotRef.current = JSON.stringify(nextPayload);

        await mutate(`/api/agents/${currentAssistant.assistant_id}`, updatedAgent, false);
        await mutate("/api/agents");

        setSaveStatus("idle");
      } catch (err) {
        console.error("Autosave failed:", err);
        setSaveStatus("error");
        setSaveError("Failed to save changes. Check your connection and try again.");
      }
    }, delayMs);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, updateSnapshot, currentAssistant.assistant_id]);

  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl h-[85vh] flex flex-col overflow-hidden border-2 border-violet-200/50 dark:border-violet-800/50"
      >
        {/* Gradient Header */}
        <div className="relative overflow-hidden rounded-t-lg border-b border-violet-200/50 dark:border-violet-800/30 bg-gradient-to-r from-violet-500/10 to-purple-500/10 px-6 py-4 flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

          <DialogHeader className="relative">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Configure Agent
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  Customize behavior, tools, and capabilities
                </DialogDescription>
              </div>

              {/* Save Status Indicator */}
              <div className="flex items-center gap-2">
                {saveStatus === "saving" && (
                  <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                    <div className="h-2 w-2 rounded-full bg-violet-600 dark:bg-violet-400 animate-pulse" />
                    <span className="text-xs font-medium">Saving...</span>
                  </div>
                )}
                {saveStatus === "idle" && (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Saved</span>
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        <Tabs defaultValue="general" className="flex-1 flex flex-col min-h-0">
          <TabsList className="flex-shrink-0 mx-6 mt-4 bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200/30 dark:border-violet-800/30">
            <TabsTrigger
              value="general"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="prompt"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              Prompt
            </TabsTrigger>
            <TabsTrigger
              value="tools"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              Tools
            </TabsTrigger>
            <TabsTrigger
              value="knowledge"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              Knowledge
            </TabsTrigger>
            <TabsTrigger
              value="memory"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              Memory
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
            <GeneralConfig
              config={{
                id: config.agent_id,
                name: config.name,
                description: config.description || "",
                metadata: config.metadata,
                config: config.config as AssistantConfiguration,
                agent_avatar: config.agent_avatar,
              }}
              onChange={handleChange}
              onConfigurableChange={handleConfigurableChange}
            />
          </TabsContent>

          <TabsContent value="prompt" className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
            <PromptsConfig
              config={config.config as AssistantConfiguration}
              onChange={handleConfigurableChange}
            />
          </TabsContent>

          <TabsContent value="tools" className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
            <ToolSelector
              enabledMCPServers={
                config.config.enabled_mcp_servers || []
              }
              onMCPServersChange={handleMCPServersChange}
            />
          </TabsContent>

          <TabsContent value="knowledge" className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
            <KnowledgeConfig
              config={config.config as AssistantConfiguration}
              onChange={handleConfigurableChange}
              assistant_id={assistant.assistant_id}
            />
          </TabsContent>

          <TabsContent value="memory" className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
            <MemoryConfig
              config={config.config as AssistantConfiguration}
              onChange={handleConfigurableChange}
              assistantId={assistant.assistant_id}
            />
          </TabsContent>
        </Tabs>

        {saveError && (
          <Alert variant="destructive" className="flex-shrink-0 mx-6 mb-4">
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}
