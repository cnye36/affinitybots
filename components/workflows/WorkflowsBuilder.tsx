'use client'

import { useState, useCallback, useEffect } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AgentSidebar } from './AgentSidebar'
import { WorkflowCanvas } from './WorkflowCanvas'
import { SidebarTrigger } from './SidebarTrigger'
import axios from 'axios'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useRouter, useSearchParams } from 'next/navigation'

interface Agent {
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
}

interface WorkflowsBuilderProps {
  initialWorkflowId?: string
}

export function WorkflowsBuilder({ initialWorkflowId }: WorkflowsBuilderProps) {
  const router = useRouter()
  const [workflowName, setWorkflowName] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [agents, setAgents] = useState<Agent[]>([])
  const [loadingAgents, setLoadingAgents] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nodes, setNodes] = useState<any[]>([])
  const [edges, setEdges] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load existing workflow if ID is provided
  useEffect(() => {
    const loadWorkflow = async () => {
      if (!initialWorkflowId) return

      setLoading(true)
      try {
        const response = await axios.get(`/(authenticated)/api/workflows?id=${initialWorkflowId}`)
        const workflow = response.data
        setWorkflowName(workflow.name)
        setNodes(workflow.nodes)
        setEdges(workflow.edges)
      } catch (err: any) {
        console.error('Error loading workflow:', err)
        if (err.response?.status === 404) {
          toast.error('Workflow not found')
          router.push('/workflows')
          return
        }
        if (err.response?.status === 401) {
          toast.error('Please sign in to continue')
          router.push('/auth/login')
          return
        }
        toast.error('Error loading workflow')
      } finally {
        setLoading(false)
      }
    }

    loadWorkflow()
  }, [initialWorkflowId, router])

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await axios.get('/(authenticated)/api/agents')
        setAgents(response.data.agents)
      } catch (err: any) {
        console.error('Error fetching agents:', err)
        if (err.response?.status === 401) {
          toast.error('Please sign in to continue')
          router.push('/auth/login')
          return
        }
        setError('Failed to load agents.')
      } finally {
        setLoadingAgents(false)
      }
    }

    fetchAgents()
  }, [router])

  const handleSave = async () => {
    if (saving) return // Prevent double submission
    
    if (!workflowName.trim()) {
      toast.error('Please enter a workflow name')
      return
    }

    if (nodes.length === 0) {
      toast.error('Workflow must contain at least one agent.')
      return
    }

    const saveToast = toast.loading('Saving workflow...')
    setSaving(true)

    try {
      const workflowData = {
        name: workflowName.trim(),
        nodes: nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            label: agents.find(a => a.id === node.data.agentId)?.name || node.data.label
          }
        })),
        edges,
      }

      if (initialWorkflowId) {
        // Update existing workflow
        const response = await axios.put('/(authenticated)/api/workflows', {
          ...workflowData,
          id: initialWorkflowId
        })
        
        if (response.data && response.data.id) {
          toast.update(saveToast, {
            render: 'Workflow updated successfully',
            type: 'success',
            isLoading: false,
            autoClose: 3000
          })
          
          // Update the local state with the saved workflow data
          setNodes(response.data.nodes)
          setEdges(response.data.edges)
        } else {
          throw new Error('Invalid response from server')
        }
      } else {
        // Create new workflow
        const response = await axios.post('/(authenticated)/api/workflows', workflowData)
        
        if (response.data && response.data.id) {
          toast.update(saveToast, {
            render: 'Workflow saved successfully',
            type: 'success',
            isLoading: false,
            autoClose: 3000
          })
          
          // Update the local state with the saved workflow data
          setNodes(response.data.nodes)
          setEdges(response.data.edges)
          
          // Navigate to the new workflow's page
          router.push(`/workflows/${response.data.id}`)
        } else {
          throw new Error('Invalid response from server')
        }
      }
    } catch (err: any) {
      console.error('Error saving workflow:', err)
      if (err.response?.status === 401) {
        toast.update(saveToast, {
          render: 'Please sign in to save workflows',
          type: 'error',
          isLoading: false,
          autoClose: 5000
        })
        router.push('/auth/login')
        return
      }
      toast.update(saveToast, {
        render: err.response?.data?.error || 'An error occurred while saving the workflow.',
        type: 'error',
        isLoading: false,
        autoClose: 5000
      })
    } finally {
      setSaving(false)
    }
  }

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true)
    setIsSidebarOpen(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
  }, [])

  useEffect(() => {
    if (!isHovering && isSidebarOpen) {
      const timer = setTimeout(() => {
        setIsSidebarOpen(false)
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [isHovering, isSidebarOpen])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-lg">Loading workflow...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col relative">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="flex items-center justify-between p-4 border-b">
        <Input
          placeholder="Enter workflow name"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : (initialWorkflowId ? 'Update Workflow' : 'Save Workflow')}
        </Button>
      </div>
      <div className="flex flex-1 relative">
        <ReactFlowProvider>
          <WorkflowCanvas
            nodes={nodes}
            setNodes={setNodes}
            edges={edges}
            setEdges={setEdges}
          />
        </ReactFlowProvider>
        <SidebarTrigger onHover={handleMouseEnter} />
        <AgentSidebar
          isOpen={isSidebarOpen}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          agents={agents}
          loading={loadingAgents}
          error={error}
        />
      </div>
    </div>
  )
}

