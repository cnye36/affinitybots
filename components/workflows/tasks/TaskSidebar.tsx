import React from "react";
import { TaskType } from "@/types/workflow";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { SiNotion, SiGoogle, SiOpenai } from "react-icons/si";
import { FaXTwitter } from "react-icons/fa6";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { X } from "lucide-react";

interface TaskOption {
  type: TaskType;
  label: string;
  description: string;
}

const AI_TASKS: TaskOption[] = [
  {
    type: "ai_task",
    label: "AI Task",
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
  const renderTaskGroup = (
    title: string,
    tasks: TaskOption[],
    icon: React.ElementType
  ) => {
    const Icon = icon;
    return (
      <AccordionItem value={title.toLowerCase()}>
        <AccordionTrigger className="px-4">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            <span>{title}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 p-2">
            {tasks.map((task) => (
              <div
                key={task.type}
                className="flex cursor-pointer items-center rounded-md border p-3 hover:bg-muted/50"
                onClick={() => onTaskSelect(task)}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{task.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {task.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <Sidebar
      side="right"
      className={cn(
        "fixed right-0 top-[64px] bottom-0 z-50 w-80 transition-transform duration-300 ease-in-out bg-background border-l shadow-lg",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <SidebarContent className="w-80 h-full bg-background border-l">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-semibold">Add Task</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <Accordion type="single" collapsible className="px-4">
          {/* AI Tasks */}
          {renderTaskGroup("AI Tasks", AI_TASKS, SiOpenai)}

        
        </Accordion>
      </SidebarContent>
    </Sidebar>
  );
}
