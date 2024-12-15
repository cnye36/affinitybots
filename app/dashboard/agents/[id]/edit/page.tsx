"use client"

import { use,useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Upload, Link as LinkIcon, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ToolSelector } from '@/components/tools/ToolSelector'
import { AgentConfig } from '@/types'
import { SourceUploader } from '@/components/knowledge/SourceUploader'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function EditAgentPage() {
  const params = useParams()
  const router = useRouter()
  const [agent, setAgent] = useState<AgentConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [enableKnowledge, setEnableKnowledge] = useState(false)

  useEffect(() => {
    fetchAgent()
  }, [])

  const fetchAgent = async () => {
    try {
      const response = await fetch(`/api/agents/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch agent')
      const data = await response.json()
      console.log('Fetched agent data:', data)
      setAgent(data)
      setEnableKnowledge(data.config?.enableKnowledge || false)
    } catch (err) {
      setError('Failed to load agent')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/agents/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...agent,
          config: {
            ...agent.config,
            enableKnowledge
          }
        })
      })
      
      if (!response.ok) throw new Error('Failed to update agent')
      router.push('/dashboard/agents')
    } catch (err) {
      setError('Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (!agent) return <div>Agent not found</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <Link href="/dashboard/agents" className="mr-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Configure Agent</h1>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Configuration</CardTitle>
                <CardDescription>Configure your agent's basic settings and behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Agent Name</Label>
                  <Input 
                    value={agent.name}
                    onChange={(e) => setAgent(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter agent name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Instructions</Label>
                  <Textarea 
                    value={agent.prompt_template}
                    onChange={(e) => setAgent(prev => ({ ...prev, prompt_template: e.target.value }))}
                    placeholder="Enter agent instructions"
                    className="min-h-[200px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    These instructions define your agent's behavior and capabilities
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select 
                      value={agent.model_type}
                      onValueChange={(value) => setAgent(prev => ({ ...prev, model_type: value }))}
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

                  <div className="space-y-2">
                    <Label>Tone</Label>
                    <Select 
                      value={agent.config?.tone || 'default'}
                      onValueChange={(value) => setAgent(prev => ({ 
                        ...prev, 
                        config: { ...prev.config, tone: value }
                      }))}
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

                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select 
                      value={agent.config?.language || 'en'}
                      onValueChange={(value) => setAgent(prev => ({ 
                        ...prev, 
                        config: { ...prev.config, language: value }
                      }))}
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="knowledge">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Configuration</CardTitle>
                <CardDescription>Configure what information your agent can access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Knowledge Base</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow your agent to access and learn from external sources
                    </p>
                  </div>
                  <Switch
                    checked={enableKnowledge}
                    onCheckedChange={setEnableKnowledge}
                  />
                </div>

                {enableKnowledge && (
                  <div className="space-y-4">
                    <SourceUploader 
                      agentId={agent.id}
                      onSourceAdded={fetchAgent}
                    />
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground text-center">
                        No knowledge sources added yet
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prompts">
            <Card>
              <CardHeader>
                <CardTitle>Prompt Configuration</CardTitle>
                <CardDescription>Configure your agent's prompts</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Prompt content here */}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools">
            <Card>
              <CardHeader>
                <CardTitle>Agent Tools</CardTitle>
                <CardDescription>
                  Enable or disable tools that your agent can use
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ToolSelector
                  selectedTools={agent.tools || []}
                  onToolToggle={(toolId, enabled, config) => {
                    const updatedTools = enabled
                      ? [...(agent.tools || []), toolId]
                      : (agent.tools || []).filter((t: string) => t !== toolId)
                    
                    setAgent((prev: any) => ({
                      ...prev,
                      tools: updatedTools,
                      config: {
                        ...prev.config,
                        toolsConfig: {
                          ...prev.config?.toolsConfig,
                          [toolId]: config
                        }
                      }
                    }))
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Agent Settings</CardTitle>
                <CardDescription>Configure general agent settings</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Settings content here */}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end mt-6 space-x-4">
          <Button variant="outline" onClick={() => router.push('/dashboard/agents')}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}