import { useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

const agentTypes = ['TextProcessor', 'ImageAnalyzer', 'DataExtractor'] // Add more agent types as needed

interface AgentSidebarProps {
  isOpen: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
}

export function AgentSidebar({ isOpen, onMouseEnter, onMouseLeave }: AgentSidebarProps) {
  const onDragStart = useCallback((event: React.DragEvent<HTMLDivElement>, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }, [])

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
        {agentTypes.map((agentType) => (
          <Card
            key={agentType}
            className="mb-2 cursor-move"
            draggable
            onDragStart={(event) => onDragStart(event, 'agent')}
          >
            <CardHeader>
              <CardTitle className="text-sm">{agentType}</CardTitle>
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

