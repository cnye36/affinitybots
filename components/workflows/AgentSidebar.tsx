import { useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface AgentSidebarProps {
  isOpen: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  agents: {
    id: string
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
  }[]
  loading: boolean
  error: string | null
}

export function AgentSidebar({
  isOpen,
  onMouseEnter,
  onMouseLeave,
  agents,
  loading,
  error,
}: AgentSidebarProps) {
  const onDragStart = useCallback(
    (event: React.DragEvent<HTMLDivElement>, agentId: string) => {
      event.dataTransfer.setData('application/reactflow', agentId)
      event.dataTransfer.effectAllowed = 'move'
    },
    []
  )

  return (
    <div
      className={`fixed top-0 right-0 h-full w-64 bg-background border-l transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="p-4 h-full overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Available Agents</h3>
        {loading && <p>Loading agents...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && agents.map((agent) => (
          <Card
            key={agent.id}
            className="mb-2 cursor-move"
            draggable
            onDragStart={(event) => onDragStart(event, agent.id)}
          >
            <CardHeader>
              <CardTitle className="text-sm">{agent.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">Drag to add to workflow</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

