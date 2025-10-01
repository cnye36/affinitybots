"use client";

import { useAutoCollapseSidebar } from "@/hooks/useAutoCollapseSidebar";

interface AutoCollapseWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that handles auto-collapsing the sidebar for workspace areas
 */
export function AutoCollapseWrapper({ children }: AutoCollapseWrapperProps) {
  useAutoCollapseSidebar();
  
  return <>{children}</>;
}
