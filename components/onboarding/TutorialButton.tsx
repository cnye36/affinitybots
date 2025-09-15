"use client"

import { useEffect, useState } from "react"
import { HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useOnboarding, dashboardTutorialSteps, newAgentTutorialSteps } from "@/hooks/useOnboarding"

export function TutorialButton() {
  const { startTour, isActive } = useOnboarding()
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('onboarding-completed')
    setShowButton(true)
  }, [])

  if (!showButton || isActive) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => startTour(dashboardTutorialSteps)}
        className="shadow-lg"
      >
        <HelpCircle className="mr-2 h-4 w-4" />
        Dashboard Tour
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => startTour(newAgentTutorialSteps)}
        className="shadow-lg"
      >
        <HelpCircle className="mr-2 h-4 w-4" />
        New Agent Tour
      </Button>
    </div>
  )
}