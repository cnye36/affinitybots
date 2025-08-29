"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { BaseServerCard } from "./BaseServerCard";
import type { OfficialMcpServerMeta } from "@/lib/mcp/officialMcpServers";
import Link from "next/link";

interface Props {
  server: OfficialMcpServerMeta;
  onConnected?: () => void;
  isConfigured?: boolean;
}

export function OfficialServerCard({ server, onConnected, isConfigured = false }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/mcp/auth/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serverUrl: server.url,
          callbackUrl: `${window.location.origin}/api/mcp/auth/callback`,
          serverName: server.qualifiedName,
        }),
      });
      const data = await res.json();
      if (data?.requiresAuth && data.authUrl) {
        // Redirect to provider auth
        window.location.href = data.authUrl as string;
        return;
      }
      if (!res.ok) throw new Error(data.error || "Failed to connect");
      onConnected?.();
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
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
      <div className="flex items-center justify-between gap-2">
        <Button 
          onClick={handleConnect} 
          disabled={loading} 
          className="flex-1"
          variant={isConfigured ? "secondary" : "default"}
        >
          {loading ? "Connecting…" : isConfigured ? "Configure" : "Connect"}
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


