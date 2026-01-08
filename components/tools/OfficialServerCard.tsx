"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { BaseServerCard } from "./BaseServerCard";
import type { OfficialMcpServerMeta } from "@/lib/mcp/officialMcpServers";
// Link not needed; navigation handled via card click

interface Props {
  server: OfficialMcpServerMeta;
  onConnected?: () => void;
  isConfigured?: boolean;
  compact?: boolean;
}

export function OfficialServerCard({ server, onConnected, isConfigured = false, compact = false }: Props) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  // Connect flow removed from card; users click into detail to connect

  async function handleDisconnect(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      setDisconnecting(true);
      setError(null);
      const res = await fetch("/api/mcp/auth/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverName: server.serverName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to disconnect");
      onConnected?.();
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setDisconnecting(false);
    }
  }

  const handleCardClick = () => {
    // Navigate to server detail page, preserving the current page number
    const page = searchParams.get("page");
    const url = page 
      ? `/tools/${encodeURIComponent(server.serverName)}?page=${page}`
      : `/tools/${encodeURIComponent(server.serverName)}`;
    window.location.href = url;
  };

  return (
    <BaseServerCard
      serverType="official"
      serverName={server.serverName}
      displayName={server.displayName}
      description={server.description || "Official MCP server"}
      logoUrl={server.logoUrl}
      logoUrlLight={server.logoUrlLight}
      logoUrlDark={server.logoUrlDark}
      category={server.category}
      isConfigured={isConfigured}
      onClick={handleCardClick}
      compact={compact}
    >
      {error && (
        <div className="mb-3 text-xs text-red-500 text-center">{error}</div>
      )}
      
    </BaseServerCard>
  );
}


