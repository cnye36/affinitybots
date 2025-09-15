"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useOnboarding, dashboardTutorialSteps } from "@/hooks/useOnboarding"

export function WelcomeModal() {
  const { startTour, isActive } = useOnboarding()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Only show if onboarding not completed and welcome not already seen
    const completed = typeof window !== 'undefined' ? localStorage.getItem('onboarding-completed') : 'true'
    const welcomeSeen = typeof window !== 'undefined' ? localStorage.getItem('onboarding-welcome-seen') : 'true'
    if (!completed && !welcomeSeen) {
      setOpen(true)
    }
  }, [])

  useEffect(() => {
    // If the tour is active, close the welcome modal
    if (isActive) setOpen(false)
  }, [isActive])

  const handleNext = useCallback(() => {
    localStorage.setItem('onboarding-welcome-seen', 'true')
    setOpen(false)
    startTour(dashboardTutorialSteps)
  }, [startTour])

  const handleClose = useCallback(() => {
    localStorage.setItem('onboarding-welcome-seen', 'true')
    setOpen(false)
  }, [])

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to AffinityBots</DialogTitle>
          <DialogDescription>
            Get started by creating your first agent and connecting tools. We’ll guide you through the key areas.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex items-center justify-center">
          <Image
            src="/images/AffinityBots-Icon-Dark-250px.png"
            alt="AffinityBots"
            width={160}
            height={160}
            priority
          />
        </div>
        <DialogFooter>
          <Button onClick={handleNext}>Next</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


