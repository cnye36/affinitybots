"use client"

import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AgentSelectModal } from "./AgentSelectModal"
import { TriggerSelectModal } from "./triggers/TriggerSelectModal"
import { TriggerConfigModal } from "./triggers/TriggerConfigModal"
import { TaskSelectionSheet } from "./tasks/TaskSelectionSheet"
import { WorkflowTypeSelector } from "./WorkflowTypeSelector"
import { OrchestratorConfigModal } from "./orchestrator/OrchestratorConfigModal"
import { Assistant } from "@/types/assistant"

interface WorkflowModalsProps {
  // Agent Select Modal
  isAgentSelectOpen: boolean
  setIsAgentSelectOpen: (value: boolean) => void
  setSelectedTaskForAgent: (value: string | null) => void
  setHighlightAssistantId: (value: string | null) => void
  onAgentSelect: (assistant: Assistant) => void | Promise<void>
  assistants: Assistant[]
  loadingAgents: boolean
  isAgentSelectionLoading: boolean
  onCreateAgent: () => void
  highlightAssistantId?: string

  // Trigger Select Modal
  isTriggerSelectOpen: boolean
  setIsTriggerSelectOpen: (value: boolean) => void
  onCreateTrigger: (payload: any) => void

  // Trigger Config Modal
  isTriggerConfigOpen: boolean
  setIsTriggerConfigOpen: (value: boolean) => void
  workflowId: string | null
  selectedTriggerId: string | null

  // Task Selection Sheet (Mobile)
  isMobile: boolean
  isTaskSheetOpen: boolean
  setIsTaskSheetOpen: (value: boolean) => void
  onTaskSelect: (task: any) => void

  // Workflow Type Selector
  isTypeSelectionOpen: boolean
  setIsTypeSelectionOpen: (value: boolean) => void
  onSelectType: (type: "sequential" | "orchestrator") => void

  // Orchestrator Config Modal
  isOrchestratorConfigOpen: boolean
  setIsOrchestratorConfigOpen: (value: boolean) => void
  orchestratorConfig: any
  onSaveOrchestratorConfig: (config: any) => void

  // Creating Workflow Dialog
  isCreatingWorkflow: boolean
  workflowType: "sequential" | "orchestrator" | null
}

export function WorkflowModals({
  isAgentSelectOpen,
  setIsAgentSelectOpen,
  setSelectedTaskForAgent,
  setHighlightAssistantId,
  onAgentSelect,
  assistants,
  loadingAgents,
  isAgentSelectionLoading,
  onCreateAgent,
  highlightAssistantId,
  isTriggerSelectOpen,
  setIsTriggerSelectOpen,
  onCreateTrigger,
  isTriggerConfigOpen,
  setIsTriggerConfigOpen,
  workflowId,
  selectedTriggerId,
  isMobile,
  isTaskSheetOpen,
  setIsTaskSheetOpen,
  onTaskSelect,
  isTypeSelectionOpen,
  setIsTypeSelectionOpen,
  onSelectType,
  isOrchestratorConfigOpen,
  setIsOrchestratorConfigOpen,
  orchestratorConfig,
  onSaveOrchestratorConfig,
  isCreatingWorkflow,
  workflowType,
}: WorkflowModalsProps) {
  const router = useRouter()

  return (
    <>
      <AgentSelectModal
        isOpen={isAgentSelectOpen}
        onClose={() => {
          setIsAgentSelectOpen(false)
          setSelectedTaskForAgent(null)
          setHighlightAssistantId(null)
        }}
        onSelect={onAgentSelect}
        assistants={assistants}
        loading={loadingAgents || isAgentSelectionLoading}
        onCreateAgent={onCreateAgent}
        highlightAssistantId={highlightAssistantId}
      />

      <TriggerSelectModal
        isOpen={isTriggerSelectOpen}
        onClose={() => setIsTriggerSelectOpen(false)}
        onCreate={onCreateTrigger}
      />

      <TriggerConfigModal
        open={isTriggerConfigOpen}
        onOpenChange={(v) => setIsTriggerConfigOpen(v)}
        workflowId={workflowId || ""}
        triggerId={selectedTriggerId}
      />

      {isMobile && (
        <TaskSelectionSheet
          open={isTaskSheetOpen}
          onOpenChange={setIsTaskSheetOpen}
          onTaskSelect={onTaskSelect}
        />
      )}

      <WorkflowTypeSelector
        open={isTypeSelectionOpen}
        onOpenChange={(open) => {
          setIsTypeSelectionOpen(open)
          if (!open && !workflowId) {
            // If user cancels without selecting, redirect to workflows page
            router.push("/workflows")
          }
        }}
        onSelectType={onSelectType}
      />

      <OrchestratorConfigModal
        open={isOrchestratorConfigOpen}
        onOpenChange={setIsOrchestratorConfigOpen}
        workflowId={workflowId || ""}
        initialConfig={orchestratorConfig?.manager}
        onSave={onSaveOrchestratorConfig}
      />

      <Dialog open={isCreatingWorkflow} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Creating Workflow</DialogTitle>
            <DialogDescription>
              Please wait while we set up your new workflow...
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-xl animate-pulse" />
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 relative z-10" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {workflowType === "orchestrator"
                ? "Setting up orchestrator workflow..."
                : "Setting up sequential workflow..."}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
