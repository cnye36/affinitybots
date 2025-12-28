import { useCallback } from "react"
import { WorkflowNode } from "@/types/workflow"

export const GRID_SIZE = 20

interface Position {
  x: number
  y: number
}

/**
 * Snap a position to the grid
 */
export function snapToGrid(position: Position, gridSize: number = GRID_SIZE): Position {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  }
}

/**
 * Hook for grid snapping utilities
 */
export function useSnapToGrid(gridSize: number = GRID_SIZE) {
  const snapPosition = useCallback(
    (position: Position): Position => {
      return snapToGrid(position, gridSize)
    },
    [gridSize]
  )

  const snapNode = useCallback(
    (node: WorkflowNode): WorkflowNode => {
      return {
        ...node,
        position: snapToGrid(node.position, gridSize),
      }
    },
    [gridSize]
  )

  const snapNodes = useCallback(
    (nodes: WorkflowNode[]): WorkflowNode[] => {
      return nodes.map((node) => snapNode(node))
    },
    [snapNode]
  )

  return {
    snapPosition,
    snapNode,
    snapNodes,
    gridSize,
  }
}
