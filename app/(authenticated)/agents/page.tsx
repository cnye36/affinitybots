"use client"

import { useEffect, useState } from 'react'
import supabaseClient from '@/lib/supabaseClient'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlusCircle, Settings2, Trash2, MessageSquare } from 'lucide-react'
import { deleteAgent } from '../../api/agents/[id]/delete/action'
import { AgentChatDialog } from '@/components/agents/AgentChatDialog'

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [selectedAgent, setSelectedAgent] = useState<{id: string, name: string} | null>(null)
  const supabase = supabaseClient

  const loadAgents = async () => {
    const { data: agents, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading agents:', error)
      return
    }

    setAgents(agents || [])
  }

  useEffect(() => {
    loadAgents()
  }, [])

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
            className="border rounded-lg p-6 hover:border-primary transition-colors"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">{agent.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {agent.description || 'No description provided'}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setSelectedAgent({ id: agent.id, name: agent.name })}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Link href={`/agents/${agent.id}/edit`}>
                  <Button variant="ghost" size="icon">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </Link>
                <form action={deleteAgent.bind(null, agent.id)}>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
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

      {selectedAgent && (
        <AgentChatDialog
          isOpen={!!selectedAgent}
          onClose={() => setSelectedAgent(null)}
          agentId={selectedAgent.id}
          agentName={selectedAgent.name}
        />
      )}
    </div>
  )
} 