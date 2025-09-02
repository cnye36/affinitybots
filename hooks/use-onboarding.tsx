"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"

export interface TutorialStep {
  id: string
  target: string
  title: string
  description: string
  placement?: "top" | "bottom" | "left" | "right"
  align?: "start" | "center" | "end"
  sideOffset?: number
  alignOffset?: number
  activateOnEnterSelector?: string
  activateOnDoneSelector?: string
  showNext?: boolean
  showPrev?: boolean
  showSkip?: boolean
}

interface OnboardingContextType {
  isActive: boolean
  currentStep: number
  steps: TutorialStep[]
  startTour: (steps: TutorialStep[]) => void
  nextStep: () => void
  prevStep: () => void
  skipTour: () => void
  endTour: () => void
  getCurrentStep: () => TutorialStep | null
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

interface OnboardingProviderProps {
  children: ReactNode
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<TutorialStep[]>([])

  const startTour = useCallback((tutorialSteps: TutorialStep[]) => {
    setSteps(tutorialSteps)
    setCurrentStep(0)
    setIsActive(true)
  }, [])

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      endTour()
    }
  }, [currentStep, steps.length])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const skipTour = useCallback(() => {
    endTour()
  }, [])

  const endTour = useCallback(() => {
    setIsActive(false)
    setCurrentStep(0)
    setSteps([])
    localStorage.setItem('onboarding-completed', 'true')
  }, [])

  const getCurrentStep = useCallback((): TutorialStep | null => {
    return steps[currentStep] || null
  }, [steps, currentStep])

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('onboarding-completed')
    if (!hasCompletedOnboarding) {
    }
  }, [])

  const value: OnboardingContextType = {
    isActive,
    currentStep,
    steps,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    endTour,
    getCurrentStep,
  }

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}

export const dashboardTutorialSteps: TutorialStep[] = [
  {
    id: "create-agent",
    target: "[data-tutorial='create-agent']",
    title: "Create a New Agent",
    description: "Use Quick Actions to create your first AI agent. You'll configure its capabilities and tools.",
    placement: "right",
    showNext: true,
    showPrev: false,
    showSkip: true
  },
  {
    id: "tools-sidebar",
    target: "[data-tutorial='tools-sidebar']",
    title: "Find Tools in the Sidebar",
    description: "Visit Tools to explore, connect, and configure integrations that power your agents.",
    placement: "right",
    showNext: false,
    showPrev: true,
    showSkip: false
  }
]

export const agentPageTutorialSteps: TutorialStep[] = [
  {
    id: "agent-chat-viewport",
    target: "[data-tutorial='agent-chat-viewport']",
    title: "Chat with your Agent",
    description: "View your conversations here. Click a chat to open it or start a new one.",
    placement: "right",
    showNext: true,
    showPrev: false,
    showSkip: true
  },
  {
    id: "agent-attachments",
    target: "[data-tutorial='agent-attachments']",
    title: "Attach Files or Images",
    description: "Use attachments to give your agent images or files for context.",
    placement: "top",
    showNext: true,
    showPrev: true,
    showSkip: true
  },
  {
    id: "agent-new-chat",
    target: "[data-tutorial='agent-new-chat']",
    title: "Start a New Chat",
    description: "Create a fresh conversation anytime to keep topics organized.",
    placement: "right",
    showNext: true,
    showPrev: true,
    showSkip: true
  },
  {
    id: "agent-configure",
    target: "[data-tutorial='agent-configure']",
    title: "Configure Your Agent",
    description: "Use Configure to adjust tools, memory, knowledge, and behavior.",
    placement: "left",
    showNext: false,
    showPrev: true,
    showSkip: false
  }
]

export const configTabsTutorialSteps: TutorialStep[] = [
  {
    id: "config-tab-general",
    target: "[data-tutorial='config-tabs-list']",
    title: "General Settings",
    description: "Update the agent's name, avatar, description, and model.",
    placement: "bottom",
    align: "center",
    sideOffset: 8,
    alignOffset: 0,
    activateOnEnterSelector: "[data-tutorial='config-tab-general']",
    showNext: true,
    showPrev: false,
    showSkip: true
  },
  {
    id: "config-tab-prompt",
    target: "[data-tutorial='config-tabs-list']",
    title: "Prompt",
    description: "Edit the system prompt that guides your agent's behavior.",
    placement: "bottom",
    align: "center",
    sideOffset: 8,
    alignOffset: 0,
    activateOnEnterSelector: "[data-tutorial='config-tab-prompt']",
    showNext: true,
    showPrev: true,
    showSkip: true
  },
  {
    id: "config-tab-tools",
    target: "[data-tutorial='config-tabs-list']",
    title: "Tools",
    description: "Connect and enable external tools your agent can use.",
    placement: "bottom",
    align: "center",
    sideOffset: 8,
    alignOffset: 0,
    activateOnEnterSelector: "[data-tutorial='config-tab-tools']",
    showNext: true,
    showPrev: true,
    showSkip: true
  },
  {
    id: "config-tab-knowledge",
    target: "[data-tutorial='config-tabs-list']",
    title: "Knowledge",
    description: "Upload documents to give your agent reference knowledge.",
    placement: "bottom",
    align: "center",
    sideOffset: 8,
    alignOffset: 0,
    activateOnEnterSelector: "[data-tutorial='config-tab-knowledge']",
    showNext: true,
    showPrev: true,
    showSkip: true
  },
  {
    id: "config-tab-memory",
    target: "[data-tutorial='config-tabs-list']",
    title: "Memory",
    description: "Enable or manage what your agent remembers about you.",
    placement: "bottom",
    align: "center",
    sideOffset: 8,
    alignOffset: 0,
    activateOnEnterSelector: "[data-tutorial='config-tab-memory']",
    activateOnDoneSelector: "[data-tutorial='config-tab-general']",
    showNext: false,
    showPrev: true,
    showSkip: false
  }
]

export const newAgentTutorialSteps: TutorialStep[] = [
  {
    id: "agent-description",
    target: "[data-tutorial='agent-description']",
    title: "Describe Your Agent",
    description: "This is the only required field. Describe what your agent should do, then click Create Agent.",
    placement: "right",
    align: "start",
    sideOffset: 12,
    alignOffset: -8,
    showNext: true,
    showPrev: false,
    showSkip: true
  },
  {
    id: "agent-templates",
    target: "[data-tutorial='agent-templates']",
    title: "Choose a Template (Optional)",
    description: "Pick a template to auto-fill the description with a solid starting point.",
    placement: "top",
    showNext: true,
    showPrev: true,
    showSkip: true
  },
  {
    id: "agent-name",
    target: "[data-tutorial='agent-name']",
    title: "Name Your Agent (Optional)",
    description: "Give your agent a memorable name, or leave it blank to auto-generate one.",
    placement: "bottom",
    showNext: true,
    showPrev: true,
    showSkip: true
  },
  {
    id: "agent-tools",
    target: "[data-tutorial='agent-tools']",
    title: "Add Tools (Optional)",
    description: "Connect external services to extend your agent's capabilities.",
    placement: "right",
    showNext: true,
    showPrev: true,
    showSkip: true
  },
  {
    id: "agent-knowledge",
    target: "[data-tutorial='agent-knowledge']",
    title: "Attach Knowledge (Optional)",
    description: "Upload files or data to give your agent context it can reference.",
    placement: "left",
    showNext: false,
    showPrev: true,
    showSkip: false
  }
]