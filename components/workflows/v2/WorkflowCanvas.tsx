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
}

const edgeTypes: EdgeTypes = {
  deletable: DeletableEdge,
}

interface WorkflowCanvasProps {
  onAddTask?: (sourceNodeId?: string) => void
  onNodeDelete?: (nodeId: string, workflowTaskId?: string) => Promise<void>
  isExecutionsView?: boolean
}

export function WorkflowCanvas({
  onAddTask,
  onNodeDelete,
  isExecutionsView = false,
}: WorkflowCanvasProps) {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    activeNodeId,
    setActiveNodeId,
    workflowType,
    workflowId,
    removeEdge,
    removeNode,
  } = useWorkflowState()

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
      for (const node of nodesToDelete as WorkflowNode[]) {
        if (onNodeDelete && node.type === "task" && node.data.workflow_task_id) {
          await onNodeDelete(node.id, node.data.workflow_task_id)
        }
      }
    },
    [onNodeDelete]
  )

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
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
    [isValidConnection, setEdges]
  )

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      // Handle selection changes - ensure active node is updated correctly
      changes.forEach((change) => {
        if (change.type === "select" && setActiveNodeId) {
          if (change.selected) {
            // Node was selected - set it as active
            setActiveNodeId(change.id)
          } else if (activeNodeId === change.id) {
            // Currently active node was deselected - clear active state
            setActiveNodeId(null)
          }
        }
      })

      setNodes((nds) =>
        applyNodeChanges(changes, nds as Parameters<typeof applyNodeChanges>[1]) as WorkflowNode[]
      )
    },
    [setNodes, setActiveNodeId, activeNodeId]
  )

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => applyEdgeChanges(changes, eds))
    },
    [setEdges]
  )

  const onNodeDragStop: NodeDragHandler = useCallback(
    (_event, node) => {
      const snappedPosition = snapPosition(node.position)
      setNodes((nds) =>
        nds.map((n) =>
          n.id === node.id ? { ...n, position: snappedPosition } : n
        )
      )
    },
    [snapPosition, setNodes]
  )

  const handleEdgeDelete = useCallback(
    (edgeId: string) => {
      removeEdge(edgeId)
    },
    [removeEdge]
  )

  // Handle node deletion from delete button
  const handleNodeDelete = useCallback(
    async (nodeId: string, workflowTaskId?: string) => {
      if (onNodeDelete && workflowTaskId) {
        await onNodeDelete(nodeId, workflowTaskId)
      }
      removeNode(nodeId)
    },
    [onNodeDelete, removeNode]
  )

  // Handle trigger deletion
  const handleTriggerDelete = useCallback(
    async (nodeId: string, triggerId: string) => {
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
    [removeNode, toast, workflowId]
  )

  // Handle orchestrator deletion (clears orchestrator config)
  const handleOrchestratorDelete = useCallback(
    async (nodeId: string) => {
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
    [removeNode, toast, workflowId]
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

      if (node.type === "task" && node.data.workflow_task_id) {
        onDeleteHandler = () => handleNodeDelete(node.id, node.data.workflow_task_id)
      } else if (node.type === "trigger" && node.data.trigger_id) {
        onDeleteHandler = () => handleTriggerDelete(node.id, node.data.trigger_id)
      } else if (node.type === "orchestrator") {
        onDeleteHandler = () => handleOrchestratorDelete(node.id)
      }

      return {
        ...node,
        data: {
          ...node.data,
          isActive: node.id === activeNodeId,
          onAddTask: canAdd ? () => onAddTask?.(node.id) : undefined,
          workflowType: workflowType || undefined,
          onDelete: onDeleteHandler,
        },
      }
    })
  }, [nodes, edges, activeNodeId, onAddTask, workflowType, handleNodeDelete, handleTriggerDelete, handleOrchestratorDelete])

  // Prepare edges with delete handler
  const edgesWithData = useMemo(() => {
    return edges.map((edge) => ({
      ...edge,
      type: "deletable",
      data: {
        ...edge.data,
        onDelete: handleEdgeDelete,
      },
    }))
  }, [edges, handleEdgeDelete])

  return (
    <div className="absolute inset-0">
      <ReactFlow
        nodes={nodesWithData}
        edges={edgesWithData}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={onNodesDelete}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        snapToGrid={true}
        snapGrid={[GRID_SIZE, GRID_SIZE]}
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
        deleteKeyCode={["Backspace", "Delete"]}
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
      </ReactFlow>
    </div>
  )
}
