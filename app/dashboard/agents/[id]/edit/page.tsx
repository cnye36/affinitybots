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

export default function EditAgentPage() {
  const params = useParams()
  const router = useRouter()
  const [agent, setAgent] = useState<any>(null)
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

        <Tabs defaultValue="knowledge" className="space-y-6">
          <TabsList>
            <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

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
                    <div className="grid gap-4">
                      <Button variant="outline" className="w-full">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Files
                      </Button>
                      <Button variant="outline" className="w-full">
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Add URL
                      </Button>
                    </div>
                    
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

          {/* Additional tab contents will go here */}
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