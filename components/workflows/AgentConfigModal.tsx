"use client"

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
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToolSelector } from '@/components/tools/ToolSelector'
import { Alert, AlertDescription } from '@/components/ui/alert'
import axios from 'axios'
import { useRouter } from 'next/navigation'

interface AgentConfigModalProps {
  isOpen: boolean
  onClose: () => void
  agentId: string
  initialConfig: AgentConfig
  onSave: (updatedConfig: AgentConfig) => void
}

interface AgentConfig {
  id?: string
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
  const router = useRouter()
  const [config, setConfig] = useState<AgentConfig>(initialConfig)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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

  const handleDeleteAgent = async () => {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const response = await fetch(`/api/agents/${agentId}/delete`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete agent')
      }
      
      onClose()
      router.push('/agents')
    } catch (error) {
      console.error('Error deleting agent:', error)
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete agent')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
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
            </TabsList>

            <TabsContent value="general">
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={config.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter agent name"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={config.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Enter agent description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Model</Label>
                    <Select 
                      value={config.model_type}
                      onValueChange={(value) => handleChange('model_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini (Free)</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o (Pro)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tone</Label>
                    <Select 
                      value={config.config?.tone || 'default'}
                      onValueChange={(value) => handleNestedChange('tone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Language</Label>
                    <Select 
                      value={config.config?.language || 'en'}
                      onValueChange={(value) => handleNestedChange('language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="prompts">
              <div className="space-y-4">
                <div>
                  <Label>Instructions</Label>
                  <Textarea
                    value={config.prompt_template}
                    onChange={(e) => handleChange('prompt_template', e.target.value)}
                    placeholder="Enter agent instructions"
                    className="min-h-[200px]"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    These instructions define your agent's behavior and capabilities
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tools">
              <div className="space-y-4">
                <ToolSelector
                  selectedTools={config.tools || []}
                  onToolToggle={(toolId, enabled, toolConfig) => {
                    const updatedTools = enabled
                      ? [...(config.tools || []), toolId]
                      : (config.tools || []).filter(t => t !== toolId)
                    
                    setConfig(prev => ({
                      ...prev,
                      tools: updatedTools,
                      config: {
                        ...prev.config,
                        toolsConfig: {
                          ...prev.config?.toolsConfig,
                          [toolId]: toolConfig
                        }
                      }
                    }))
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Temperature</Label>
                    <p className="text-sm text-muted-foreground">
                      Adjust the creativity level of responses
                    </p>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                    value={config.config.temperature || 0.7}
                    onChange={(e) => handleNestedChange('temperature', parseFloat(e.target.value))}
                    className="w-20"
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-2">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    These actions are destructive and cannot be undone.
                  </p>
                  <Button 
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    Delete Agent
                  </Button>
                </div>
              </div>
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

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this agent? This action cannot be undone.
              Any workflows that use this agent will be affected and may stop working properly.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAgent}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Agent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 