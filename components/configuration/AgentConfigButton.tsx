"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AgentConfigModal } from "./AgentConfigModal";
import { Settings } from "lucide-react";
import { Assistant } from "@/types/assistant";

interface AgentConfigButtonProps {
  assistant: Assistant;
}

export function AgentConfigButton({ assistant }: AgentConfigButtonProps) {
  const [open, setOpen] = useState(false);

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
      <AgentConfigModal open={open} onOpenChange={setOpen} assistant={assistant} />
    </>
  );
}
