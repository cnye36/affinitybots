"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Bot, Loader2, Sparkles, Wrench, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface AgentCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  {
    icon: Bot,
    title: "Creating Agent Configuration",
    description: "Fine-tuning agent capabilities...",
  },
  {
    icon: Sparkles,
    title: "Assigning Tools",
    description: "Equipping agent with necessary tools...",
  },
  {
    icon: Wrench,
    title: "Generating Agent Avatar",
    description: "Creating a visual representation of your agent...",
  },
  {
    icon: Zap,
    title: "Finalizing Setup",
    description: "Preparing agent for deployment...",
  },
];

export function AgentCreationDialog({
  isOpen,
  onClose,
}: AgentCreationDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 4000); // Change step every 4 seconds

      return () => clearInterval(interval);
    } else {
      setCurrentStep(0);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agent Creation</DialogTitle>
          <DialogDescription>
            Creating your custom AI agent...
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl animate-pulse" />
            <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
          </div>

          <div className="space-y-6 w-full">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isComplete = index < currentStep;

              return (
                <div
                  key={step.title}
                  className={cn(
                    "flex items-start gap-4 transition-opacity duration-200",
                    isActive ? "opacity-100" : "opacity-50"
                  )}
                >
                  <div className="relative">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center border-2",
                        isActive && "border-primary text-primary animate-pulse",
                        isComplete &&
                          "border-green-500 bg-green-500/20 text-green-500",
                        !isActive && !isComplete && "border-muted"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          "absolute left-1/2 top-10 h-8 w-0.5 -translate-x-1/2 bg-muted",
                          isComplete && "bg-green-500"
                        )}
                      />
                    )}
                  </div>
                  <div className="flex-1 pt-2">
                    <h3 className="font-medium leading-none">{step.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
