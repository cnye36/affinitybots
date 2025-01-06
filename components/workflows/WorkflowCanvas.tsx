'use client'

import { useCallback, useState, useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  NodeTypes,
  EdgeTypes,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  BackgroundVariant,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { AgentNode } from './AgentNode'
import { CustomEdge } from './CustomEdge'
import axios from 'axios'
import { AgentConfigModal } from '../configuration/AgentConfigModal'
import { AgentConfig } from '@/types/agent'

interface WorkflowCanvasProps {
  nodes: Node[]
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>
  edges: Edge[]
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
}

const nodeTypes: NodeTypes = {
  agent: AgentNode,
}

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
}

export function WorkflowCanvas({
  nodes,
  setNodes,
  edges,
  setEdges,
}: WorkflowCanvasProps) {
  const reactFlowInstance = useReactFlow()
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()

      const agentId = event.dataTransfer.getData('application/reactflow')

      if (!agentId) {
        return
      }

      try {
        const response = await axios.get(`/(authenticated)/api/agents/${agentId}`)
        const agent = response.data

        if (!agent) {
          console.error('Agent not found')
          return
        }

        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        })

        const newNode = {
          id: `${agent.id}-${nodes.length + 1}`,
          type: 'agent',
          position,
          data: { agentId: agent.id, label: agent.name },
        }

        setNodes((nds) => nds.concat(newNode))
      } catch (error) {
        console.error('Error fetching agent:', error)
      }
    },
    [nodes, setNodes, reactFlowInstance]
  )

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type === 'agent' && node.data.agentId) {
      setSelectedAgentId(node.data.agentId)
      setIsModalOpen(true)
      // Optionally, fetch the latest config here
    }
  }, [])

  const handleSaveConfig = (updatedConfig: AgentConfig) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id.startsWith(selectedAgentId || '') ? { ...node, data: { ...node.data, ...updatedConfig } } : node
      )
    )
    setIsModalOpen(false)
  }

  // Fetch the agent configuration when a node is selected
  useEffect(() => {
    const fetchAgentConfig = async () => {
      if (selectedAgentId) {
        try {
          const response = await axios.get(`/(authenticated)/api/agents/${selectedAgentId}`)
          setAgentConfig(response.data)
        } catch (error) {
          console.error('Error fetching agent config:', error)
        }
      }
    }

    fetchAgentConfig()
  }, [selectedAgentId])

  return (
    <div className="w-full h-full" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => setNodes((nds) => applyNodeChanges(changes, nds))}
        onEdgesChange={(changes) => setEdges((eds) => applyEdgeChanges(changes, eds))}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
      {selectedAgentId && agentConfig && (
        <AgentConfigModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          agentId={selectedAgentId}
          initialConfig={agentConfig}
          onSave={handleSaveConfig}
        />
      )}
    </div>
  )
}

