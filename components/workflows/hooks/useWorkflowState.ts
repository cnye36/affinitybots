import { useState, useRef } from "react"
import { WorkflowNode } from "@/types/workflow"
import { Edge } from "reactflow"

export function useWorkflowState() {
  const [nodes, setNodes] = useState<WorkflowNode[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [workflowId, setWorkflowId] = useState<string | null>(null)
  const [workflowName, setWorkflowName] = useState("")
  const [workflowType, setWorkflowType] = useState<"sequential" | "orchestrator" | null>(null)
  const [orchestratorConfig, setOrchestratorConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [pendingTask, setPendingTask] = useState<any>(null)
  const [selectedTaskForAgent, setSelectedTaskForAgent] = useState<string | null>(null)
  const [highlightAssistantId, setHighlightAssistantId] = useState<string | null>(null)
  const [isAgentSelectionLoading, setIsAgentSelectionLoading] = useState(false)
  const [shouldOpenOrchestratorConfig, setShouldOpenOrchestratorConfig] = useState(false)

  // Refs
  const createdWorkflowRef = useRef<string | null>(null)

  return {
    // State
    nodes,
    setNodes,
    edges,
    setEdges,
    workflowId,
    setWorkflowId,
    workflowName,
    setWorkflowName,
    workflowType,
    setWorkflowType,
    orchestratorConfig,
    setOrchestratorConfig,
    loading,
    setLoading,
    saving,
    setSaving,
    selectedTaskId,
    setSelectedTaskId,
    activeNodeId,
    setActiveNodeId,
    isExecuting,
    setIsExecuting,
    pendingTask,
    setPendingTask,
    selectedTaskForAgent,
    setSelectedTaskForAgent,
    highlightAssistantId,
    setHighlightAssistantId,
    isAgentSelectionLoading,
    setIsAgentSelectionLoading,
    shouldOpenOrchestratorConfig,
    setShouldOpenOrchestratorConfig,

    // Refs
    createdWorkflowRef,
  }
}
