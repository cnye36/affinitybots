"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AgentConfigModal } from "./AgentConfigModal";
import { Settings } from "lucide-react";
import { Assistant } from "@/types/assistant";
import { useOnboarding } from "@/hooks/useOnboarding";

interface AgentConfigButtonProps {
  assistant: Assistant;
}

export function AgentConfigButton({ assistant }: AgentConfigButtonProps) {
  const [open, setOpen] = useState(false);
  const { isActive, getCurrentStep } = useOnboarding();

  // If the config tour is active, force the modal to remain open
  useEffect(() => {
    const step = getCurrentStep();
    const isConfigStep = !!step && step.id.startsWith('config-tab-');
    if (isActive && isConfigStep && !open) {
      setOpen(true);
    }
  }, [isActive, getCurrentStep, open]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Settings className="h-4 w-4" />
        Configure
      </Button>
      <AgentConfigModal 
        open={open} 
        onOpenChange={(next) => {
          // While a tour is active, ignore attempts to close the modal
          if (isActive && next === false) return;
          setOpen(next);
        }} 
        assistant={assistant} 
      />
    </>
  );
}
