import { useCallback } from "react"
import { useWorkflowState, ModalType } from "./useWorkflowState"

interface ModalTransition {
  from: ModalType
  to: ModalType
  payload?: any
}

/**
 * Hook for managing modal flow state machine
 * Provides clean APIs for opening, closing, and navigating modals
 */
export function useModalFlow() {
  const { modalState, openModal, closeModal } = useWorkflowState()

  // Open a specific modal with optional payload
  const open = useCallback(
    (type: ModalType, payload?: any) => {
      openModal(type, payload)
    },
    [openModal]
  )

  // Close current modal and return to idle
  const close = useCallback(() => {
    closeModal()
  }, [closeModal])

  // Check if a specific modal is open
  const isOpen = useCallback(
    (type: ModalType): boolean => {
      return modalState.type === type
    },
    [modalState.type]
  )

  // Get current modal payload
  const getPayload = useCallback(() => {
    return modalState.payload
  }, [modalState.payload])

  return {
    current: modalState.type,
    payload: modalState.payload,
    open,
    close,
    isOpen,
    getPayload,
  }
}

/**
 * Hook for specific modal controls
 */
export function useModalControls() {
  const { open, close, isOpen } = useModalFlow()
  const {
    setSelectedTriggerId,
    setSelectedTaskForAgent,
    setHighlightAssistantId,
  } = useWorkflowState()

  const openWorkflowTypeSelect = useCallback(() => {
    open("workflow-type-select")
  }, [open])

  const openTriggerSelect = useCallback(() => {
    open("trigger-select")
  }, [open])

  const openTriggerConfig = useCallback((triggerId: string) => {
    setSelectedTriggerId(triggerId)
    open("trigger-config", { triggerId })
  }, [open, setSelectedTriggerId])

  const openAgentSelect = useCallback((taskId?: string, highlightId?: string) => {
    if (taskId) setSelectedTaskForAgent(taskId)
    if (highlightId) setHighlightAssistantId(highlightId)
    open("agent-select", { taskId, highlightId })
  }, [open, setSelectedTaskForAgent, setHighlightAssistantId])

  const openTaskConfig = useCallback((taskId: string) => {
    open("task-config", { taskId })
  }, [open])

  const openOrchestratorConfig = useCallback(() => {
    open("orchestrator-config")
  }, [open])

  const openTaskSheet = useCallback(() => {
    open("task-sheet")
  }, [open])

  const closeAll = useCallback(() => {
    setSelectedTriggerId(null)
    setSelectedTaskForAgent(null)
    setHighlightAssistantId(null)
    close()
  }, [close, setSelectedTriggerId, setSelectedTaskForAgent, setHighlightAssistantId])

  return {
    openWorkflowTypeSelect,
    openTriggerSelect,
    openTriggerConfig,
    openAgentSelect,
    openTaskConfig,
    openOrchestratorConfig,
    openTaskSheet,
    close: closeAll,
    isWorkflowTypeSelectOpen: isOpen("workflow-type-select"),
    isTriggerSelectOpen: isOpen("trigger-select"),
    isTriggerConfigOpen: isOpen("trigger-config"),
    isAgentSelectOpen: isOpen("agent-select"),
    isTaskConfigOpen: isOpen("task-config"),
    isOrchestratorConfigOpen: isOpen("orchestrator-config"),
    isTaskSheetOpen: isOpen("task-sheet"),
  }
}
