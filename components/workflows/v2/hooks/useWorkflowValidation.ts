import { useCallback } from "react"
import { Edge, Connection } from "reactflow"
import { WorkflowNode } from "@/types/workflow"

interface ValidationResult {
  valid: boolean
  reason?: string
}

/**
 * Check if adding an edge would create a cycle in the graph
 */
function wouldCreateCycle(
  sourceId: string,
  targetId: string,
  edges: Edge[]
): boolean {
  // Build adjacency list
  const adjacency = new Map<string, string[]>()
  edges.forEach((edge) => {
    if (!adjacency.has(edge.source)) {
      adjacency.set(edge.source, [])
    }
    adjacency.get(edge.source)!.push(edge.target)
  })

  // Add the proposed edge
  if (!adjacency.has(sourceId)) {
    adjacency.set(sourceId, [])
  }
  adjacency.get(sourceId)!.push(targetId)

  // DFS to detect cycle
  const visited = new Set<string>()
  const recStack = new Set<string>()

  function hasCycle(nodeId: string): boolean {
    visited.add(nodeId)
    recStack.add(nodeId)

    const neighbors = adjacency.get(nodeId) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) {
          return true
        }
      } else if (recStack.has(neighbor)) {
        return true
      }
    }

    recStack.delete(nodeId)
    return false
  }

  // Check all nodes
  for (const nodeId of adjacency.keys()) {
    if (!visited.has(nodeId)) {
      if (hasCycle(nodeId)) {
        return true
      }
    }
  }

  return false
}

/**
 * Validate a connection between two nodes
 */
export function validateConnection(
  sourceNode: WorkflowNode | undefined,
  targetNode: WorkflowNode | undefined,
  edges: Edge[],
  workflowType: "sequential" | "orchestrator" | null
): ValidationResult {
  if (!sourceNode || !targetNode) {
    return { valid: false, reason: "Source or target node not found" }
  }

  // Prevent self-connections
  if (sourceNode.id === targetNode.id) {
    return { valid: false, reason: "Cannot connect a node to itself" }
  }

  // Check if connection already exists
  const connectionExists = edges.some(
    (edge) => edge.source === sourceNode.id && edge.target === targetNode.id
  )
  if (connectionExists) {
    return { valid: false, reason: "Connection already exists" }
  }

  // Enforce single outgoing connection for trigger and task nodes
  // Orchestrator nodes can have multiple outgoing connections
  if (sourceNode.type !== "orchestrator") {
    const hasExistingOutgoing = edges.some((edge) => edge.source === sourceNode.id)
    if (hasExistingOutgoing) {
      return {
        valid: false,
        reason: "Each node can only connect to a single next task",
      }
    }
  }

  // Validate connection types
  const validConnections = [
    sourceNode.type === "trigger" && targetNode.type === "task",
    sourceNode.type === "trigger" && targetNode.type === "orchestrator",
    sourceNode.type === "task" && targetNode.type === "task",
    sourceNode.type === "orchestrator" && targetNode.type === "task",
  ]

  if (!validConnections.some(Boolean)) {
    return {
      valid: false,
      reason: "Cannot connect these node types",
    }
  }

  // Check for cycles
  if (wouldCreateCycle(sourceNode.id, targetNode.id, edges)) {
    return {
      valid: false,
      reason: "Connection would create a cycle",
    }
  }

  return { valid: true }
}

/**
 * Hook for workflow validation utilities
 */
export function useWorkflowValidation(
  nodes: WorkflowNode[],
  edges: Edge[],
  workflowType: "sequential" | "orchestrator" | null
) {
  const isValidConnection = useCallback(
    (connection: Connection): ValidationResult => {
      const sourceNode = nodes.find((n) => n.id === connection.source)
      const targetNode = nodes.find((n) => n.id === connection.target)
      return validateConnection(sourceNode, targetNode, edges, workflowType)
    },
    [nodes, edges, workflowType]
  )

  const canAddOutgoingEdge = useCallback(
    (nodeId: string): boolean => {
      const node = nodes.find((n) => n.id === nodeId)
      if (!node) return false

      // Orchestrator nodes can have multiple outgoing edges
      if (node.type === "orchestrator") return true

      // Trigger and task nodes can only have one outgoing edge
      return !edges.some((e) => e.source === nodeId)
    },
    [nodes, edges]
  )

  const hasOutgoingEdge = useCallback(
    (nodeId: string): boolean => {
      return edges.some((e) => e.source === nodeId)
    },
    [edges]
  )

  const getNodeById = useCallback(
    (id: string): WorkflowNode | undefined => {
      return nodes.find((n) => n.id === id)
    },
    [nodes]
  )

  return {
    isValidConnection,
    canAddOutgoingEdge,
    hasOutgoingEdge,
    getNodeById,
  }
}
