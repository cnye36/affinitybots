"use client";

import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useAgentConfigSidebar } from "@/contexts/AgentConfigSidebarContext";

export function AgentConfigButton() {
  const { openSidebar } = useAgentConfigSidebar();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={openSidebar}
      className="gap-2"
    >
      <Settings className="h-4 w-4" />
      Configure
    </Button>
  );
}
