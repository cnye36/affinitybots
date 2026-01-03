"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OFFICIAL_MCP_SERVERS } from "@/lib/mcp/officialMcpServers";
import { formatRelativeTime } from "@/lib/utils";
import { AddMCPServerModal } from "@/components/tools/AddMCPServerModal";

type ToolMeta = {
  displayName?: string;
  description?: string;
  logoUrl?: string;
};

export default function ConfiguredToolsPage() {
  const [servers, setServers] = useState<any[]>([]);
  const [metaByName, setMetaByName] = useState<Record<string, ToolMeta>>({});
  const [enabledCounts, setEnabledCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [serversRes, assistantsRes, userAddedRes] = await Promise.all([
          fetch('/api/user-mcp-servers'),
          fetch('/api/agents'),
          fetch('/api/user-added-servers'),
        ]);

        const [serversJson, assistantsJson, userAddedJson] = await Promise.all([
          serversRes.json(), assistantsRes.json(), userAddedRes.json()
        ]);

        if (!serversRes.ok) throw new Error(serversJson.error || 'Failed to load configured servers');

        // 1) Only show working/enabled servers; explicitly exclude Notion for now
        const rawServers: any[] = serversJson.servers || [];
        const filtered = (rawServers || [])
          .filter((s) => s?.is_enabled)
          .filter((s) => (s?.server_slug || '').toLowerCase() !== 'notion');
        setServers(filtered);

        // 2) Build enabled counts per server from assistants' configs
        const assistants: any[] = assistantsJson?.assistants || [];
        const counts: Record<string, number> = {};
        for (const a of assistants) {
          const enabled = a?.config?.configurable?.enabled_mcp_servers;
          if (Array.isArray(enabled)) {
            for (const name of enabled) {
              counts[name] = (counts[name] || 0) + 1;
            }
          } else if (enabled && typeof enabled === 'object') {
            for (const [name, val] of Object.entries(enabled)) {
              if ((val as any)?.isEnabled) counts[name] = (counts[name] || 0) + 1;
            }
          }
        }
        setEnabledCounts(counts);

        // 3) Build metadata map from Official + User-added
        const meta: Record<string, ToolMeta> = {};
        for (const s of OFFICIAL_MCP_SERVERS) {
          meta[s.serverName] = {
            displayName: s.displayName,
            description: s.description,
            logoUrl: s.logoUrl,
          };
        }
        const userAdded: any[] = userAddedJson?.servers || [];
        for (const s of userAdded) {
          const q = s?.server_slug;
          if (!q) continue;
          meta[q] = {
            displayName: s.display_name || meta[q]?.displayName || q,
            description: s.description || meta[q]?.description,
            logoUrl: s.logo_url || meta[q]?.logoUrl,
          };
        }
        setMetaByName(meta);
      } catch (e: any) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Configured Tools</h1>
        <Button onClick={() => setAddOpen(true)}>Add Server</Button>
      </div>

      {loading && <div className="text-center py-12 text-lg">Loading configured servers...</div>}
      {error && <div className="text-center py-12 text-red-500">{error}</div>}

      {!loading && !error && (
        servers.length === 0 ? (
          <div className="text-sm text-muted-foreground">No servers configured yet. Click "Add Server" to connect one.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {servers.map((s: any) => {
              const serverSlug = s.server_slug as string;
              const meta = metaByName[serverSlug] || {};
              const displayName = meta.displayName || serverSlug;
              const description = meta.description || s.url || "";
              const logoUrl = meta.logoUrl || "";
              const enabledIn = enabledCounts[serverSlug] || 0;
              return (
                <Link key={s.id || serverSlug} href={`/tools/${encodeURIComponent(serverSlug)}`} className="block">
                  <Card className="hover:shadow-md transition-shadow h-full">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        {logoUrl ? (
                          <img src={logoUrl} alt={displayName} className="h-6 w-6 rounded" />
                        ) : (
                          <div className="h-6 w-6 rounded bg-muted" />
                        )}
                        <CardTitle className="text-base truncate">{displayName}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {description && (
                        <div className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</div>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Enabled in {enabledIn} agent{enabledIn === 1 ? '' : 's'}</span>
                        {s.created_at && (
                          <span>Configured {formatRelativeTime(s.created_at)}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )
      )}

      <AddMCPServerModal open={addOpen} onOpenChange={setAddOpen} onAdded={async () => {
        try {
          const [serversRes, assistantsRes, userAddedRes] = await Promise.all([
            fetch('/api/user-mcp-servers'),
            fetch('/api/agents'),
            fetch('/api/user-added-servers'),
          ]);
          const [serversJson, assistantsJson, userAddedJson] = await Promise.all([
            serversRes.json(), assistantsRes.json(), userAddedRes.json()
          ]);
          const rawServers: any[] = serversJson.servers || [];
          const filtered = (rawServers || [])
            .filter((s: any) => s?.is_enabled)
            .filter((s: any) => (s?.server_slug || '').toLowerCase() !== 'notion');
          setServers(filtered || []);
          const assistants: any[] = assistantsJson?.assistants || [];
          const counts: Record<string, number> = {};
          for (const a of assistants) {
            const enabled = a?.config?.configurable?.enabled_mcp_servers;
            if (Array.isArray(enabled)) {
              for (const name of enabled) counts[name] = (counts[name] || 0) + 1;
            } else if (enabled && typeof enabled === 'object') {
              for (const [name, val] of Object.entries(enabled)) {
                if ((val as any)?.isEnabled) counts[name] = (counts[name] || 0) + 1;
              }
            }
          }
          setEnabledCounts(counts);
          const meta: Record<string, ToolMeta> = {};
          for (const s of OFFICIAL_MCP_SERVERS) {
            meta[s.serverName] = {
              displayName: s.displayName,
              description: s.description,
              logoUrl: s.logoUrl,
            };
          }
          const userAdded: any[] = userAddedJson?.servers || [];
          for (const s of userAdded) {
            const q = s?.server_slug;
            if (!q) continue;
            meta[q] = {
              displayName: s.display_name || meta[q]?.displayName || q,
              description: s.description || meta[q]?.description,
              logoUrl: s.logo_url || meta[q]?.logoUrl,
            };
          }
          setMetaByName(meta);
        } catch {}
      }} />
    </div>
  );
}


