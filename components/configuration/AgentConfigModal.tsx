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
import {
  Agent,
  AgentMetadata,
  AgentConfiguration,
  ModelType,
} from "@/types/agent";
import { useRouter } from "next/navigation";
import { mutate } from "swr";

interface AgentConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent;
}

export function AgentConfigModal({
  open,
  onOpenChange,
  agent,
}: AgentConfigModalProps) {
  const [config, setConfig] = useState({
    agent_id: agent.assistant_id,
    description: agent.description,
    agent_avatar: agent.agent_avatar,
    graph_id: agent.graph_id,
    created_at: agent.created_at,
    updated_at: agent.updated_at,
    name: agent.name,
    metadata: {
      owner_id: String(agent.metadata.owner_id),
    } as AgentMetadata,
    config: {
      model: (agent.config.model || "gpt-4o") as ModelType,
      temperature: Number(agent.config.temperature || 0.7),
      enabled_mcp_servers: agent.config.enabled_mcp_servers || [],
      memory: {
        enabled: Boolean(
          (agent.config.memory as { enabled?: boolean })?.enabled ?? true
        ),
      },
      prompt_template: String(agent.config.prompt_template || ""),
      knowledge_base: agent.config.knowledge_base || {
        isEnabled: false,
        config: { sources: [] },
      },
    } as AgentConfiguration,
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
    console.log("handleConfigurableChange called with:", field, value);
    setConfig((prev) => {
      const newConfig = {
        ...prev,
        config: {
          ...prev.config,
          [field]: value,
        },
      };
      console.log("New config state:", newConfig.config);
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
        full_config: config.config
      });
      
      const response = await fetch(`/api/assistants/${agent.assistant_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          metadata: config.metadata,
          config: config.config,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Save failed:", response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedAgent = await response.json();
      console.log("✅ Agent updated successfully:", updatedAgent);
      
      await mutate(`/api/assistants/${agent.assistant_id}`, updatedAgent, false);
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
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Configure Agent</DialogTitle>
          <DialogDescription>
            Modify the settings for your agent.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
            <TabsTrigger value="memory">Memory</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <GeneralConfig
              config={{
                id: agent.assistant_id,
                name: agent.name,
                description: agent.description,
                metadata: agent.metadata,
                config: agent.config,
                agent_avatar: agent.agent_avatar,
              }}
              onChange={handleChange}
              onConfigurableChange={handleConfigurableChange}
            />
          </TabsContent>

          <TabsContent value="prompts">
            <PromptsConfig
              config={config.config}
              onChange={handleConfigurableChange}
            />
          </TabsContent>

          <TabsContent value="tools">
            <ToolSelector
              enabledMCPServers={
                config.config.enabled_mcp_servers || []
              }
              onMCPServersChange={handleMCPServersChange}
            />
          </TabsContent>

          <TabsContent value="knowledge">
            <KnowledgeConfig
              config={config.config}
              onChange={handleConfigurableChange}
              agent_id={agent.assistant_id}
            />
          </TabsContent>

          <TabsContent value="memory">
            <MemoryConfig
              config={config.config}
              onChange={handleConfigurableChange}
              agentId={agent.assistant_id}
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
