"use client";

import React, { useState } from "react";
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
        </DialogHeader>

        <Tabs defaultValue="general" className="flex-1 flex flex-col min-h-0">
          <TabsList data-tutorial="config-tabs-list" className="flex-shrink-0">
            <TabsTrigger value="general" data-tutorial="config-tab-general">General</TabsTrigger>
            <TabsTrigger value="prompt" data-tutorial="config-tab-prompt">Prompt</TabsTrigger>
            <TabsTrigger value="tools" data-tutorial="config-tab-tools">Tools</TabsTrigger>
            <TabsTrigger value="knowledge" data-tutorial="config-tab-knowledge">Knowledge</TabsTrigger>
            <TabsTrigger value="memory" data-tutorial="config-tab-memory">Memory</TabsTrigger>
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

        {error && (
          <Alert variant="destructive" className="flex-shrink-0">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter className="flex justify-end space-x-2 flex-shrink-0">
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
