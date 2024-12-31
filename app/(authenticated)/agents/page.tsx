'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import { deleteAgent } from '@/app/api/agents/[id]/delete/action'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Agent {
  id: string
  name: string
  description?: string
  model_type?: string
  tools?: { name: string }[]
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [error, setError] = useState<string>()
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadAgents() {
      try {
        const response = await fetch('/api/agents')
        if (!response.ok) throw new Error('Failed to load agents')
        const data = await response.json()
        setAgents(data.agents)
      } catch (error) {
        console.error('Error loading agents:', error)
        setError(error instanceof Error ? error.message : 'Failed to load agents')
      } finally {
        setIsLoading(false)
      }
    }

    loadAgents()
  }, [])

  const handleDelete = async (agentId: string) => {
    const confirmed = confirm('Are you sure you want to delete this agent?')
    if (!confirmed) return

    try {
      const result = await deleteAgent(agentId)
      if ('error' in result) {
        console.error('Error deleting agent:', result.error)
      } else {
        // Refresh the agents list
        const response = await fetch('/api/agents')
        if (response.ok) {
          const data = await response.json()
          setAgents(data.agents)
        }
      }
    } catch (error) {
      console.error('Error deleting agent:', error)
    }
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-4">My Agents</h1>
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-4">My Agents</h1>
        <div>Loading agents...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <Link href="/agents/new">
          <Button>
            <PlusCircle className="mr-2" />
            Create Agent
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer"
            onClick={() => router.push(`/agents/${agent.id}`)}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">{agent.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {agent.description || 'No description provided'}
                </p>
              </div>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <span className="flex items-center">
                Model: {agent.model_type}
              </span>
              <span className="mx-2">•</span>
              <span>
                {agent.tools?.length || 0} tools
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 