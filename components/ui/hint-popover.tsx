"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { X, ChevronRight, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const HintPopover = PopoverPrimitive.Root

const HintPopoverTrigger = PopoverPrimitive.Trigger

const HintPopoverAnchor = PopoverPrimitive.Anchor

interface HintPopoverContentProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
  title?: string
  description: string
  showNext?: boolean
  showPrev?: boolean
  showSkip?: boolean
  showDone?: boolean
  onNext?: () => void
  onPrev?: () => void
  onSkip?: () => void
  onClose?: () => void
  onDone?: () => void
  stepNumber?: number
  totalSteps?: number
  align?: "start" | "center" | "end"
  alignOffset?: number
}

const HintPopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  HintPopoverContentProps
>(({ 
  className, 
  title, 
  description, 
  showNext = false, 
  showPrev = false, 
  showSkip = false,
  showDone = false,
  onNext,
  onPrev,
  onSkip,
  onClose,
  onDone,
  stepNumber,
  totalSteps,
  sideOffset = 8,
  align = "center",
  alignOffset = 0,
  ...props 
}, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      align={align}
      alignOffset={alignOffset}
      className={cn(
        "z-[200] w-80 rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between mb-3" style={{ pointerEvents: 'auto' }}>
        <div className="flex-1">
          {title && (
            <h4 className="font-semibold text-sm mb-1">{title}</h4>
          )}
          {stepNumber && totalSteps && (
            <div className="text-xs text-muted-foreground mb-2">
              Step {stepNumber} of {totalSteps}
            </div>
          )}
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        )}
      </div>
      
      <p className="text-sm mb-4 leading-relaxed" style={{ pointerEvents: 'auto' }}>{description}</p>
      
      <div className="flex items-center justify-between" style={{ pointerEvents: 'auto' }}>
        <div className="flex gap-2">
          {showPrev && onPrev && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPrev}
              className="h-8 px-3"
            >
              <ChevronLeft className="h-3 w-3 mr-1" />
              Previous
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          {showSkip && onSkip && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="h-8 px-3 text-muted-foreground hover:text-foreground"
            >
              Skip Tour
            </Button>
          )}
          {showDone && onDone && (
            <Button
              size="sm"
              onClick={onDone}
              className="h-8 px-3"
            >
              Done
            </Button>
          )}
          {showNext && onNext && (
            <Button
              size="sm"
              onClick={onNext}
              className="h-8 px-3"
            >
              Next
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </div>
      
      <PopoverPrimitive.Arrow className="fill-popover" />
    </PopoverPrimitive.Content>
  </PopoverPrimitive.Portal>
))
HintPopoverContent.displayName = PopoverPrimitive.Content.displayName

export { HintPopover, HintPopoverTrigger, HintPopoverContent, HintPopoverAnchor }