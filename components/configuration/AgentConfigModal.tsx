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
        className="max-w-4xl h-[80vh] flex flex-col overflow-hidden"
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Configure Agent</DialogTitle>
          <DialogDescription>
            Modify the settings for your agent.
          </DialogDescription>
          <div className="pt-2">
            {saveStatus === "saving" && (
              <p className="text-xs text-muted-foreground">Saving…</p>
            )}
            {saveStatus === "error" && saveError && (
              <p className="text-xs text-destructive">{saveError}</p>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="general" className="flex-1 flex flex-col min-h-0">
          <TabsList className="flex-shrink-0">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="prompt">Prompt</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
            <TabsTrigger value="memory">Memory</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="flex-1 overflow-y-auto min-h-0">
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

          <TabsContent value="prompt" className="flex-1 overflow-y-auto min-h-0">
            <PromptsConfig
              config={config.config as AssistantConfiguration}
              onChange={handleConfigurableChange}
            />
          </TabsContent>

          <TabsContent value="tools" className="flex-1 overflow-y-auto min-h-0">
            <ToolSelector
              enabledMCPServers={
                config.config.enabled_mcp_servers || []
              }
              onMCPServersChange={handleMCPServersChange}
            />
          </TabsContent>

          <TabsContent value="knowledge" className="flex-1 overflow-y-auto min-h-0">
            <KnowledgeConfig
              config={config.config as AssistantConfiguration}
              onChange={handleConfigurableChange}
              assistant_id={assistant.assistant_id}
            />
          </TabsContent>

          <TabsContent value="memory" className="flex-1 overflow-y-auto min-h-0">
            <MemoryConfig
              config={config.config as AssistantConfiguration}
              onChange={handleConfigurableChange}
              assistantId={assistant.assistant_id}
            />
          </TabsContent>
        </Tabs>

        {saveError && (
          <Alert variant="destructive" className="flex-shrink-0">
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}
