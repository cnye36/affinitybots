'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Bot } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChatThreads } from '@/components/agents/ChatThreads'
import { AgentChat } from '@/components/agents/AgentChat'
import { use } from 'react'

interface Agent {
  id: string
  name: string
  description?: string
  modelType?: string
  tools?: { name: string }[]
}

export default function AgentChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>(
    searchParams.get('thread') || undefined
  )

  useEffect(() => {
    async function loadAgent() {
      try {
        const response = await fetch(`/api/agents/${id}`)
        if (!response.ok) throw new Error('Failed to load agent')
        const data = await response.json()
        setAgent(data)
      } catch (error) {
        console.error('Error loading agent:', error)
      }
    }

    loadAgent()
  }, [id])

  const handleNewThread = (newThreadId?: string) => {
    if (newThreadId) {
      // Update URL with new thread ID
      window.history.pushState({}, '', `/agents/${id}/chat?thread=${newThreadId}`)
    }
    setCurrentThreadId(newThreadId)
  }

  if (!agent) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <ChatThreads
        agentId={id}
        currentThreadId={currentThreadId}
        onThreadSelect={handleNewThread}
        onNewThread={() => handleNewThread(undefined)}
      />
      
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-shrink-0 border-b px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/agents`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Agents
            </Button>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">{agent.name}</h1>
            </div>
          </div>
          {agent.description && (
            <p className="text-sm text-muted-foreground mt-1">{agent.description}</p>
          )}
          <div className="flex gap-2 text-xs text-muted-foreground mt-2">
            {agent.modelType && (
              <span className="bg-secondary px-2 py-1 rounded-md">
                Model: {agent.modelType}
              </span>
            )}
            {agent.tools && agent.tools.length > 0 && (
              <span className="bg-secondary px-2 py-1 rounded-md">
                Tools: {agent.tools.map(t => t.name).join(', ')}
              </span>
            )}
          </div>
        </div>

        <AgentChat
          agentId={id}
          agentName={agent.name}
          threadId={currentThreadId}
          onNewThread={handleNewThread}
        />
      </div>
    </div>
  )
} 