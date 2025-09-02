"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralConfig } from "./GeneralConfig";
import { PromptsConfig } from "./PromptsConfig";
import { ToolSelector } from "@/components/configuration/ToolSelector";
import { MemoryConfig } from "./MemoryConfig";
import { KnowledgeConfig } from "./KnowledgeConfig";
import { AssistantConfiguration, AssistantMetadata, ModelType } from "@/types/assistant";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { Assistant } from "@/types/assistant";
import { useOnboarding, configTabsTutorialSteps } from "@/hooks/use-onboarding";

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
  const [config, setConfig] = useState({
    agent_id: assistant.assistant_id,
    description: assistant.metadata.description,
    agent_avatar: assistant.metadata.agent_avatar,
    graph_id: assistant.graph_id,
    created_at: assistant.created_at,
    updated_at: assistant.updated_at,
    name: assistant.name,
    metadata: {
      owner_id: String(assistant.metadata.owner_id),
    } as AssistantMetadata,
    config: (assistant.config.configurable as AssistantConfiguration),
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { startTour, isActive, getCurrentStep } = useOnboarding();
  const currentStep = getCurrentStep();
  const isConfigStep = !!currentStep && currentStep.id.startsWith('config-tab-');



  const handleChange = (field: string, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleConfigurableChange = (field: string, value: unknown) => {
    
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
  };

  const handleMCPServersChange = (servers: string[]) => {
    console.log("🔧 MCP Servers changed:", servers);
    setConfig((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        enabled_mcp_servers: servers,
      },
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("💾 Saving agent configuration:", {
        name: config.name,
        enabled_mcp_servers: config.config.enabled_mcp_servers,
        configurable: config.config,
      });

      const response = await fetch(`/api/assistants/${assistant.assistant_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          metadata: config.metadata,
          config: { configurable: config.config },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Save failed:", response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedAgent = await response.json();
      console.log("✅ Agent updated successfully:", updatedAgent);
      
      await mutate(`/api/assistants/${assistant.assistant_id}`, updatedAgent, false);
      await mutate("/api/assistants");
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      console.error("Error updating agent:", err);
      setError("Failed to update agent configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      if (open) {
        const seen = localStorage.getItem('onboarding-config-tabs-seen')
        if (!seen && !isActive) {
          localStorage.setItem('onboarding-config-tabs-seen', 'true')
          // delay to ensure tabs are rendered
          setTimeout(() => startTour(configTabsTutorialSteps), 300)
        }
      }
    } catch (e) {
      // no-op
    }
  }, [open, startTour, isActive])

  return (
    <Dialog open={open || (isActive && isConfigStep)} onOpenChange={(next) => {
      if (isActive && next === false) return;
      onOpenChange(next);
    }}>
      <DialogContent 
        className="max-w-4xl h-[80vh] flex flex-col"
        onInteractOutside={(e) => { if (isActive) e.preventDefault() }}
        onEscapeKeyDown={(e) => { if (isActive) e.preventDefault() }}
      >
        <DialogHeader>
          <DialogTitle>Configure Agent</DialogTitle>
          <DialogDescription>
            Modify the settings for your agent.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="space-y-6 flex-1 flex flex-col">
          <TabsList data-tutorial="config-tabs-list">
            <TabsTrigger value="general" data-tutorial="config-tab-general">General</TabsTrigger>
            <TabsTrigger value="prompt" data-tutorial="config-tab-prompt">Prompt</TabsTrigger>
            <TabsTrigger value="tools" data-tutorial="config-tab-tools">Tools</TabsTrigger>
            <TabsTrigger value="knowledge" data-tutorial="config-tab-knowledge">Knowledge</TabsTrigger>
            <TabsTrigger value="memory" data-tutorial="config-tab-memory">Memory</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="flex-1 overflow-y-auto">
            <GeneralConfig
              config={{
                id: assistant.assistant_id,
                name: assistant.name,
                description: assistant.metadata.description || "",
                metadata: assistant.metadata,
              config: assistant.config.configurable as AssistantConfiguration,
                agent_avatar: assistant.metadata.agent_avatar,
              }}
              onChange={handleChange}
              onConfigurableChange={handleConfigurableChange}
            />
          </TabsContent>

          <TabsContent value="prompt" className="flex-1 overflow-y-auto">
            <PromptsConfig
              config={config.config as AssistantConfiguration}
              onChange={handleConfigurableChange}
            />
          </TabsContent>

          <TabsContent value="tools" className="flex-1 overflow-y-auto">
            <ToolSelector
              enabledMCPServers={
                config.config.enabled_mcp_servers || []
              }
              onMCPServersChange={handleMCPServersChange}
            />
          </TabsContent>

          <TabsContent value="knowledge" className="flex-1 overflow-y-auto">
            <KnowledgeConfig
              config={config.config as AssistantConfiguration}
              onChange={handleConfigurableChange}
              assistant_id={assistant.assistant_id}
            />
          </TabsContent>

          <TabsContent value="memory" className="flex-1 overflow-y-auto">
            <MemoryConfig
              config={config.config as AssistantConfiguration}
              onChange={handleConfigurableChange}
              assistantId={assistant.assistant_id}
            />
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter className="flex justify-end space-x-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
