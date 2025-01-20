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
import { KnowledgeConfig } from "@/components/configuration/KnowledgeConfig";
import { AgentConfig } from "@/types/agent";
import { useRouter } from "next/navigation";
import { mutate } from "swr";

interface AgentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  initialConfig: AgentConfig;
  onSave?: (config: AgentConfig) => void;
}

export const AgentConfigModal: React.FC<AgentConfigModalProps> = ({
  isOpen,
  onClose,
  agentId,
  initialConfig,
}) => {
  const [config, setConfig] = useState<AgentConfig>(initialConfig);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  const handleChange = (field: keyof AgentConfig, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedChange = (
    section: keyof AgentConfig["config"],
    value: unknown
  ) => {
    setConfig((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [section]: value,
      },
    }));
  };

  const handleToggleTool = (
    toolId: string,
    enabled: boolean,
    toolConfig?: Record<string, unknown>
  ) => {
    setConfig((prev) => ({
      ...prev,
      tools: enabled
        ? [...prev.tools, toolId]
        : prev.tools.filter((id) => id !== toolId),
      config: {
        ...prev.config,
        toolsConfig: {
          ...prev.config.toolsConfig,
          [toolId]: toolConfig,
        },
      },
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.put(`/api/agents/${agentId}`, config);
      // Mutate the agent data in the SWR cache
      await mutate(`/api/agents/${agentId}`, response.data, false);
      // Also mutate the agents list
      await mutate("/api/agents");
      onClose();
      router.refresh();
    } catch (err) {
      console.error("Error updating agent:", err);
      setError("Failed to update agent configuration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
            <GeneralConfig config={config} onChange={handleChange} />
          </TabsContent>

          <TabsContent value="prompts">
            <PromptsConfig config={config} onChange={handleChange} />
          </TabsContent>

          <TabsContent value="tools">
            <ToolSelector
              selectedTools={config.tools}
              onToolToggle={handleToggleTool}
            />
          </TabsContent>

          <TabsContent value="knowledge">
            <KnowledgeConfig config={config} onChange={handleNestedChange} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsConfig config={config} onChange={handleNestedChange} />
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter className="flex justify-end space-x-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};