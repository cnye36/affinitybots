// app/dashboard/workflows/CustomNode.tsx
'use client'

import { Handle, Position, NodeProps } from 'reactflow'
import { Bot } from 'lucide-react'

interface CustomNodeData {
  label: string
  type?: string
}

const CustomNode = ({ data }: NodeProps<CustomNodeData>) => {
  return (
    <div className="custom-node bg-white border-2 rounded-lg p-4 min-w-[200px]">
      <Handle type="target" position={Position.Left} />
      <div className="flex items-center gap-3">
        <Bot className="h-5 w-5 text-primary" />
        <div>
          <div className="font-medium">{data.label}</div>
          <div className="text-xs text-muted-foreground">{data.type || 'AI Agent'}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default CustomNode