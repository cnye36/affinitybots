"use client"

import { useCallback } from "react"
import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ResetOnboarding() {
  const handleReset = useCallback(() => {
    try {
      localStorage.removeItem('onboarding-completed')
      localStorage.removeItem('onboarding-welcome-seen')
      localStorage.removeItem('onboarding-new-agent-seen')
      localStorage.removeItem('onboarding-agent-page-seen')
      localStorage.removeItem('onboarding-config-tabs-seen')
      window.location.reload()
    } catch (e) {
      // no-op
    }
  }, [])

  return (
    <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleReset}>
      <RotateCcw className="h-4 w-4 mr-2" />
      Reset Tour (test)
    </Button>
  )
}


