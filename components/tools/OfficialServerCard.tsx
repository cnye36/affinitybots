"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { BaseServerCard } from "./BaseServerCard";
import type { OfficialMcpServerMeta } from "@/lib/mcp/officialMcpServers";
// Link not needed; navigation handled via card click

interface Props {
  server: OfficialMcpServerMeta;
  onConnected?: () => void;
  isConfigured?: boolean;
}

export function OfficialServerCard({ server, onConnected, isConfigured = false }: Props) {
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
        body: JSON.stringify({ serverName: server.qualifiedName }),
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
    // Navigate to server detail page
    window.location.href = `/tools/${encodeURIComponent(server.qualifiedName)}`;
  };

  return (
    <BaseServerCard
      serverType="official"
      qualifiedName={server.qualifiedName}
      displayName={server.displayName}
      description={server.description || "Official MCP server"}
      logoUrl={server.logoUrl}
      isConfigured={isConfigured}
      onClick={handleCardClick}
    >
      {error && (
        <div className="mb-3 text-xs text-red-500 text-center">{error}</div>
      )}
      <div className="flex items-center justify-end gap-2">
        <Button
          onClick={handleDisconnect}
          disabled={disconnecting}
          variant="outline"
        >
          {disconnecting ? "Disconnecting…" : "Disconnect"}
        </Button>
        {server.docsUrl && (
          <Button variant="outline" asChild>
            <a href={server.docsUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </BaseServerCard>
  );
}


