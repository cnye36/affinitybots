"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";

/**
 * Custom hook that automatically manages sidebar state based on page type:
 * - Collapses when entering detail/workspace pages (agent/workflow with IDs)
 * - Expands when returning to main list pages (agents, workflows, tools, dashboard, etc.)
 * - Allows manual toggling without interference
 */
export function useAutoCollapseSidebar() {
  const pathname = usePathname();
  const { setOpen, state } = useSidebar();
  const hasAutoCollapsed = useRef(false);
  const hasAutoExpanded = useRef(false);

  useEffect(() => {
    // Check if we're in a detail/workspace area (with specific IDs in the path)
    const isDetailPage = pathname?.match(/\/agents\/[^/]+(?:\/|$)/) || 
                        pathname?.match(/\/workflows\/[^/]+(?:\/|$)/) ||
                        (pathname?.match(/\/tools\/[^/]+/) && !pathname?.startsWith('/tools/configured'));
    
    // Check if we're on a main list/overview page
    const isMainPage = pathname === '/agents' || 
                      pathname === '/workflows' || 
                      pathname === '/tools' ||
                      pathname === '/dashboard' ||
                      pathname === '/settings' ||
                      pathname?.startsWith('/tools/configured');
    
    // Auto-collapse when entering a detail page
    if (isDetailPage && state === "expanded" && !hasAutoCollapsed.current) {
      setOpen(false);
      hasAutoCollapsed.current = true;
      hasAutoExpanded.current = false;
    }
    
    // Auto-expand when returning to a main page
    if (isMainPage && state === "collapsed" && !hasAutoExpanded.current) {
      setOpen(true);
      hasAutoExpanded.current = true;
      hasAutoCollapsed.current = false;
    }
    
    // Reset flags when on a different type of page
    if (!isDetailPage && !isMainPage) {
      hasAutoCollapsed.current = false;
      hasAutoExpanded.current = false;
    }
  }, [pathname, setOpen, state]);
}
