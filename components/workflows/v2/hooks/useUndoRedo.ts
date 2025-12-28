import { useEffect, useRef, useCallback } from "react"
import { create } from "zustand"
import { Edge } from "reactflow"
import { WorkflowNode } from "@/types/workflow"

interface HistoryState {
  nodes: WorkflowNode[]
  edges: Edge[]
  timestamp: number
}

interface UndoRedoStore {
  past: HistoryState[]
  future: HistoryState[]

  recordState: (nodes: WorkflowNode[], edges: Edge[]) => void
  undo: () => HistoryState | null
  redo: () => HistoryState | null
  canUndo: () => boolean
  canRedo: () => boolean
  clear: () => void
}

const MAX_HISTORY = 50

export const useUndoRedoStore = create<UndoRedoStore>((set, get) => ({
  past: [],
  future: [],

  recordState: (nodes, edges) => {
    const state = get()
    const historyState: HistoryState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      timestamp: Date.now(),
    }

    set({
      past: [...state.past.slice(-MAX_HISTORY + 1), historyState],
      future: [], // Clear future when new action is recorded
    })
  },

  undo: () => {
    const state = get()
    if (state.past.length === 0) return null

    const previous = state.past[state.past.length - 1]
    const newPast = state.past.slice(0, -1)

    set({
      past: newPast,
      future: [previous, ...state.future].slice(0, MAX_HISTORY),
    })

    return previous
  },

  redo: () => {
    const state = get()
    if (state.future.length === 0) return null

    const next = state.future[0]
    const newFuture = state.future.slice(1)

    set({
      past: [...state.past, next].slice(-MAX_HISTORY),
      future: newFuture,
    })

    return next
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  clear: () => set({ past: [], future: [] }),
}))

interface UseUndoRedoOptions {
  nodes: WorkflowNode[]
  edges: Edge[]
  setNodes: (nodes: WorkflowNode[]) => void
  setEdges: (edges: Edge[]) => void
  debounceMs?: number
  enabled?: boolean
}

export function useUndoRedo({
  nodes,
  edges,
  setNodes,
  setEdges,
  debounceMs = 300,
  enabled = true,
}: UseUndoRedoOptions) {
  const { recordState, undo: undoAction, redo: redoAction, canUndo, canRedo } = useUndoRedoStore()
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const isUndoRedoRef = useRef(false)

  // Debounced recording of state changes
  useEffect(() => {
    if (!enabled || isUndoRedoRef.current) {
      isUndoRedoRef.current = false
      return
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      recordState(nodes, edges)
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [nodes, edges, enabled, debounceMs, recordState])

  const undo = useCallback(() => {
    const previousState = undoAction()
    if (previousState) {
      isUndoRedoRef.current = true
      setNodes(previousState.nodes)
      setEdges(previousState.edges)
    }
  }, [undoAction, setNodes, setEdges])

  const redo = useCallback(() => {
    const nextState = redoAction()
    if (nextState) {
      isUndoRedoRef.current = true
      setNodes(nextState.nodes)
      setEdges(nextState.edges)
    }
  }, [redoAction, setNodes, setEdges])

  return {
    undo,
    redo,
    canUndo: canUndo(),
    canRedo: canRedo(),
  }
}

// Keyboard shortcut hook for undo/redo
export function useUndoRedoKeyboard(
  undo: () => void,
  redo: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z (macOS)
      if ((event.ctrlKey || event.metaKey) && event.key === "z" && !event.shiftKey) {
        event.preventDefault()
        undo()
        return
      }

      // Ctrl+Y or Cmd+Y (Windows/Linux) or Ctrl+Shift+Z / Cmd+Shift+Z (macOS)
      if (
        ((event.ctrlKey || event.metaKey) && event.key === "y") ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "z")
      ) {
        event.preventDefault()
        redo()
        return
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [undo, redo, enabled])
}
