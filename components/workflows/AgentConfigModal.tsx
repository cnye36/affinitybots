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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import axios from 'axios'

interface AgentConfigModalProps {
  isOpen: boolean
  onClose: () => void
  agentId: string
  initialConfig: AgentConfig
  onSave: (updatedConfig: AgentConfig) => void
}

interface AgentConfig {
  name: string
  description?: string
  model_type: string
  prompt_template: string
  tools: string[]
  config: {
    temperature?: number
    enableKnowledge?: boolean
    tone?: string
    language?: string
    toolsConfig?: Record<string, any>
  }
}

export const AgentConfigModal: React.FC<AgentConfigModalProps> = ({
  isOpen,
  onClose,
  agentId,
  initialConfig,
  onSave,
}) => {
  const [config, setConfig] = useState<AgentConfig>(initialConfig)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setConfig(initialConfig)
  }, [initialConfig])

  const handleChange = (field: keyof AgentConfig, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleNestedChange = (
    section: keyof AgentConfig['config'],
    value: any
  ) => {
    setConfig((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [section]: value,
      },
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.put(`/api/agents/${agentId}`, config)
      onSave(response.data)
      onClose()
    } catch (err) {
      console.error('Error updating agent:', err)
      setError('Failed to update agent configuration.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Agent</DialogTitle>
          <DialogDescription>
            Modify the settings for your agent.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <Input
              value={config.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <Textarea
              value={config.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Model Type</label>
            <Input
              value={config.model_type}
              onChange={(e) => handleChange('model_type', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Prompt Template</label>
            <Textarea
              value={config.prompt_template}
              onChange={(e) => handleChange('prompt_template', e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium">Enable Knowledge Base</label>
            <Switch
              checked={config.config.enableKnowledge || false}
              onCheckedChange={(checked) => handleNestedChange('enableKnowledge', checked)}
            />
          </div>
          {config.config.enableKnowledge && (
            <div>
              <label className="block text-sm font-medium">Knowledge Base URL</label>
              <Input
                value={config.config.toolsConfig?.knowledgeBaseURL || ''}
                onChange={(e) =>
                  handleNestedChange('toolsConfig', {
                    ...config.config.toolsConfig,
                    knowledgeBaseURL: e.target.value,
                  })
                }
              />
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <DialogFooter className="flex justify-end space-x-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 