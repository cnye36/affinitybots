"use client"

import { useCallback, useMemo } from "react"
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  NodeTypes,
  EdgeTypes,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  BackgroundVariant,
  Panel,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
  MarkerType,
  Connection,
  OnNodesDelete,
  NodeDragHandler,
} from "reactflow"
import "reactflow/dist/style.css"
import { toast } from "@/hooks/useToast"
import { WorkflowNode } from "@/types/workflow"
import { MemoizedTaskNode } from "../tasks/TaskNode"
import { TriggerNode } from "../triggers/TriggerNode"
import { OrchestratorNode } from "../orchestrator/OrchestratorNode"
import { OutputNode } from "../outputs/OutputNode"
import { DeletableEdge } from "./edges/DeletableEdge"
import { useWorkflowState } from "./hooks/useWorkflowState"
import { useWorkflowValidation } from "./hooks/useWorkflowValidation"
import { useSnapToGrid, GRID_SIZE } from "./hooks/useSnapToGrid"
import { useUndoRedo, useUndoRedoKeyboard } from "./hooks/useUndoRedo"
import { createClient } from "@/supabase/client"

const nodeTypes: NodeTypes = {
  task: MemoizedTaskNode,
  trigger: TriggerNode,
  orchestrator: OrchestratorNode,
  output: OutputNode,
}

const edgeTypes: EdgeTypes = {
  deletable: DeletableEdge,
}

interface WorkflowCanvasProps {
  onAddTask?: (sourceNodeId?: string) => void
  onNodeDelete?: (nodeId: string, workflowTaskId?: string) => Promise<void>
  isExecutionsView?: boolean
  overrideNodes?: WorkflowNode[]
  overrideEdges?: any[]
  overrideActiveNodeId?: string | null
  onNodeClick?: (nodeId: string) => void
}

