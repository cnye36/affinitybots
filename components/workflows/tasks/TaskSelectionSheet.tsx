"use client"

import { SiOpenai } from "react-icons/si"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { TASK_OPTIONS, TaskOption } from "./TaskSidebar"

interface TaskSelectionSheetProps {
  open: boolean
  onOpenChange: (value: boolean) => void
  onTaskSelect: (task: TaskOption) => void
}

export function TaskSelectionSheet({
  open,
  onOpenChange,
  onTaskSelect,
}: TaskSelectionSheetProps) {
  const handleSelect = (task: TaskOption) => {
    onTaskSelect(task)
    onOpenChange(false)
  }

  const renderButton = (task: TaskOption) => (
    <Button
      key={task.type}
      variant="outline"
      className="w-full justify-start gap-3 py-6"
      onClick={() => handleSelect(task)}
    >
      <div className="h-10 w-10 rounded-md bg-primary/10 text-primary grid place-items-center">
        <SiOpenai className="h-5 w-5" />
      </div>
      <div className="flex flex-col items-start text-left">
        <span className="text-base font-medium leading-none">{task.label}</span>
        <span className="text-xs text-muted-foreground mt-1">{task.description}</span>
      </div>
    </Button>
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[75vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Select task type</SheetTitle>
          <SheetDescription>
            Pick the type of automation step to add next in your workflow.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {TASK_OPTIONS.map((task) => renderButton(task))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export type { TaskOption }
