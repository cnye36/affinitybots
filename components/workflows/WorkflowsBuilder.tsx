'use client'

import { useState, useCallback, useEffect } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AgentSidebar } from './AgentSidebar'
import { WorkflowCanvas } from './WorkflowCanvas'
import { SidebarTrigger } from './SidebarTrigger'

export function WorkflowsBuilder() {
  const [workflowName, setWorkflowName] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  const handleSave = async () => {
    if (!workflowName) {
      alert('Please enter a workflow name')
      return
    }
    // Implement save functionality here
    alert('Workflow saved successfully')
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
      }, 300) // Delay before closing the sidebar

      return () => clearTimeout(timer)
    }
  }, [isHovering, isSidebarOpen])

  return (
    <div className="h-screen flex flex-col relative">
      <div className="flex items-center justify-between p-4 border-b">
        <Input
          placeholder="Enter workflow name"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={handleSave}>Save Workflow</Button>
      </div>
      <div className="flex flex-1 relative">
        <ReactFlowProvider>
          <WorkflowCanvas />
        </ReactFlowProvider>
        <SidebarTrigger onHover={handleMouseEnter} />
        <AgentSidebar
          isOpen={isSidebarOpen}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      </div>
    </div>
  )
}

