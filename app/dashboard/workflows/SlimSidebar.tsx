'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import axios from 'axios'

interface Agent {
  id: string
  name: string
  description: string
  agent_type: string
}

const SlimSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await axios.get('/api/agents')
        setAgents(response.data.agents)
      } catch (err) {
        console.error('Error fetching agents:', err)
        setError('Failed to load agents')
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()
  }, [])

  const onDragStart = (event: React.DragEvent, agent: Agent) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({
      label: agent.name,
      type: agent.agent_type,
      agentId: agent.id
    }))
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div 
      className={cn(
        "relative bg-background border-l transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-16"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -left-3 top-1/2 transform -translate-y-1/2 bg-background border rounded-full p-1"
      >
        {isExpanded ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      <div className="p-4">
        <h3 className={cn(
          "font-semibold transition-opacity",
          isExpanded ? "opacity-100" : "opacity-0"
        )}>
          Available Agents
        </h3>
        <div className="mt-4 space-y-2">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading agents...</div>
          ) : error ? (
            <div className="text-sm text-destructive">{error}</div>
          ) : agents.length === 0 ? (
            <div className="text-sm text-muted-foreground">No agents available</div>
          ) : (
            agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-grab"
                draggable
                onDragStart={(e) => onDragStart(e, agent)}
              >
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs text-primary">{agent.name[0]}</span>
                </div>
                <div className={cn(
                  "transition-opacity overflow-hidden",
                  isExpanded ? "opacity-100" : "opacity-0"
                )}>
                  <div className="text-sm font-medium truncate">{agent.name}</div>
                  {isExpanded && (
                    <div className="text-xs text-muted-foreground truncate">
                      {agent.description}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default SlimSidebar 