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
import { SettingsConfig } from "./SettingsConfig";
import { KnowledgeConfig } from "./KnowledgeConfig";
import {
  AgentConfigurableOptions,
  AgentMetadata,
  ModelType,
} from "@/types/index";
import { Assistant } from "@langchain/langgraph-sdk";
import { ToolsConfig } from "@/types/index";
import { useRouter } from "next/navigation";
import { mutate } from "swr";

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
    assistant_id: assistant.assistant_id,
    name: assistant.name,
    metadata: {
      description: String(assistant.metadata?.description || ""),
      agent_type: String(assistant.metadata?.agent_type || ""),
      owner_id: String(assistant.metadata?.owner_id || ""),
    } as AgentMetadata,
    config: {
      configurable: {
        model: (assistant.config.configurable.model || "gpt-4o") as ModelType,
        temperature: Number(assistant.config.configurable.temperature || 0.7),
        avatar: String(assistant.config.configurable.avatar || ""),
        tools: Object.entries(assistant.config.configurable.tools || {}).reduce(
          (acc, [key, value]) => ({
            ...acc,
            [key]: {
              isEnabled: Boolean(value?.enabled || false),
              config: value?.config || {},
            },
          }),
          {}
        ),
        memory: {
          enabled: Boolean(
            (assistant.config.configurable.memory as { enabled?: boolean })
              ?.enabled ?? true
          ),
          max_entries: Number(
            (assistant.config.configurable.memory as { max_entries?: number })
              ?.max_entries || 10
          ),
          relevance_threshold: Number(
            (
              assistant.config.configurable.memory as {
                relevance_threshold?: number;
              }
            )?.relevance_threshold || 0.7
          ),
        },
        prompt_template: String(
          assistant.config.configurable.prompt_template || ""
        ),
        owner_id: String(assistant.config.configurable.owner_id || ""),
      } as AgentConfigurableOptions,
    },
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setConfig({
      assistant_id: assistant.assistant_id,
      name: assistant.name,
      metadata: {
        description: String(assistant.metadata?.description || ""),
        agent_type: String(assistant.metadata?.agent_type || ""),
        owner_id: String(assistant.metadata?.owner_id || ""),
      } as AgentMetadata,
      config: {
        configurable: {
          model: (assistant.config.configurable.model || "gpt-4o") as ModelType,
          temperature: Number(assistant.config.configurable.temperature || 0.7),
          avatar: String(assistant.config.configurable.avatar || ""),
          tools: Object.entries(
            assistant.config.configurable.tools || {}
          ).reduce(
            (acc, [key, value]) => ({
              ...acc,
              [key]: {
                isEnabled: Boolean(value?.enabled || false),
                config: value?.config || {},
              },
            }),
            {}
          ),
          memory: {
            enabled: Boolean(
              (assistant.config.configurable.memory as { enabled?: boolean })
                ?.enabled ?? true
            ),
            max_entries: Number(
              (assistant.config.configurable.memory as { max_entries?: number })
                ?.max_entries || 10
            ),
            relevance_threshold: Number(
              (
                assistant.config.configurable.memory as {
                  relevance_threshold?: number;
                }
              )?.relevance_threshold || 0.7
            ),
          },
          prompt_template: String(
            assistant.config.configurable.prompt_template || ""
          ),
          owner_id: String(assistant.config.configurable.owner_id || ""),
        } as AgentConfigurableOptions,
      },
    });
  }, [assistant]);

  const handleChange = (field: string, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleConfigurableChange = (
    field: keyof AgentConfigurableOptions,
    value: unknown
  ) => {
    setConfig((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        configurable: {
          ...prev.config.configurable,
          [field]: value,
        },
      },
    }));
  };

  const handleToolsChange = (updatedTools: ToolsConfig) => {
    setConfig((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        configurable: {
          ...prev.config.configurable,
          tools: updatedTools,
        },
      },
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/assistants/${assistant.assistant_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: config.name,
            metadata: config.metadata,
            config: config.config,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedAssistant = await response.json();
      await mutate(
        `/api/assistants/${assistant.assistant_id}`,
        updatedAssistant,
        false
      );
      await mutate("/api/assistants");
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      console.error("Error updating assistant:", err);
      setError("Failed to update assistant configuration.");
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
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <GeneralConfig
              config={{
                assistant_id: config.assistant_id,
                name: config.name,
                metadata: config.metadata,
                config: config.config,
                avatar: config.config.configurable.avatar,
              }}
              onChange={handleChange}
              onConfigurableChange={handleConfigurableChange}
            />
          </TabsContent>

          <TabsContent value="prompts">
            <PromptsConfig
              config={config.config.configurable}
              onChange={handleConfigurableChange}
            />
          </TabsContent>

          <TabsContent value="tools">
            <ToolSelector
              tools={config.config.configurable.tools}
              onToolsChange={handleToolsChange}
            />
          </TabsContent>

          <TabsContent value="knowledge">
            <KnowledgeConfig
              config={config.config.configurable}
              onChange={handleConfigurableChange}
            />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsConfig
              config={config.config.configurable}
              onChange={handleConfigurableChange}
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
