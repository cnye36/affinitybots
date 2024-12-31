"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AgentConfig } from '@/types/agent'
import { SourceUploader } from '@/components/knowledge/SourceUploader'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AgentChat } from '@/components/agents/AgentChat'
import { AgentConfigModal } from '@/components/workflows/AgentConfigModal'
import { ChatThreads } from '@/components/agents/ChatThreads'

export default function AgentPage() {
  const params = useParams()
  const router = useRouter()
  const [agent, setAgent] = useState<AgentConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [enableKnowledge, setEnableKnowledge] = useState(false)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>(undefined)

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
            ...agent?.config,
            enableKnowledge
          }
        })
      })
      
      if (!response.ok) throw new Error('Failed to update agent')
      router.push('/agents')
    } catch (err) {
      setError('Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (!agent) return <div>Agent not found</div>

  const handleNewConfigure = () => {
    setIsConfigModalOpen(true)
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <Link href="/agents" className="mr-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Agent: {agent.name}</h1>
        </div>
        <Button onClick={handleNewConfigure}>
          Configure Agent
        </Button>
      </div>
        
      {/* Agent Configuration Modal */}
      {agent && (
        <AgentConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          agentId={agent.id}
          initialConfig={agent}
          onSave={fetchAgent}
        />
      )}

      <div className="flex flex-1 overflow-hidden border">
        <ChatThreads
          agentId={params.id as string}
          currentThreadId={currentThreadId}
          onThreadSelect={setCurrentThreadId}
          onNewThread={() => setCurrentThreadId(undefined)}
        />

        <AgentChat
          agentId={params.id as string}
          agentName={agent.name}
          threadId={currentThreadId}
        />
      </div>

      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}