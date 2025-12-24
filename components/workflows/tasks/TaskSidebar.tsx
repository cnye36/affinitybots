import React from "react";
import { TaskType } from "@/types/workflow";
import { cn } from "@/lib/utils";
import { SiOpenai } from "react-icons/si";
import { X } from "lucide-react";

export interface TaskOption {
  type: TaskType;
  label: string;
  description: string;
}

export const TASK_OPTIONS: TaskOption[] = [
  {
    type: "ai_task",
    label: "AI Agent",
    description: "Execute a task using the agent's capabilities",
  },
];

interface TaskSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskSelect: (task: TaskOption) => void;
}

export function TaskSidebar({
  isOpen,
  onClose,
  onTaskSelect,
}: TaskSidebarProps) {
  return (
    <div
      className={cn(
        "fixed right-0 top-[64px] bottom-0 z-50 w-80 transition-transform duration-300 ease-in-out bg-background border-l shadow-lg",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="w-80 h-full bg-background border-l flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Add Agent</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 p-4">
          <div
            className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted/50"
            onClick={() => onTaskSelect(TASK_OPTIONS[0])}
          >
            <div className="h-8 w-8 rounded-md bg-primary/10 text-primary grid place-items-center">
              <SiOpenai className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{TASK_OPTIONS[0].label}</span>
              <span className="text-xs text-muted-foreground">
                {TASK_OPTIONS[0].description}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