export function WorkflowCanvas({
  onAddTask,
  onNodeDelete,
  isExecutionsView = false,
  overrideNodes,
  overrideEdges,
  overrideActiveNodeId,
  onNodeClick,
}: WorkflowCanvasProps) {
  const workflowState = useWorkflowState()

  // Use override props in executions view, otherwise use global state
  const nodes = overrideNodes ?? workflowState.nodes
  const edges = overrideEdges ?? workflowState.edges
  const setNodes = workflowState.setNodes
  const setEdges = workflowState.setEdges
  const activeNodeId = overrideActiveNodeId ?? workflowState.activeNodeId
  const setActiveNodeId = workflowState.setActiveNodeId
  const workflowType = workflowState.workflowType
  const workflowId = workflowState.workflowId
  const removeEdge = workflowState.removeEdge
  const removeNode = workflowState.removeNode

  const { snapPosition } = useSnapToGrid(GRID_SIZE)
  const { isValidConnection, canAddOutgoingEdge } = useWorkflowValidation(
    nodes,
    edges,
    workflowType
  )

  // Undo/Redo setup
  const { undo, redo, canUndo, canRedo } = useUndoRedo({
    nodes,
    edges,
    setNodes,
    setEdges,
    debounceMs: 300,
    enabled: !isExecutionsView,
  })
  useUndoRedoKeyboard(undo, redo, !isExecutionsView)

  const onNodesDelete = useCallback(
    async (nodesToDelete: Parameters<OnNodesDelete>[0]) => {
      if (isExecutionsView) return
      for (const node of nodesToDelete as WorkflowNode[]) {
        if (onNodeDelete && node.type === "task" && node.data.workflow_task_id) {
          await onNodeDelete(node.id, node.data.workflow_task_id)
        }
      }
    },
    [onNodeDelete, isExecutionsView]
  )

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (isExecutionsView) return
      const validation = isValidConnection(connection)
      if (!validation.valid) {
        toast({
          title: "Invalid Connection",
          description: validation.reason,
          variant: "destructive",
        })
        return
      }

      setEdges((eds) => addEdge(connection, eds))
    },
    [isValidConnection, setEdges, isExecutionsView]
  )

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      if (isExecutionsView) return
      // Handle selection changes first - sync with active node before applying changes
      // This ensures that clicking any node (even already-selected ones) activates it
      changes.forEach((change) => {
        if (change.type === "select" && setActiveNodeId) {
          if (change.selected) {
            // Node was selected - always set it as active (works even for already-selected nodes)
            // This ensures clicking backwards through nodes always works with single click
            setActiveNodeId(change.id)
          } else if (activeNodeId === change.id && !change.selected) {
            // Currently active node was deselected - clear active state
            setActiveNodeId(null)
          }
        }
      })

      // Apply node changes after handling selection
      setNodes((nds) =>
        applyNodeChanges(changes, nds as Parameters<typeof applyNodeChanges>[1]) as WorkflowNode[]
      )
    },
    [setNodes, setActiveNodeId, activeNodeId, isExecutionsView]
  )

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      if (isExecutionsView) return
      setEdges((eds) => applyEdgeChanges(changes, eds))
    },
    [setEdges, isExecutionsView]
  )

  const onNodeDragStop: NodeDragHandler = useCallback(
    (_event, node) => {
      if (isExecutionsView) return
      const snappedPosition = snapPosition(node.position)
      setNodes((nds) =>
        nds.map((n) =>
          n.id === node.id ? { ...n, position: snappedPosition } : n
        )
      )
    },
    [snapPosition, setNodes, isExecutionsView]
  )

  const handleEdgeDelete = useCallback(
    (edgeId: string) => {
      if (isExecutionsView) return
      removeEdge(edgeId)
    },
    [removeEdge, isExecutionsView]
  )

  // Handle node deletion from delete button
  const handleNodeDelete = useCallback(
    async (nodeId: string, workflowTaskId?: string) => {
      if (isExecutionsView) return
      if (onNodeDelete && workflowTaskId) {
        await onNodeDelete(nodeId, workflowTaskId)
      }
      removeNode(nodeId)
    },
    [onNodeDelete, removeNode, isExecutionsView]
  )

  // Handle trigger deletion
  const handleTriggerDelete = useCallback(
    async (nodeId: string, triggerId: string) => {
      if (isExecutionsView) return
      if (!workflowId) {
        toast({
          title: "Error",
          description: "Workflow ID not found",
          variant: "destructive",
        })
        return
      }
      try {
        const response = await fetch(`/api/workflows/${workflowId}/triggers/${triggerId}`, {
          method: "DELETE",
        })
        if (!response.ok) {
          throw new Error("Failed to delete trigger")
        }
        removeNode(nodeId)
        toast({
          title: "Trigger deleted",
          description: "The trigger has been removed from the workflow",
        })
      } catch (error) {
        console.error("Error deleting trigger:", error)
        toast({
          title: "Failed to delete trigger",
          variant: "destructive",
        })
      }
    },
    [removeNode, toast, workflowId, isExecutionsView]
  )

  // Handle orchestrator deletion (clears orchestrator config)
  const handleOrchestratorDelete = useCallback(
    async (nodeId: string) => {
      if (isExecutionsView) return
      if (!workflowId) {
        toast({
          title: "Error",
          description: "Workflow ID not found",
          variant: "destructive",
        })
        return
      }
      try {
        const supabase = createClient()
        // For orchestrator, we just remove the config and the node
        // The workflow itself remains but becomes a sequential workflow
        const { error } = await supabase
          .from("workflows")
          .update({
            orchestrator_config: null,
            workflow_type: "sequential",
          })
          .eq("workflow_id", workflowId)

        if (error) throw error

        removeNode(nodeId)
        toast({
          title: "Orchestrator removed",
          description: "The orchestrator has been removed from the workflow",
        })
      } catch (error) {
        console.error("Error deleting orchestrator:", error)
        toast({
          title: "Failed to remove orchestrator",
          variant: "destructive",
        })
      }
    },
    [removeNode, toast, workflowId, isExecutionsView]
  )

  // Prepare nodes with active state and onAddTask handler
  const nodesWithData = useMemo(() => {
    return nodes.map((node) => {
      const hasOutgoing = edges.some((e) => e.source === node.id)
      let canAdd = false

      if (workflowType === "orchestrator") {
        canAdd = node.type === "orchestrator"
      } else {
        canAdd = (node.type === "trigger" && !hasOutgoing) || (node.type === "task" && !hasOutgoing)
      }

      let onDeleteHandler: (() => void) | undefined = undefined

      if (!isExecutionsView) {
        if (node.type === "task" && node.data.workflow_task_id) {
          onDeleteHandler = () => handleNodeDelete(node.id, node.data.workflow_task_id)
        } else if (node.type === "trigger" && node.data.trigger_id) {
          onDeleteHandler = () => handleTriggerDelete(node.id, node.data.trigger_id)
        } else if (node.type === "orchestrator") {
          onDeleteHandler = () => handleOrchestratorDelete(node.id)
        }
      }

      return {
        ...node,
        // Don't set selected prop - let ReactFlow handle selection naturally
        // We'll sync activeNodeId via onNodeClick and onNodesChange
        data: {
          ...node.data,
          isActive: node.id === activeNodeId,
          onAddTask: !isExecutionsView && canAdd ? () => onAddTask?.(node.id) : undefined,
          workflowType: workflowType || undefined,
          onDelete: onDeleteHandler,
        },
      }
    })
  }, [nodes, edges, activeNodeId, onAddTask, workflowType, handleNodeDelete, handleTriggerDelete, handleOrchestratorDelete, isExecutionsView])

  // Prepare edges with delete handler
  const edgesWithData = useMemo(() => {
    if (isExecutionsView) return edges
    return edges.map((edge) => ({
      ...edge,
      type: "deletable",
      data: {
        ...edge.data,
        onDelete: handleEdgeDelete,
      },
    }))
  }, [edges, handleEdgeDelete, isExecutionsView])

  // Handle node clicks - ensure single click always activates the node
  // This handler should always fire when clicking any node, regardless of selection state
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: any) => {
      if (isExecutionsView && onNodeClick) {
        onNodeClick(node.id)
      } else if (!isExecutionsView && setActiveNodeId) {
        // Always set active node on single click, regardless of current selection/active state
        // This ensures clicking backwards through nodes always works with a single click
        // The nodesWithData memo will sync the selected prop, so we just need to update activeNodeId
        setActiveNodeId(node.id)
      }
    },
    [isExecutionsView, onNodeClick, setActiveNodeId]
  )

  return (
    <div className="absolute inset-0">
      <ReactFlow
        nodes={nodesWithData}
        edges={edgesWithData}
        onNodesChange={isExecutionsView ? undefined : onNodesChange}
        onEdgesChange={isExecutionsView ? undefined : onEdgesChange}
        onNodesDelete={isExecutionsView ? undefined : onNodesDelete}
        onConnect={isExecutionsView ? undefined : onConnect}
        onNodeDragStop={isExecutionsView ? undefined : onNodeDragStop}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        snapToGrid={true}
        snapGrid={[GRID_SIZE, GRID_SIZE]}
        nodesDraggable={!isExecutionsView}
        nodesConnectable={!isExecutionsView}
        elementsSelectable={!isExecutionsView}
        defaultEdgeOptions={{
          animated: true,
          style: { strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
        }}
        minZoom={0.1}
        maxZoom={2}
        deleteKeyCode={isExecutionsView ? null : ["Backspace", "Delete"]}
        fitView
        fitViewOptions={{
          padding: 0.5,
          maxZoom: 0.9,
          minZoom: 0.1,
        }}
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={GRID_SIZE} size={1} />

        {/* Instructions Panel */}
        <Panel position="top-center" className="bg-background/60 p-2 rounded-lg shadow-sm border">
          <div className="text-sm text-muted-foreground">
            {isExecutionsView
              ? "Click on a node to view execution details and results."
              : "Add tasks to define your workflow. Press Delete or Backspace to remove nodes and edges."}
          </div>
        </Panel>

        {/* Undo/Redo Panel */}
        {!isExecutionsView && (
          <Panel position="top-left" className="flex gap-2 p-2">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="flex items-center justify-center w-8 h-8 rounded bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed border shadow-sm transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
              </svg>
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="flex items-center justify-center w-8 h-8 rounded bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed border shadow-sm transition-colors"
              title="Redo (Ctrl+Y)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 7v6h-6" />
                <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
              </svg>
            </button>
          </Panel>
        )}

        {/* Add Agent Button */}
        {!isExecutionsView && (
          <Panel position="top-right" className="p-2">
            <button
              onClick={() => onAddTask?.(undefined as any)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg transition-transform hover:scale-105"
              title="Add Agent"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </Panel>
        )}
      </ReactFlow>
    </div>
  )
}
