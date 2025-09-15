"use client"

import { useEffect, useState, useCallback } from "react"
import { useOnboarding } from "@/hooks/useOnboarding"
import { HintPopover, HintPopoverContent, HintPopoverAnchor } from "@/components/ui/hint-popover"
import { createPortal } from "react-dom"

interface TutorialOverlayProps {
  children: React.ReactNode
}

export function TutorialOverlay({ children }: TutorialOverlayProps) {
  const { isActive, getCurrentStep, nextStep, prevStep, skipTour, endTour, currentStep, steps } = useOnboarding()
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const [mounted, setMounted] = useState(false)

  const currentStepData = getCurrentStep()

  useEffect(() => {
    setMounted(true)
  }, [])

  const updateAnchorRect = useCallback((element: HTMLElement | null) => {
    if (!element) {
      setAnchorRect(null)
      return
    }
    const rect = element.getBoundingClientRect()
    setAnchorRect(rect)
  }, [])

  useEffect(() => {
    if (!isActive || !currentStepData) {
      setTargetElement(null)
      setAnchorRect(null)
      return
    }

    // Clear previous target to avoid visual flicker and stale anchors
    setTargetElement(null)
    setAnchorRect(null)

    const findTarget = () => {
      const element = document.querySelector(currentStepData.target) as HTMLElement | null
      if (element) {
        setTargetElement(element)
        // Do not scroll inside the modal; tabs are already visible

        const rect = element.getBoundingClientRect()
        if (rect.height === 0 || rect.width === 0) {
          setTimeout(findTarget, 100)
        } else {
          setAnchorRect(rect)
          // If step defines an activation selector, click it to switch tabs, etc.
          const selector = (currentStepData as any).activateOnEnterSelector as string | undefined
          if (selector) {
            const activator = document.querySelector(selector) as HTMLElement | null
            if (activator) {
              // Use native click for reliability with component libraries (e.g., Radix Tabs)
              activator.click()
              // After tab change, wait one frame then recalc anchor to avoid flicker
              requestAnimationFrame(() => {
                const newTarget = document.querySelector(currentStepData.target) as HTMLElement | null
                if (newTarget) setAnchorRect(newTarget.getBoundingClientRect())
              })
            }
          }
        }
      } else {
        setTimeout(findTarget, 100)
      }
    }

    const timer = setTimeout(findTarget, 200)

    const handleReposition = () => updateAnchorRect(document.querySelector(currentStepData.target) as HTMLElement | null)
    window.addEventListener('scroll', handleReposition, true)
    window.addEventListener('resize', handleReposition)
    const observer = new MutationObserver(() => handleReposition())
    observer.observe(document.body, { attributes: true, childList: true, subtree: true })

    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', handleReposition, true)
      window.removeEventListener('resize', handleReposition)
      observer.disconnect()
    }
  }, [isActive, currentStepData, updateAnchorRect])

  if (!mounted || !isActive || !currentStepData || !targetElement || !anchorRect) {
    return <>{children}</>
  }

  const tutorialContent = (
    <HintPopover open={isActive}>
      <HintPopoverAnchor 
        style={{
          position: 'fixed',
          top: anchorRect.top,
          left: anchorRect.left,
          width: anchorRect.width,
          height: anchorRect.height,
          pointerEvents: 'none',
          zIndex: 100,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.2)',
          borderRadius: 8,
          outline: '2px solid rgba(59,130,246,0.8)',
          outlineOffset: 2
        }}
      />
      <HintPopoverContent
        title={currentStepData.title}
        description={currentStepData.description}
        showNext={currentStepData.showNext}
        showPrev={currentStepData.showPrev}
        showSkip={currentStepData.showSkip}
        showDone={!currentStepData.showNext}
        onNext={nextStep}
        onPrev={prevStep}
        onSkip={skipTour}
        onClose={endTour}
        onDone={() => {
          const doneSelector = (currentStepData as any).activateOnDoneSelector as string | undefined
          if (doneSelector) {
            const toClick = document.querySelector(doneSelector) as HTMLElement | null
            toClick?.click()
          }
          endTour()
        }}
        stepNumber={currentStep + 1}
        totalSteps={steps.length}
        side={currentStepData.placement || 'bottom'}
        align={(currentStepData as any).align}
        alignOffset={(currentStepData as any).alignOffset}
        sideOffset={(currentStepData as any).sideOffset}
      />
    </HintPopover>
  )

  return (
    <>
      {children}
      {isActive && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 z-[150]"
            style={{ pointerEvents: 'none' }}
          />
          {createPortal(tutorialContent, document.body)}
        </>
      )}
    </>
  )
}