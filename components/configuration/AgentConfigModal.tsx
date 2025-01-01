import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import axios from 'axios'
import { GeneralConfig } from './GeneralConfig'
import { PromptsConfig } from './PromptsConfig'
import { ToolSelector } from '@/components/configuration/ToolSelector'
import { SettingsConfig } from './SettingsConfig'
import { AgentConfig } from '@/types/agent'
import { KnowledgeConfig } from './KnowledgeConfig'

interface AgentConfigModalProps {
  isOpen: boolean
  onClose: () => void
  agentId: string
  initialConfig: AgentConfig
  onSave: () => void
}

export const AgentConfigModal: React.FC<AgentConfigModalProps> = ({
  isOpen,
  onClose,
  agentId,
  initialConfig,
  onSave,
}) => {
  const [config, setConfig] = useState<AgentConfig>(initialConfig)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [toolConfigs, setToolConfigs] = useState<Record<string, any>>({})

  useEffect(() => {
    setConfig(initialConfig)
  }, [initialConfig])

  const handleChange = (field: keyof AgentConfig, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleNestedChange = (section: keyof AgentConfig['config'], value: any) => {
    setConfig((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [section]: value,
      },
    }))
  }

  const handleToggleTool = (toolId: string, enabled: boolean, config?: any) => {
    setConfig((prev) => ({
      ...prev,
      tools: enabled
        ? [...prev.tools, toolId]
        : prev.tools.filter((id) => id !== toolId),
      config: {
        ...prev.config,
        toolsConfig: {
          ...prev.config.toolsConfig,
          [toolId]: config,
        },
      },
    }))
  }

  const handleToolConfigChange = (toolId: string, newConfig: any) => {
    setToolConfigs((prev) => ({
      ...prev,
      [toolId]: newConfig,
    }))
    setConfig((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        toolsConfig: {
          ...prev.config.toolsConfig,
          [toolId]: newConfig,
        },
      },
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      await axios.put(`/api/agents/${agentId}`, config)
      onSave()
      onClose()
    } catch (err) {
      console.error('Error updating agent:', err)
      setError('Failed to update agent configuration.')
    } finally {
      setLoading(false)
    }
  }

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
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
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

          <TabsContent value="settings">
            <SettingsConfig config={config} onChange={handleNestedChange} />
          </TabsContent>

          <TabsContent value="knowledge">
            <KnowledgeConfig
              agentId={agentId}
              knowledgeBase={config.config.knowledgeBase || { documents: [], urls: [] }}
              onKnowledgeUpdate={onSave}
            />
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
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}