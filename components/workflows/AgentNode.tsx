import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export const AgentNode = memo(({ data }: { data: { label: string } }) => {
  return (
    <Card className="w-48">
      <CardHeader>
        <CardTitle className="text-sm">{data.label}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Add agent-specific configuration options here */}
      </CardContent>
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </Card>
  )
})

AgentNode.displayName = 'AgentNode'

