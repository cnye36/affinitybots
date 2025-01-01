"use client"

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AgentChat } from '@/components/agents/AgentChat'
import { AgentConfigModal } from '@/components/configuration/AgentConfigModal'
import { ChatThreads } from '@/components/agents/ChatThreads'
import { useAgent } from '@/hooks/useAgent'
import { SidebarInset } from "@/components/ui/sidebar"

export default function AgentPage() {
  const params = useParams()
  const router = useRouter()
  const { agent, isLoading, isError, mutate } = useAgent(params.id as string)
  const [isSaving, setIsSaving] = useState(false)
  const [enableKnowledge, setEnableKnowledge] = useState(false)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>(undefined)

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
      await mutate() // Refresh the SWR cache
      router.push('/agents')
    } catch (err) {
      // Handle error appropriately
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (isError || !agent) return <div>Agent not found</div>

  const handleNewConfigure = () => {
    setIsConfigModalOpen(true)
  }

  return (
    <SidebarInset>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
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
            onSave={mutate}
          />
        )}

        <div className="flex-1 flex overflow-hidden">
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

        {isError && (
          <Alert variant="destructive" className="m-4">
            <AlertDescription>Failed to load agent.</AlertDescription>
          </Alert>
        )}
      </div>
    </SidebarInset>
  )
}