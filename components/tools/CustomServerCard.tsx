"use client";
import { BaseServerCard, BaseServerCardProps } from "./BaseServerCard";
import Link from "next/link";

interface CustomServerCardProps {
  server: any; // Custom server data
  isConfigured?: boolean;
  compact?: boolean;
}

export function CustomServerCard({ server, isConfigured, compact = false }: CustomServerCardProps) {
  const handleCardClick = () => {
    window.location.href = `/tools/${encodeURIComponent(server.qualified_name)}`;
  };

  return (
    <BaseServerCard
      serverType="custom"
      qualifiedName={server.qualified_name}
      displayName={server.display_name || server.qualified_name}
      description={server.description || "Custom MCP server"}
      isConfigured={isConfigured}
      onClick={handleCardClick}
      compact={compact}
    />
  );
}
