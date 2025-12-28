import { useState } from "react"

export function useModalState() {
  const [isTaskSidebarOpen, setIsTaskSidebarOpen] = useState(false)
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false)
  const [isTriggerSelectOpen, setIsTriggerSelectOpen] = useState(false)
  const [isTriggerConfigOpen, setIsTriggerConfigOpen] = useState(false)
  const [isAgentSelectOpen, setIsAgentSelectOpen] = useState(false)
  const [isOrchestratorConfigOpen, setIsOrchestratorConfigOpen] = useState(false)
  const [isTypeSelectionOpen, setIsTypeSelectionOpen] = useState(false)
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false)
  const [selectedTriggerId, setSelectedTriggerId] = useState<string | null>(null)

  return {
    isTaskSidebarOpen,
    setIsTaskSidebarOpen,
    isTaskSheetOpen,
    setIsTaskSheetOpen,
    isTriggerSelectOpen,
    setIsTriggerSelectOpen,
    isTriggerConfigOpen,
    setIsTriggerConfigOpen,
    isAgentSelectOpen,
    setIsAgentSelectOpen,
    isOrchestratorConfigOpen,
    setIsOrchestratorConfigOpen,
    isTypeSelectionOpen,
    setIsTypeSelectionOpen,
    isCreatingWorkflow,
    setIsCreatingWorkflow,
    selectedTriggerId,
    setSelectedTriggerId,
  }
}
