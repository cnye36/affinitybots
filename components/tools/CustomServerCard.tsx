"use client";
import { useSearchParams } from "next/navigation";
import { BaseServerCard, BaseServerCardProps } from "./BaseServerCard";
import Link from "next/link";

interface CustomServerCardProps {
  server: any; // Custom server data
  isConfigured?: boolean;
  compact?: boolean;
}

export function CustomServerCard({ server, isConfigured, compact = false }: CustomServerCardProps) {
  const searchParams = useSearchParams();
  
  const handleCardClick = () => {
    // Navigate to server detail page, preserving the current page number
    const page = searchParams.get("page");
    const url = page 
      ? `/tools/${encodeURIComponent(server.server_slug)}?page=${page}`
      : `/tools/${encodeURIComponent(server.server_slug)}`;
    window.location.href = url;
  };

  return (
    <BaseServerCard
      serverType="custom"
      serverName={server.server_slug}
      displayName={server.display_name || server.server_slug}
      description={server.description || "Custom MCP server"}
      isConfigured={isConfigured}
      onClick={handleCardClick}
      compact={compact}
    />
  );
}
