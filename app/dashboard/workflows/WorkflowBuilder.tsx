'use client'

import React, { useState, useCallback } from 'react'
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  Controls,
  Background,
  Connection,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  NodeTypes,
  ReactFlowInstance,
} from 'reactflow'
import 'reactflow/dist/style.css'
import SlimSidebar from './SlimSidebar'
import CustomNode from './CustomNode'
import { PlusCircle } from 'lucide-react'

const nodeTypes: NodeTypes = {
  custom: CustomNode,
}

interface CustomNodeData {
  label: string
  type?: string
}

const initialNodes: Node<CustomNodeData>[] = [
  {
    id: 'start',
    type: 'custom',
    data: { 
      label: 'Start Here',
      type: 'Trigger'
    },
    position: { x: 250, y: 50 },
    className: 'start-node'
  },
]

const WorkflowBuilder: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([])
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds))
    },
    [setEdges]
  )

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      setNodes((nds) => nds.filter((node) => !deleted.includes(node)))
    },
    [setNodes]
  )

  const onLoad = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance)
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      if (!reactFlowInstance) return

      const agentData = event.dataTransfer.getData('application/reactflow')
      
      try {
        const { label, type } = JSON.parse(agentData)
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        })

        const newNode: Node<CustomNodeData> = {
          id: `${type}_${Date.now()}`,
          type: 'custom',
          position,
          data: { label, type },
        }

        setNodes((nds) => [...nds, newNode])
      } catch (error) {
        console.error('Failed to add node:', error)
      }
    },
    [reactFlowInstance, setNodes]
  )

  return (
    <div className="flex w-full h-[calc(100vh-4rem)]">
      <div 
        className="flex-1 bg-background"
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodesDelete={onNodesDelete}
            onLoad={onLoad}
            snapToGrid
            snapGrid={[15, 15]}
            fitView
          >
            <Background 
              variant="dots" 
              gap={20} 
              size={1} 
              color="var(--border)"
            />
            <Controls />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
      <SlimSidebar />
    </div>
  )
}

export default WorkflowBuilder 