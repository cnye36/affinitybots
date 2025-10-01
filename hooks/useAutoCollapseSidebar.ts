"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";

/**
 * Custom hook that automatically collapses the sidebar when entering workspace areas
 * (agents and workflows) to provide more screen real estate, but allows manual reopening
 */
export function useAutoCollapseSidebar() {
  const pathname = usePathname();
  const { setOpen, state } = useSidebar();
  const hasAutoCollapsed = useRef(false);

  useEffect(() => {
    // Check if we're in a workspace area (agent chat or workflow editor/execution)
    const isWorkspaceArea = pathname?.includes('/agents/') || 
                           pathname?.includes('/workflows/');
    
    // Only auto-collapse once when entering a workspace area and sidebar is currently open
    // This prevents re-collapsing if user manually opens the sidebar
    if (isWorkspaceArea && state === "expanded" && !hasAutoCollapsed.current) {
      setOpen(false);
      hasAutoCollapsed.current = true;
    }
    
    // Reset the flag when leaving workspace areas
    if (!isWorkspaceArea) {
      hasAutoCollapsed.current = false;
    }
  }, [pathname, setOpen, state]);
}
