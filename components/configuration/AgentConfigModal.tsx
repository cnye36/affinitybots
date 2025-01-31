import React, { useState, useEffect } from 'react'
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import axios from "axios";
import { GeneralConfig } from "./GeneralConfig";
import { PromptsConfig } from "./PromptsConfig";
import { ToolSelector } from "@/components/configuration/ToolSelector";
import { SettingsConfig } from "./SettingsConfig";
import { KnowledgeConfig } from "./KnowledgeConfig";
import { AgentConfig } from "@/types/index";
import { Assistant } from "@langchain/langgraph-sdk";
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
  const [config, setConfig] = useState<AgentConfig>({
    name: assistant.name,
    configurable: {
      model: assistant.config.configurable.model || "gpt-4o",
      temperature: assistant.config.configurable.temperature || 0.7,
      tools: Object.entries(assistant.config.configurable.tools || {}).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: {
            isEnabled: value?.enabled || false,
            config: value?.config || {},
          },
        }),
        {}
      ),
      memory: assistant.config.configurable.memory || {
        enabled: true,
        max_entries: 10,
        relevance_threshold: 0.7,
      },
      prompt_template: assistant.config.configurable.prompt_template || "",
    },
    metadata: assistant.metadata,
    tools: [], // We'll need to map the assistant's tools to this format
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setConfig({
      name: assistant.name,
      configurable: {
        model: assistant.config.configurable.model || "gpt-4o",
        temperature: assistant.config.configurable.temperature || 0.7,
        tools: Object.entries(assistant.config.configurable.tools || {}).reduce(
          (acc, [key, value]) => ({
            ...acc,
            [key]: {
              isEnabled: value?.enabled || false,
              config: value?.config || {},
            },
          }),
          {}
        ),
        memory: assistant.config.configurable.memory || {
          enabled: true,
          max_entries: 10,
          relevance_threshold: 0.7,
        },
        prompt_template: assistant.config.configurable.prompt_template || "",
      },
      metadata: assistant.metadata,
      tools: [], // We'll need to map the assistant's tools to this format
    });
  }, [assistant]);

  const handleChange = (field: keyof AgentConfig, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleConfigurableChange = (
    field: keyof typeof config.configurable,
    value: unknown
  ) => {
    setConfig((prev) => ({
      ...prev,
      configurable: {
        ...prev.configurable,
        [field]: value,
      },
    }));
  };

  const handleToolsChange = (
    toolId: string,
    toolConfig: { isEnabled: boolean; config: Record<string, unknown> }
  ) => {
    setConfig((prev) => ({
      ...prev,
      configurable: {
        ...prev.configurable,
        tools: {
          ...prev.configurable.tools,
          [toolId]: toolConfig,
        },
      },
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.put(
        `/api/assistants/${assistant.assistant_id}`,
        {
          name: config.name,
          metadata: config.metadata,
          config: {
            configurable: config.configurable,
          },
        }
      );
      await mutate(
        `/api/assistants/${assistant.assistant_id}`,
        response.data,
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
              config={config}
              onChange={handleChange}
              onConfigurableChange={handleConfigurableChange}
            />
          </TabsContent>

          <TabsContent value="prompts">
            <PromptsConfig
              config={config.configurable}
              onChange={handleConfigurableChange}
            />
          </TabsContent>

          <TabsContent value="tools">
            <ToolSelector
              tools={config.configurable.tools}
              onToolsChange={handleToolsChange}
            />
          </TabsContent>

          <TabsContent value="knowledge">
            <KnowledgeConfig
              config={config.configurable}
              onChange={handleConfigurableChange}
            />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsConfig
              config={config.configurable}
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