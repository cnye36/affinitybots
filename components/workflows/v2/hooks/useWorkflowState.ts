import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { Edge } from "reactflow"
import { WorkflowNode } from "@/types/workflow"

export type ModalType =
  | "idle"
  | "workflow-type-select"
  | "trigger-select"
  | "trigger-config"
  | "agent-select"
  | "task-config"
  | "orchestrator-config"
  | "task-sheet"

interface ModalState {
  type: ModalType
  payload?: any
}

interface ViewportState {
  x: number
  y: number
  zoom: number
}

interface WorkflowState {
  // Workflow data
  workflowId: string | null
  workflowName: string
  workflowType: "sequential" | "orchestrator" | null
  orchestratorConfig: any

  // Graph data
  nodes: WorkflowNode[]
  edges: Edge[]

  // Selection & interaction
  selectedNodeId: string | null
  activeNodeId: string | null
  highlightAssistantId: string | null

  // Viewport
  viewport: ViewportState | null
  savedViewport: ViewportState | null

  // Modal state
  modalState: ModalState

  // Loading states
  loading: boolean
  saving: boolean
  isExecuting: boolean
  isAgentSelectionLoading: boolean
  isCreatingWorkflow: boolean

  // Pending operations
  pendingTask: any
  selectedTaskForAgent: string | null
  selectedTriggerId: string | null
  shouldOpenOrchestratorConfig: boolean

  // Actions - Workflow
  setWorkflowId: (id: string | null) => void
  setWorkflowName: (name: string) => void
  setWorkflowType: (type: "sequential" | "orchestrator" | null) => void
  setOrchestratorConfig: (config: any) => void

  // Actions - Nodes
  addNode: (node: WorkflowNode) => void
  updateNode: (id: string, updates: Partial<WorkflowNode>) => void
  removeNode: (id: string) => void
  setNodes: (nodes: WorkflowNode[] | ((prev: WorkflowNode[]) => WorkflowNode[])) => void

  // Actions - Edges
  addEdge: (edge: Edge) => void
  removeEdge: (id: string) => void
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void

  // Actions - Selection
  setSelectedNodeId: (id: string | null) => void
  setActiveNodeId: (id: string | null) => void
  setHighlightAssistantId: (id: string | null) => void

  // Actions - Viewport
  setViewport: (viewport: ViewportState | null) => void
  setSavedViewport: (viewport: ViewportState | null) => void

  // Actions - Modal
  openModal: (type: ModalType, payload?: any) => void
  closeModal: () => void

  // Actions - Loading states
  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  setIsExecuting: (executing: boolean) => void
  setIsAgentSelectionLoading: (loading: boolean) => void
  setIsCreatingWorkflow: (creating: boolean) => void

  // Actions - Pending operations
  setPendingTask: (task: any) => void
  setSelectedTaskForAgent: (id: string | null) => void
  setSelectedTriggerId: (id: string | null) => void
  setShouldOpenOrchestratorConfig: (should: boolean) => void

  // Computed/Helper methods
  canAddOutgoingEdge: (nodeId: string) => boolean
  getNode: (id: string) => WorkflowNode | undefined
  hasOutgoingEdge: (nodeId: string) => boolean

  // Reset
  reset: () => void
}

const initialState = {
  workflowId: null,
  workflowName: "",
  workflowType: null,
  orchestratorConfig: null,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  activeNodeId: null,
  highlightAssistantId: null,
  viewport: null,
  savedViewport: null,
  modalState: { type: "idle" as ModalType },
  loading: true,
  saving: false,
  isExecuting: false,
  isAgentSelectionLoading: false,
  isCreatingWorkflow: false,
  pendingTask: null,
  selectedTaskForAgent: null,
  selectedTriggerId: null,
  shouldOpenOrchestratorConfig: false,
}

export const useWorkflowState = create<WorkflowState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Workflow actions
      setWorkflowId: (id) => set({ workflowId: id }),
      setWorkflowName: (name) => set({ workflowName: name }),
      setWorkflowType: (type) => set({ workflowType: type }),
      setOrchestratorConfig: (config) => set({ orchestratorConfig: config }),

      // Node actions
      addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
      updateNode: (id, updates) =>
        set((state) => ({
          nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...updates } as WorkflowNode : n)),
        })),
      removeNode: (id) =>
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== id),
          edges: state.edges.filter((e) => e.source !== id && e.target !== id),
        })),
      setNodes: (nodes) =>
        set((state) => ({
          nodes: typeof nodes === "function" ? nodes(state.nodes) : nodes,
        })),

      // Edge actions
      addEdge: (edge) => set((state) => ({ edges: [...state.edges, edge] })),
      removeEdge: (id) => set((state) => ({ edges: state.edges.filter((e) => e.id !== id) })),
      setEdges: (edges) =>
        set((state) => ({
          edges: typeof edges === "function" ? edges(state.edges) : edges,
        })),

      // Selection actions
      setSelectedNodeId: (id) => set({ selectedNodeId: id }),
      setActiveNodeId: (id) => set({ activeNodeId: id }),
      setHighlightAssistantId: (id) => set({ highlightAssistantId: id }),

      // Viewport actions
      setViewport: (viewport) => set({ viewport }),
      setSavedViewport: (viewport) => set({ savedViewport: viewport }),

      // Modal actions
      openModal: (type, payload) => set({ modalState: { type, payload } }),
      closeModal: () => set({ modalState: { type: "idle" } }),

      // Loading state actions
      setLoading: (loading) => set({ loading }),
      setSaving: (saving) => set({ saving }),
      setIsExecuting: (executing) => set({ isExecuting: executing }),
      setIsAgentSelectionLoading: (loading) => set({ isAgentSelectionLoading: loading }),
      setIsCreatingWorkflow: (creating) => set({ isCreatingWorkflow: creating }),

      // Pending operations
      setPendingTask: (task) => set({ pendingTask: task }),
      setSelectedTaskForAgent: (id) => set({ selectedTaskForAgent: id }),
      setSelectedTriggerId: (id) => set({ selectedTriggerId: id }),
      setShouldOpenOrchestratorConfig: (should) => set({ shouldOpenOrchestratorConfig: should }),

      // Helper methods
      canAddOutgoingEdge: (nodeId) => {
        const state = get()
        const node = state.nodes.find((n) => n.id === nodeId)
        if (!node) return false

        // Orchestrator nodes can have multiple outgoing edges
        if (node.type === "orchestrator") return true

        // Trigger and task nodes can only have one outgoing edge
        return !state.edges.some((e) => e.source === nodeId)
      },

      getNode: (id) => {
        return get().nodes.find((n) => n.id === id)
      },

      hasOutgoingEdge: (nodeId) => {
        return get().edges.some((e) => e.source === nodeId)
      },

      // Reset
      reset: () => set(initialState),
    }),
    { name: "WorkflowState" }
  )
)
