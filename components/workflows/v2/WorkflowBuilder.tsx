"use client"

import { useEffect, useCallback, useState, useRef, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ReactFlowProvider } from "reactflow"
import { createClient } from "@/supabase/client"
import { toast } from "@/hooks/useToast"
import { Assistant } from "@/types/assistant"
import { WorkflowNode, TaskType, TriggerType, TaskNodeData } from "@/types/workflow"
import { Edge } from "reactflow"
import { WorkflowCanvas } from "./WorkflowCanvas"
import { WorkflowHeader } from "../WorkflowHeader"
import { WorkflowModals } from "../WorkflowModals"
import { WorkflowExecutions } from "../WorkflowExecutions"
import { useWorkflowState } from "./hooks/useWorkflowState"
import { useModalControls } from "./hooks/useModalFlow"
import { useAutoLayout } from "./hooks/useAutoLayout"

export function WorkflowBuilder() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Memoize supabase client to prevent infinite loops in useEffect dependencies
  const supabase = useMemo(() => createClient(), [])

  const {
    workflowId,
    setWorkflowId,
    workflowName,
    setWorkflowName,
    workflowType,
    setWorkflowType,
    nodes,
    setNodes,
    edges,
    setEdges,
    orchestratorConfig,
    setOrchestratorConfig,
    loading,
    setLoading,
    saving,
    setSaving,
    isExecuting,
    setIsExecuting,
    isCreatingWorkflow,
    setIsCreatingWorkflow,
    selectedTriggerId,
    isAgentSelectionLoading,
    highlightAssistantId,
    setHighlightAssistantId,
    selectedTaskForAgent,
    setSelectedTaskForAgent,
    modalState,
    openModal,
    reset,
  } = useWorkflowState()

  const [isWorkflowActive, setIsWorkflowActive] = useState(false)
  const [triggers, setTriggers] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<"editor" | "executions">("editor")
  const [executionRunId, setExecutionRunId] = useState<string | null>(null)
  const hasOutputNode = useMemo(() => nodes.some((node) => node.type === "output"), [nodes])
  
  // Handle execution parameter from URL
  useEffect(() => {
    const execution = searchParams.get("execution")
    if (execution && workflowId) {
      setExecutionRunId(execution)
      setViewMode("executions")
    } else {
      setExecutionRunId(null)
    }
  }, [searchParams, workflowId])

  const {
    openWorkflowTypeSelect,
    openTriggerSelect,
    openTriggerConfig,
    openAgentSelect,
    openOrchestratorConfig,
    close: closeModals,
    isWorkflowTypeSelectOpen,
    isTriggerSelectOpen,
    isTriggerConfigOpen,
    isAgentSelectOpen,
    isOrchestratorConfigOpen,
    isOutputPanelOpen,
  } = useModalControls()

  const { calculateLayout } = useAutoLayout()

  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [loadingAgents, setLoadingAgents] = useState(true)
  const [configOpenTaskId, setConfigOpenTaskId] = useState<string | null>(null)
  const hasOpenedTypeSelectorRef = useRef(false)
  const isCreatingWorkflowRef = useRef(false)

  // Removed mobile detection - no longer needed since task sheet was removed

  // Listen for task test completions and persist outputs
  useEffect(() => {
    const handleTaskTestCompleted = async (e: Event) => {
      const evt = e as CustomEvent<{
        workflowTaskId: string
        output: { result: unknown; metadata?: Record<string, unknown> }
      }>
      
      if (!evt.detail?.workflowTaskId || !workflowId) return
      
      const { workflowTaskId, output } = evt.detail
      
      try {
        // Update the task's metadata with test output
        const { data: task } = await supabase
          .from("workflow_tasks")
          .select("*")
          .eq("workflow_task_id", workflowTaskId)
          .single()
        
        if (task) {
          const testOutputData = {
            type: output.metadata?.event || "messages/complete",
            result: output.result,
            content: output.metadata?.content || (typeof output.result === "string" ? output.result : JSON.stringify(output.result)),
          }
          
          console.log("[WorkflowBuilder] Saving test output to DB:", {
            workflowTaskId,
            testOutput: testOutputData,
            outputMetadata: output.metadata,
          })
          
          const updatedMetadata = {
            ...(task.metadata || {}),
            testOutput: testOutputData,
            lastTestAt: new Date().toISOString(),
          }
          
          await supabase
            .from("workflow_tasks")
            .update({ metadata: updatedMetadata })
            .eq("workflow_task_id", workflowTaskId)
          
          // Update nodes to propagate previousNodeOutput to downstream nodes
          setNodes((currentNodes) => {
            const sourceNode = currentNodes.find(
              (n) => n.type === "task" && (n.data as any).workflow_task_id === workflowTaskId
            )
            
            if (!sourceNode) return currentNodes
            
            // Get current edges
            const currentEdges = useWorkflowState.getState().edges
            
            // Find all nodes connected downstream from this node
            const downstreamNodeIds = new Set<string>()
            const findDownstream = (nodeId: string) => {
              currentEdges.forEach((edge) => {
                if (edge.source === nodeId && !downstreamNodeIds.has(edge.target)) {
                  downstreamNodeIds.add(edge.target)
                  findDownstream(edge.target)
                }
              })
            }
            findDownstream(sourceNode.id)
            
            // Update downstream nodes with previousNodeOutput
            return currentNodes.map((node) => {
              if (downstreamNodeIds.has(node.id) && node.type === "task") {
                const previousOutput = {
                  result: output.result,
                  metadata: output.metadata,
                }
                return {
                  ...node,
                  data: {
                    ...node.data,
                    previousNodeOutput: previousOutput,
                    previousNodeThreadId: output.metadata?.thread_id as string | undefined,
                    // Also update metadata in node data for persistence
                    metadata: {
                      ...((node.data as any).metadata || {}),
                      previousNodeOutput: previousOutput,
                    },
                  },
                }
              }
              return node
            })
          })
        }
      } catch (error) {
        console.error("Error persisting task test output:", error)
      }
    }
    
    window.addEventListener("taskTestCompleted", handleTaskTestCompleted as EventListener)
    return () => {
      window.removeEventListener("taskTestCompleted", handleTaskTestCompleted as EventListener)
    }
  }, [workflowId, supabase, setNodes])

  useEffect(() => {
    const handleAgentChanged = async (e: Event) => {
      const evt = e as CustomEvent<{ workflowId: string; taskId: string }>
      if (!evt.detail || evt.detail.workflowId !== workflowId) return

      const startNodeId = `task-${evt.detail.taskId}`
      const downstreamNodeIds = new Set<string>()
      const queue: string[] = [startNodeId]
      downstreamNodeIds.add(startNodeId)

      while (queue.length > 0) {
        const nodeId = queue.shift()
        if (!nodeId) continue
        edges.forEach((edge) => {
          if (edge.source === nodeId && !downstreamNodeIds.has(edge.target)) {
            downstreamNodeIds.add(edge.target)
            queue.push(edge.target)
          }
        })
      }

      const nodesSnapshot = useWorkflowState.getState().nodes
      const taskUpdates = nodesSnapshot
        .filter((node) => node.type === "task" && downstreamNodeIds.has(node.id))
        .map((node) => {
          const metadata = ((node.data as any).metadata || {}) as Record<string, unknown>
          const { testOutput: _testOutput, lastTestAt: _lastTestAt, ...rest } = metadata
          return {
            taskId: (node.data as any).workflow_task_id as string,
            metadata: rest,
          }
        })

      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (node.type !== "task" || !downstreamNodeIds.has(node.id)) return node
          const metadata = ((node.data as any).metadata || {}) as Record<string, unknown>
          const { testOutput: _testOutput, lastTestAt: _lastTestAt, ...rest } = metadata
          const nextData: any = {
            ...node.data,
            metadata: rest,
          }
          if (node.id !== startNodeId) {
            nextData.previousNodeOutput = undefined
            nextData.previousNodeThreadId = undefined
          }
          return {
            ...node,
            data: nextData,
          }
        })
      )

      if (taskUpdates.length === 0) return
      try {
        await Promise.all(
          taskUpdates.map((update) =>
            supabase
              .from("workflow_tasks")
              .update({ metadata: update.metadata })
              .eq("workflow_task_id", update.taskId)
          )
        )
      } catch (error) {
        console.error("Error clearing downstream task outputs:", error)
      }
    }

    window.addEventListener("taskAgentChanged", handleAgentChanged as EventListener)
    return () => {
      window.removeEventListener("taskAgentChanged", handleAgentChanged as EventListener)
    }
  }, [edges, workflowId, supabase, setNodes])

  // Update task nodes when config modal state changes
  useEffect(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.type === "task") {
          return {
            ...node,
            data: {
              ...node.data,
              isConfigOpen: configOpenTaskId === node.data.workflow_task_id,
              onConfigureTask: (taskId: string) => setConfigOpenTaskId(taskId),
              onConfigClose: () => setConfigOpenTaskId(null),
            },
          }
        }
        return node
      })
    )
  }, [configOpenTaskId, setNodes])

  // Propagate previous node output when edges change
  useEffect(() => {
    setNodes((currentNodes) => {
      let didChange = false
      const taskTestOutputs: Record<string, { result: unknown; metadata?: Record<string, unknown> }> = {}
      currentNodes.forEach((node) => {
        if (node.type !== "task") return
        const metadata = (node.data as any)?.metadata
        if (metadata?.testOutput?.result != null) {
          taskTestOutputs[node.data.workflow_task_id] = {
            result: metadata.testOutput.result,
            metadata: metadata.testOutput.metadata,
          }
        }
      })

      const nextNodes = currentNodes.map((node) => {
        if (node.type !== "task") return node
        const incomingEdge = edges.find((edge) => edge.target === node.id)
        if (!incomingEdge) {
          const hadOutput = (node.data as any)?.previousNodeOutput != null
          const hadThread = (node.data as any)?.previousNodeThreadId != null
          if (!hadOutput && !hadThread) return node
          didChange = true
          return {
            ...node,
            data: {
              ...node.data,
              previousNodeOutput: undefined,
              previousNodeThreadId: undefined,
            },
          }
        }

        const sourceNode = currentNodes.find((n) => n.id === incomingEdge.source)
        if (!sourceNode || sourceNode.type !== "task") return node

        const sourceTaskId = sourceNode.data.workflow_task_id
        const output = taskTestOutputs[sourceTaskId] || (sourceNode.data as any)?.previousNodeOutput
        const threadId = output?.metadata?.thread_id || (sourceNode.data as any)?.previousNodeThreadId

        const currentOutput = (node.data as any)?.previousNodeOutput
        const currentThreadId = (node.data as any)?.previousNodeThreadId
        const isSameOutput = currentOutput === output
        const isSameThread = currentThreadId === threadId
        if (isSameOutput && isSameThread) return node

        didChange = true
        return {
          ...node,
          data: {
            ...node.data,
            previousNodeOutput: output,
            previousNodeThreadId: threadId,
          },
        }
      })

      return didChange ? nextNodes : currentNodes
    })
  }, [edges, setNodes])

  // Load assistants
  useEffect(() => {
    async function loadAssistants() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setLoadingAgents(false)
          return
        }

        // Query user_assistants and join with assistant table
        const { data: agentsData, error } = await supabase
          .from("user_assistants")
          .select(
            `
            assistant:assistant (*)
          `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) throw error

        // Extract just the assistant data from the joined results
        const assistants = (agentsData || [])
          .map((ua: any) => ua.assistant)
          .filter((assistant: any) => assistant != null) as Assistant[]

        setAssistants(assistants)
      } catch (error) {
        console.error("Error loading assistants:", error)
      } finally {
        setLoadingAgents(false)
      }
    }
    loadAssistants()
  }, [supabase])

  // Extract workflow ID from URL to use as dependency (prevents unnecessary reloads)
  const urlWorkflowId = searchParams.get("id")

  // Load workflow
  useEffect(() => {
    if (!urlWorkflowId) {
      // Reset state when navigating to new workflow (no id in URL)
      // This ensures we don't carry over state from a previous workflow
      const currentState = useWorkflowState.getState()
      if (currentState.workflowId || currentState.nodes.length > 0 || currentState.edges.length > 0) {
        reset()
        setIsWorkflowActive(false)
        setTriggers([])
        hasOpenedTypeSelectorRef.current = false
        isCreatingWorkflowRef.current = false
      }
      setLoading(false)
      // Only open type selector once on initial mount if no workflow exists
      // Don't open if we're in the middle of creating a workflow (to avoid flickering)
      if (!hasOpenedTypeSelectorRef.current && !useWorkflowState.getState().isCreatingWorkflow) {
        hasOpenedTypeSelectorRef.current = true
        openWorkflowTypeSelect()
      }
      return
    }

    // Skip reload if we're in the middle of creating a workflow and the ID matches what we already have
    // This prevents double-loading when the URL is updated during workflow creation
    if (isCreatingWorkflowRef.current && workflowId === urlWorkflowId) {
      return
    }

    async function loadWorkflow() {
      try {
        setLoading(true)

        // Load workflow
        const { data: workflow, error: workflowError } = await supabase
          .from("workflows")
          .select("*")
          .eq("workflow_id", urlWorkflowId)
          .single()

        if (workflowError) throw workflowError

        setWorkflowId(workflow.workflow_id)
        setWorkflowName(workflow.name)
        setWorkflowType(workflow.workflow_type)
        setOrchestratorConfig(workflow.orchestrator_config)
        setIsWorkflowActive(workflow.is_active || false)

        // Load triggers
        const { data: triggersData, error: triggersError } = await supabase
          .from("workflow_triggers")
          .select("*")
          .eq("workflow_id", urlWorkflowId)

        if (triggersError) throw triggersError

        setTriggers(triggersData || [])

        // If workflow has no triggers, set loading to false early so modals can render
        // This is important for newly created workflows that need trigger selection
        if ((triggersData || []).length === 0) {
          setLoading(false)
        }

        // Build nodes and edges from workflow
        const workflowTypeValue = workflow.workflow_type || "sequential"
        const triggerNodes: WorkflowNode[] = (triggersData || []).map((trigger) => ({
          id: `trigger-${trigger.trigger_id}`,
          type: "trigger" as const,
          position: { x: 100, y: 100 },
          data: {
            trigger_id: trigger.trigger_id,
            name: trigger.name,
            description: trigger.description || "",
            trigger_type: trigger.trigger_type,
            workflow_id: workflow.workflow_id,
            config: trigger.config,
            position: { x: 100, y: 100 },
            status: "idle" as const,
            hasConnectedTask: false,
            onConfigureTrigger: (triggerId: string) => openTriggerConfig(triggerId),
            workflowType: workflowTypeValue,
          },
        }))

        // Load tasks from database to get latest metadata (including test outputs)
        const { data: tasksData } = await supabase
          .from("workflow_tasks")
          .select("*")
          .eq("workflow_id", urlWorkflowId)
          .order("position")
        
        // Create a map of task_id to task data for quick lookup
        const tasksById = new Map(
          (tasksData || []).map((t) => [t.workflow_task_id, t])
        )
        
        const storedNodes = (workflow.nodes || []) as any[]
        const taskNodes: WorkflowNode[] = storedNodes
          .filter((n) => n.type === "task")
          .map((node) => {
            const taskData = tasksById.get(node.data.workflow_task_id)
            // Determine previousNodeOutput from edges and upstream task metadata
            let previousNodeOutput = node.data.previousNodeOutput
            const currentEdges = workflow.edges || []
            const incomingEdge = currentEdges.find((e: any) => e.target === node.id)
            if (incomingEdge) {
              const sourceNode = storedNodes.find((n: any) => n.id === incomingEdge.source)
              if (sourceNode && sourceNode.type === "task") {
                const sourceTask = tasksById.get(sourceNode.data.workflow_task_id)
                if (sourceTask?.metadata?.testOutput) {
                  previousNodeOutput = {
                    result: sourceTask.metadata.testOutput.result,
                    metadata: sourceTask.metadata.testOutput.metadata,
                  }
                }
              }
            }
            
            // Extract assignedAssistant from config if not already in node.data
            const assignedAssistant = node.data.assignedAssistant || 
              (taskData?.config?.assigned_assistant
                ? {
                    id: taskData.config.assigned_assistant.id,
                    name: taskData.config.assigned_assistant.name,
                    avatar: taskData.config.assigned_assistant.avatar,
                  }
                : undefined);
            
            return {
              ...node,
              type: "task" as const,
              data: {
                ...node.data,
                workflow_id: workflow.workflow_id,
                onAssignAssistant: handleAssignAgent,
                onConfigureTask: (taskId: string) => setConfigOpenTaskId(taskId),
                onConfigClose: () => setConfigOpenTaskId(null),
                isConfigOpen: configOpenTaskId === node.data.workflow_task_id,
                status: "idle",
                workflowType: workflowTypeValue,
                previousNodeOutput,
                assignedAssistant,
                // Store task metadata in node data so TaskConfigModal can access it
                metadata: taskData?.metadata || {},
                // Ensure config is properly set
                config: taskData?.config || node.data.config,
              },
            }
          })

        // Load output nodes from stored nodes
        const outputNodes: WorkflowNode[] = storedNodes
          .filter((n) => n.type === "output")
          .map((node) => ({
            ...node,
            type: "output" as const,
            data: {
              ...node.data,
              workflowType: workflowTypeValue,
              onConfigureOutput: (outputId: string) => {
                openModal("output-panel", { outputId })
              },
            },
          }))

        let allNodes = [...triggerNodes, ...taskNodes, ...outputNodes]

        // Add orchestrator node if applicable
        if (workflow.workflow_type === "orchestrator" && workflow.orchestrator_config) {
          allNodes.push({
            id: "orchestrator-manager",
            type: "orchestrator" as const,
            position: { x: 0, y: 0 }, // Temporary position, will be recalculated
            data: {
              workflow_id: workflow.workflow_id,
              name: "Manager Agent",
              model: workflow.orchestrator_config.manager.model,
              system_prompt: workflow.orchestrator_config.manager.system_prompt,
              user_prompt: workflow.orchestrator_config.manager.user_prompt,
              temperature: workflow.orchestrator_config.manager.temperature,
              reasoningEffort: workflow.orchestrator_config.manager.reasoningEffort,
              onConfigure: () => openOrchestratorConfig(),
              orchestratorConfig: workflow.orchestrator_config,
            },
          })
        }

        // Recalculate layout to ensure proper positioning with new flow direction
        const layoutedNodes = calculateLayout(allNodes, workflow.edges || [], {
          workflowType: workflow.workflow_type || "sequential"
        })

        setNodes(layoutedNodes)
        setEdges(workflow.edges || [])

        // If workflow has no triggers and we're not already in a modal flow, open trigger select
        // This handles the case where a workflow was loaded from URL and needs a trigger
        // Only do this if modal is idle (not already showing trigger-select or other modals)
        // Skip if we're in the middle of creating a workflow (handleSelectType already opened it)
        if (triggerNodes.length === 0 && !isCreatingWorkflowRef.current) {
          // Use a small delay to check current modal state (avoid stale closure)
          setTimeout(() => {
            const currentModalState = useWorkflowState.getState().modalState
            // Only open if modal is still idle (not already opened by handleSelectType or other actions)
            if (currentModalState.type === "idle") {
              openTriggerSelect()
            }
          }, 100)
        }
      } catch (error) {
        console.error("Error loading workflow:", error)
        toast({ title: "Failed to load workflow", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }

    loadWorkflow()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlWorkflowId])
  // Note: supabase is memoized and stable, but excluded to be extra safe

  const handleNameBlur = useCallback(async () => {
    if (!workflowId || !workflowName.trim()) return

    try {
      const { error } = await supabase
        .from("workflows")
        .update({
          name: workflowName,
        })
        .eq("workflow_id", workflowId)

      if (error) throw error
    } catch (error) {
      console.error("Error saving workflow name:", error)
      toast({ title: "Failed to save workflow name", variant: "destructive" })
    }
  }, [workflowId, workflowName, supabase])

  const handleAddTask = useCallback((sourceNodeId?: string) => {
    openAgentSelect(sourceNodeId)
  }, [openAgentSelect])

  const handleAssignAgent = useCallback((taskId: string) => {
    openAgentSelect(taskId)
  }, [openAgentSelect])

  const handleAgentSelect = useCallback(
    async (assistant: Assistant) => {
      if (!workflowId) return

      try {
        // Get source node ID if adding from a specific node
        const sourceNodeId = selectedTaskForAgent

        // If the selection came from an existing task, update that task instead of creating a new node
        const currentNodes = useWorkflowState.getState().nodes
        const existingTaskNode = currentNodes.find(
          (node) => node.type === "task" && (node.data as any).workflow_task_id === sourceNodeId
        )

        if (existingTaskNode && existingTaskNode.type === "task") {
          const existingConfig = (existingTaskNode.data as any).config || {}
          const updatedConfig = {
            ...existingConfig,
            assigned_assistant: {
              id: assistant.assistant_id,
              name: assistant.name,
              avatar: assistant.metadata?.agent_avatar,
            },
          }

          const { error } = await supabase
            .from("workflow_tasks")
            .update({
              assistant_id: assistant.assistant_id,
              config: updatedConfig,
            })
            .eq("workflow_task_id", existingTaskNode.data.workflow_task_id)

          if (error) throw error

          setNodes((nodes) =>
            nodes.map((node) => {
              if (node.id !== existingTaskNode.id || node.type !== "task") return node
              return {
                ...node,
                data: {
                  ...node.data,
                  assignedAssistant: {
                    id: assistant.assistant_id,
                    name: assistant.name,
                    avatar: assistant.metadata?.agent_avatar,
                  },
                  config: updatedConfig,
                },
              }
            })
          )

          if (workflowType === "sequential") {
            window.dispatchEvent(
              new CustomEvent("taskAgentChanged", {
                detail: {
                  workflowId,
                  taskId: existingTaskNode.data.workflow_task_id,
                },
              })
            )
          }

          setSelectedTaskForAgent(null)
          closeModals()
          toast({ title: "Agent updated" })
          return
        }

        // Get the next position number
        const { data: lastTask } = await supabase
          .from("workflow_tasks")
          .select("position")
          .eq("workflow_id", workflowId)
          .order("position", { ascending: false })
          .limit(1)
          .maybeSingle()

        const position = lastTask ? lastTask.position + 1 : 0

        // Create task in database
        const { data: task, error } = await supabase
          .from("workflow_tasks")
          .insert({
            workflow_id: workflowId,
            position,
            name: `${assistant.name} Task`,
            description: "",
            task_type: "ai_task" as TaskType,
            config: {
              assigned_assistant: {
                id: assistant.assistant_id,
                name: assistant.name,
                avatar: assistant.metadata?.agent_avatar,
              },
              input: { source: "previous_node", parameters: {} },
              output: { destination: "next_node" },
            },
          })
          .select()
          .single()

        if (error) throw error

        // Get current state for calculations
        const currentEdges = useWorkflowState.getState().edges

        // Check if source node has test output to pass to new node
        let previousNodeOutput: any = undefined
        let previousNodeThreadId: string | undefined = undefined
        
        if (sourceNodeId) {
          const sourceNode = currentNodes.find((n) => n.id === sourceNodeId)
          if (sourceNode && sourceNode.type === "task") {
            // Check if source node has test output in its metadata
            const sourceTaskId = (sourceNode.data as any).workflow_task_id
            if (sourceTaskId) {
              try {
                const { data: sourceTask } = await supabase
                  .from("workflow_tasks")
                  .select("*")
                  .eq("workflow_task_id", sourceTaskId)
                  .single()
                
                if (sourceTask?.metadata?.testOutput) {
                  previousNodeOutput = {
                    result: sourceTask.metadata.testOutput.result,
                    metadata: sourceTask.metadata.testOutput.metadata,
                  }
                  previousNodeThreadId = sourceTask.metadata.testOutput.metadata?.thread_id
                } else if ((sourceNode.data as any).previousNodeOutput) {
                  // Fallback to node data if metadata not yet persisted
                  previousNodeOutput = (sourceNode.data as any).previousNodeOutput
                  previousNodeThreadId = (sourceNode.data as any).previousNodeThreadId
                }
              } catch (error) {
                console.error("Error loading source task output:", error)
                // Fallback to node data
                if ((sourceNode.data as any).previousNodeOutput) {
                  previousNodeOutput = (sourceNode.data as any).previousNodeOutput
                  previousNodeThreadId = (sourceNode.data as any).previousNodeThreadId
                }
              }
            }
          }
        }

        // Create node
        const nodeData: TaskNodeData = {
          workflow_task_id: task.workflow_task_id,
          workflow_id: workflowId,
          name: task.name,
          description: task.description || "",
          task_type: task.task_type,
          assignedAssistant: {
            id: assistant.assistant_id,
            name: assistant.name,
            avatar: assistant.metadata?.agent_avatar,
          },
          config: task.config as any,
          onAssignAssistant: handleAssignAgent,
          onConfigureTask: (taskId: string) => setConfigOpenTaskId(taskId),
          onConfigClose: () => setConfigOpenTaskId(null),
          status: "pending",
          isConfigOpen: false,
          owner_id: "",
          workflowType: workflowType || "sequential",
          previousNodeOutput,
          previousNodeThreadId,
        }

        // Calculate position based on current nodes count
        const newNode: WorkflowNode = {
          id: `task-${task.workflow_task_id}`,
          type: "task",
          position: { x: 300, y: 300 + currentNodes.length * 100 },
          data: nodeData,
        }

        const updatedNodes = [...currentNodes, newNode]
        
        // Create edge from source node to new node if source exists
        let updatedEdges = currentEdges
        if (sourceNodeId) {
          const newEdge: Edge = {
            id: `edge-${sourceNodeId}-${newNode.id}`,
            source: sourceNodeId,
            target: newNode.id,
            type: "custom",
          }
          updatedEdges = [...currentEdges, newEdge]
          // Update edges first
          setEdges(updatedEdges)
        }
        
        // Calculate layout with updated nodes and edges
        const layoutedNodes = calculateLayout(updatedNodes, updatedEdges, { workflowType: workflowType || "sequential" })
        
        // Update nodes with layouted positions
        setNodes(layoutedNodes)
        
        // Save to database asynchronously
        supabase
          .from("workflows")
          .update({ nodes: layoutedNodes, edges: updatedEdges })
          .eq("workflow_id", workflowId)
          .then(({ error }) => {
            if (error) {
              console.error("Error saving nodes to database:", error)
            }
          })

        // Clear selected task for agent
        setSelectedTaskForAgent(null)
        closeModals()
        toast({ title: "Agent added to workflow" })
      } catch (error) {
        console.error("Error adding agent:", error)
        toast({ title: "Failed to add agent", variant: "destructive" })
      }
    },
    [workflowId, nodes, supabase, calculateLayout, setNodes, setEdges, closeModals, handleAssignAgent, selectedTaskForAgent, setSelectedTaskForAgent]
  )

  const handleCreateAgent = useCallback(() => {
    // Get current URL to redirect back after creating agent
    const currentUrl = `/workflows/builder${workflowId ? `?id=${workflowId}` : ""}`
    router.push(`/agents/new?redirect=${encodeURIComponent(currentUrl)}`)
  }, [router, workflowId])

  const handleAddOutputNode = useCallback(async () => {
    if (!workflowId) return
    if (hasOutputNode) {
      toast({
        title: "Output node already added",
        description: "Only one Output node is allowed per workflow.",
        variant: "destructive",
      })
      return
    }

    const outputId = `output-${Date.now()}`
    const newNode: WorkflowNode = {
      id: outputId,
      type: "output",
      position: { x: 650, y: 100 },
      data: {
        id: outputId,
        label: "End",
        description: "Workflow result",
        status: "idle",
        workflowType: workflowType || "sequential",
        onConfigureOutput: (outputNodeId: string) => {
          openModal("output-panel", { outputId: outputNodeId })
        },
      },
    }

    const updatedNodes = [...nodes, newNode]
    const layoutedNodes = calculateLayout(updatedNodes, edges, {
      workflowType: workflowType || "sequential",
    })

    setNodes(layoutedNodes)

    const { error } = await supabase
      .from("workflows")
      .update({ nodes: layoutedNodes })
      .eq("workflow_id", workflowId)

    if (error) {
      console.error("Error saving output node:", error)
      toast({
        title: "Failed to add output node",
        variant: "destructive",
      })
    }
  }, [
    workflowId,
    hasOutputNode,
    nodes,
    edges,
    workflowType,
    calculateLayout,
    setNodes,
    supabase,
    openModal,
  ])

  const handleSaveOrchestratorConfig = useCallback(
    async (config: any) => {
      if (!workflowId) return

      try {
        const fullConfig = {
          manager: config,
        }

        // Update orchestrator node with all config data
        setNodes((nds) =>
          nds.map((node) =>
            node.id === "orchestrator-manager" && node.type === "orchestrator"
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    model: config.model,
                    system_prompt: config.system_prompt,
                    user_prompt: config.user_prompt,
                    temperature: config.temperature,
                    reasoningEffort: config.reasoningEffort,
                    orchestratorConfig: fullConfig, // Keep config in sync
                  },
                }
              : node
          )
        )

        setOrchestratorConfig(fullConfig)

        // Save to database
        await supabase
          .from("workflows")
          .update({
            orchestrator_config: fullConfig,
          })
          .eq("workflow_id", workflowId)

        // Don't close modal or show toast on auto-save - just save silently
        // The modal will stay open for continued editing
      } catch (error) {
        console.error("Error saving orchestrator config:", error)
        toast({
          title: "Failed to save orchestrator config",
          variant: "destructive",
        })
      }
    },
    [workflowId, supabase, setNodes, setOrchestratorConfig, closeModals]
  )

  const handleSelectType = useCallback(
    async (type: "sequential" | "orchestrator") => {
      setWorkflowType(type)
      closeModals()
      setIsCreatingWorkflow(true)
      isCreatingWorkflowRef.current = true

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          setIsCreatingWorkflow(false)
          toast({
            title: "Authentication required",
            description: "Please sign in to create workflows",
            variant: "destructive",
          })
          router.push("/workflows")
          return
        }

        // Create workflow with selected type (always starts inactive)
        const { data: newWorkflow, error } = await supabase
          .from("workflows")
          .insert({
            owner_id: user.id,
            name: "Untitled Workflow",
            workflow_type: type,
            nodes: [],
            edges: [],
            is_active: false,
          })
          .select()
          .single()

        if (error) throw error

        setWorkflowId(newWorkflow.workflow_id)
        setWorkflowName(newWorkflow.name)
        setIsWorkflowActive(newWorkflow.is_active || false)
        setIsCreatingWorkflow(false)

        // Open the trigger select modal immediately
        // Don't update URL yet - wait until trigger is created to avoid race conditions
        // This prevents the workflow loading effect from interfering with the modal
        openTriggerSelect()
      } catch (error) {
        console.error("Error creating workflow:", error)
        setIsCreatingWorkflow(false)
        toast({
          title: "Failed to create workflow",
          variant: "destructive",
        })
        router.push("/workflows")
      }
    },
    [supabase, router, setWorkflowType, setWorkflowId, setWorkflowName, setIsCreatingWorkflow, closeModals, openTriggerSelect]
  )

  const handleCreateTrigger = useCallback(
    async (payload: { trigger_type: TriggerType; name: string; description?: string; config: Record<string, unknown> }) => {
      if (!workflowId) {
        console.log("Cannot create trigger - no workflow ID")
        return
      }

      try {
        const { data: newTrigger, error } = await supabase
          .from("workflow_triggers")
          .insert({
            workflow_id: workflowId,
            name: payload.name,
            description: payload.description,
            trigger_type: payload.trigger_type,
            config: payload.config,
          })
          .select()
          .single()

        if (error) throw error

        // If it's a schedule trigger, register it with BullMQ
        if (payload.trigger_type === "schedule" && payload.config?.cron) {
          try {
            const scheduleRes = await fetch(`/api/scheduler/register`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                triggerId: newTrigger.trigger_id,
                workflowId: workflowId,
                cronExpression: payload.config.cron as string,
                timezone: (payload.config.timezone as string) || "UTC",
                enabled: true,
              }),
            })
            if (!scheduleRes.ok) {
              const errData = await scheduleRes.json()
              console.error("Failed to register schedule:", errData)
              toast({
                title: "Trigger created but schedule registration failed",
                description: "The worker will pick it up on next restart",
                variant: "destructive",
              })
            }
          } catch (schedErr) {
            console.error("Schedule registration error:", schedErr)
          }
        }

        // Create trigger node
        const triggerNode: WorkflowNode = {
          id: `trigger-${newTrigger.trigger_id}`,
          type: "trigger",
          position: { x: 250, y: 100 },
          data: {
            trigger_id: newTrigger.trigger_id,
            name: newTrigger.name,
            description: newTrigger.description || "",
            trigger_type: newTrigger.trigger_type,
            workflow_id: workflowId,
            config: newTrigger.config,
            position: { x: 250, y: 100 },
            status: "idle" as const,
            hasConnectedTask: false,
            onConfigureTrigger: (triggerId: string) => openTriggerConfig(triggerId),
            workflowType: workflowType || "sequential",
          },
        }

        // Create End node
        const endNode: WorkflowNode = {
          id: `output-end`,
          type: "output",
          position: { x: 650, y: 100 },
          data: {
            id: `output-end`,
            label: "End",
            description: "Workflow result",
            status: "idle",
            workflowType: workflowType || "sequential",
            onConfigureOutput: (outputId: string) => {
              openModal("output-panel", { outputId })
            },
          },
        }

        setNodes((nds) => [...nds, triggerNode, endNode])

        // For orchestrator workflows, auto-add the orchestrator node
        if (workflowType === "orchestrator") {
          // Save orchestrator config first with proper model format
          const defaultConfig = {
            manager: {
              model: "openai:gpt-5.2",
              system_prompt: "You are an orchestrator agent responsible for coordinating multiple AI agents to complete tasks efficiently.",
              user_prompt: "Analyze the user's request and delegate tasks to the appropriate agents.",
              temperature: 0.7,
              reasoningEffort: "medium" as const,
            },
          }

          const orchestratorNode: WorkflowNode = {
            id: "orchestrator-manager",
            type: "orchestrator",
            position: { x: 250, y: 300 },
            data: {
              workflow_id: workflowId,
              name: "Manager Agent",
              model: "openai:gpt-5.2",
              system_prompt: "You are an orchestrator agent responsible for coordinating multiple AI agents to complete tasks efficiently.",
              user_prompt: "Analyze the user's request and delegate tasks to the appropriate agents.",
              temperature: 0.7,
              reasoningEffort: "medium",
              onConfigure: () => openOrchestratorConfig(),
              orchestratorConfig: defaultConfig,
            },
          }

          const edge: Edge = {
            id: `edge-${triggerNode.id}-orchestrator-manager`,
            source: triggerNode.id,
            target: "orchestrator-manager",
            type: "custom",
          }

          setNodes((nds) => [...nds, orchestratorNode])
          setEdges((eds) => [...eds, edge])
          setOrchestratorConfig(defaultConfig)

          // Auto-layout for orchestrator workflow
          const layoutedNodes = calculateLayout([triggerNode, orchestratorNode, endNode], [edge], { workflowType: "orchestrator" })
          setNodes(layoutedNodes)

          // Save to DB
          const { error: saveError } = await supabase
            .from("workflows")
            .update({
              orchestrator_config: defaultConfig,
              nodes: layoutedNodes,
              edges: [edge],
            })
            .eq("workflow_id", workflowId)

          if (saveError) {
            console.error("Error saving orchestrator workflow:", saveError)
          }
        } else {
          // Auto-layout for sequential workflow
          const layoutedNodes = calculateLayout([triggerNode, endNode], [], { workflowType: "sequential" })
          setNodes(layoutedNodes)

          // Save to DB and wait for completion
          const { error: saveError } = await supabase
            .from("workflows")
            .update({ nodes: layoutedNodes })
            .eq("workflow_id", workflowId)

          if (saveError) {
            console.error("Error saving sequential workflow:", saveError)
          }
        }

        closeModals()

        // Update URL with workflow ID if not already present
        // This ensures the URL is set after trigger creation, not during workflow creation
        const urlWorkflowId = searchParams.get("id")
        if (!urlWorkflowId && workflowId) {
          // Keep the flag true so the reload guard works
          router.replace(`/workflows/builder?id=${workflowId}`, { scroll: false })
        }

        // Update triggers state
        setTriggers((prev) => [...prev, newTrigger])

        // Reset the creating workflow flag after a short delay to allow guard to work
        setTimeout(() => {
          isCreatingWorkflowRef.current = false
        }, 100)

        toast({ title: "Trigger added to workflow" })

        // If orchestrator workflow, open orchestrator config modal
        if (workflowType === "orchestrator") {
          setTimeout(() => openOrchestratorConfig(), 200)
        }
      } catch (error) {
        console.error("Error creating trigger:", error)
        toast({
          title: "Failed to create trigger",
          variant: "destructive",
        })
      }
    },
    [
      workflowId,
      workflowType,
      supabase,
      setNodes,
      setEdges,
      setOrchestratorConfig,
      calculateLayout,
      closeModals,
      openTriggerConfig,
      openOrchestratorConfig,
      router,
      searchParams,
    ]
  )

  const handleExecute = useCallback(async () => {
    if (!workflowId) return

    // Validate workflow has triggers
    if (!triggers || triggers.length === 0) {
      toast({
        title: "Cannot execute workflow",
        description: "Please add at least one trigger before executing",
        variant: "destructive",
      })
      return
    }

    setIsExecuting(true)
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.type === "task") {
          return {
            ...node,
            data: {
              ...node.data,
              status: "pending" as const,
            },
          } as WorkflowNode
        } else if (node.type === "trigger") {
          return {
            ...node,
            data: {
              ...node.data,
              status: "running" as const,
            },
          } as WorkflowNode
        } else if (node.type === "orchestrator") {
          return {
            ...node,
            data: {
              ...node.data,
              status: "idle" as const,
            },
          } as WorkflowNode
        } else if (node.type === "output") {
          return {
            ...node,
            data: {
              ...node.data,
              status: "running" as const,
            },
          } as WorkflowNode
        }
        return node
      })
    )

    try {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initialPayload: null,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to execute workflow")
      }

      // Handle SSE stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No response body")
      }

      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split("\n\n")
        buffer = events.pop() || ""

        for (const evt of events) {
          const lines = evt.split("\n")
          let eventType: string | null = null
          const dataLines: string[] = []
          for (const line of lines) {
            if (line.startsWith("event:")) eventType = line.slice(6).trim()
            else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart())
          }
          const dataStr = dataLines.join("\n")
          let payload: any = null
          try {
            payload = dataStr ? JSON.parse(dataStr) : null
          } catch {}

          if (eventType === "task-start" && payload?.workflow_task_id) {
            setNodes((nodes) =>
              nodes.map((n) =>
                n.type === "task" && (n.data as any).workflow_task_id === payload.workflow_task_id
                  ? ({
                      ...n,
                      data: {
                        ...n.data,
                        status: "running",
                      },
                    } as WorkflowNode)
                  : n
              )
            )
          }

          if (eventType === "task-complete" && payload?.workflow_task_id) {
            setNodes((nodes) =>
              nodes.map((n) =>
                n.type === "task" && (n.data as any).workflow_task_id === payload.workflow_task_id
                  ? ({
                      ...n,
                      data: {
                        ...n.data,
                        status: "completed",
                      },
                    } as WorkflowNode)
                  : n
              )
            )
            try {
              const event = new CustomEvent("taskTestCompleted", {
                detail: {
                  workflowTaskId: payload.workflow_task_id,
                  output: { result: payload.result, metadata: { thread_id: payload.thread_id } },
                },
              })
              window.dispatchEvent(event)
            } catch {}
          }

        if (eventType === "done") {
            setNodes((nodes) =>
              nodes.map((node) =>
                node.type === "output"
                  ? ({
                      ...node,
                      data: {
                        ...node.data,
                        status: "completed",
                      },
                    } as WorkflowNode)
                  : node
              )
            )
            // Set all trigger nodes to completed status
            setNodes((nodes) =>
              nodes.map((node) =>
                node.type === "trigger"
                  ? ({
                      ...node,
                      data: {
                        ...node.data,
                        status: "completed",
                      },
                    } as WorkflowNode)
                  : node
              )
            )
            toast({
              title: "Workflow executed successfully!",
            })
            return
          }

          if (eventType === "error") {
            setNodes((nodes) =>
              nodes.map((node) =>
                node.type === "output"
                  ? ({
                      ...node,
                      data: {
                        ...node.data,
                        status: "error",
                      },
                    } as WorkflowNode)
                  : node
              )
            )
            // Set all trigger nodes to error status
            setNodes((nodes) =>
              nodes.map((node) =>
                node.type === "trigger"
                  ? ({
                      ...node,
                      data: {
                        ...node.data,
                        status: "error",
                      },
                    } as WorkflowNode)
                  : node
              )
            )
            throw new Error(payload?.error || "Execution failed")
          }
        }
      }
    } catch (error) {
      console.error("Execution error:", error)
      const message = error instanceof Error ? error.message : "Unknown error occurred"
      // Set all trigger nodes to error status
      setNodes((nodes) =>
        nodes.map((node) =>
          node.type === "trigger"
            ? ({
                ...node,
                data: {
                  ...node.data,
                  status: "error",
                },
              } as WorkflowNode)
            : node
        )
      )
      setNodes((nodes) =>
        nodes.map((node) =>
          node.type === "output"
            ? ({
                ...node,
                data: {
                  ...node.data,
                  status: "error",
                },
              } as WorkflowNode)
            : node
        )
      )
      toast({
        title: "Execution failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsExecuting(false)
    }
  }, [workflowId, triggers, setViewMode, setNodes])

  return (
    <div className="flex flex-col h-screen">
      {loading && !isTriggerSelectOpen && !isWorkflowTypeSelectOpen ? (
        <div className="flex items-center justify-center h-screen">Loading...</div>
      ) : (
        <>
          <WorkflowHeader
            workflowName={workflowName}
            setWorkflowName={setWorkflowName}
            onNameBlur={handleNameBlur}
            onExecute={handleExecute}
            onBack={() => router.push("/workflows")}
            executing={isExecuting}
            workflowId={workflowId || undefined}
            mode={viewMode}
            onModeChange={setViewMode}
            workflowType={workflowType || undefined}
            isActive={isWorkflowActive}
            onActiveToggle={(isActive) => setIsWorkflowActive(isActive)}
            onAddOutput={handleAddOutputNode}
            hasOutputNode={hasOutputNode}
          />

          <div className="flex-1 relative">
            {viewMode === "editor" ? (
              <ReactFlowProvider>
                <WorkflowCanvas onAddTask={handleAddTask} />
              </ReactFlowProvider>
            ) : (
              workflowId && <WorkflowExecutions workflowId={workflowId} initialRunId={executionRunId} />
            )}
          </div>
        </>
      )}

      <WorkflowModals
        isAgentSelectOpen={isAgentSelectOpen}
        setIsAgentSelectOpen={(open) => !open && closeModals()}
        setSelectedTaskForAgent={setSelectedTaskForAgent}
        setHighlightAssistantId={setHighlightAssistantId}
        onAgentSelect={handleAgentSelect}
        assistants={assistants}
        loadingAgents={loadingAgents}
        isAgentSelectionLoading={isAgentSelectionLoading}
        onCreateAgent={handleCreateAgent}
        highlightAssistantId={highlightAssistantId || undefined}
        isTriggerSelectOpen={isTriggerSelectOpen}
        setIsTriggerSelectOpen={(open) => !open && closeModals()}
        onCreateTrigger={handleCreateTrigger}
        isTriggerConfigOpen={isTriggerConfigOpen}
        setIsTriggerConfigOpen={(open) => !open && closeModals()}
        workflowId={workflowId}
        selectedTriggerId={selectedTriggerId}
        isTypeSelectionOpen={isWorkflowTypeSelectOpen}
        setIsTypeSelectionOpen={(open) => {
          if (!open) {
            closeModals()
            // If user cancels without creating a workflow, redirect
            if (!workflowId) {
              router.push("/workflows")
            }
          }
        }}
        onSelectType={handleSelectType}
        isOrchestratorConfigOpen={isOrchestratorConfigOpen}
        setIsOrchestratorConfigOpen={(open) => !open && closeModals()}
        orchestratorConfig={orchestratorConfig}
        onSaveOrchestratorConfig={handleSaveOrchestratorConfig}
        isCreatingWorkflow={isCreatingWorkflow}
        workflowType={workflowType}
        isOutputPanelOpen={isOutputPanelOpen}
        setIsOutputPanelOpen={(open) => !open && closeModals()}
        outputNodeId={modalState.payload?.outputId}
      />
    </div>
  )
}
