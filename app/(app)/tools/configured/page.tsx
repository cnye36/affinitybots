"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddMCPServerModal } from "@/components/tools/AddMCPServerModal";

function isSmithery(s: any): boolean {
  return s?.config?.provider === 'smithery' || (s?.url || '').includes('server.smithery.ai');
}

export default function ConfiguredToolsPage() {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/user-mcp-servers');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load configured servers');
        setServers(data.servers || []);
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
            {servers.map((s: any) => (
              <Link key={s.id || s.qualified_name} href={`/tools/${encodeURIComponent(s.qualified_name)}`} className="block">
                <Card className="hover:shadow-md transition-shadow relative">
                  <div className="absolute left-3 top-3">
                    <Badge variant="outline">{isSmithery(s) ? 'Smithery' : 'User'}</Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-base">{s.qualified_name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground mb-2">{s.url || (isSmithery(s) ? 'Smithery (derived)' : 'Configured')}</div>
                    <div className="text-xs">{s.is_enabled ? 'Enabled' : 'Disabled'}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )
      )}

      <AddMCPServerModal open={addOpen} onOpenChange={setAddOpen} onAdded={async () => {
        const res = await fetch('/api/user-mcp-servers');
        const data = await res.json();
        setServers(data.servers || []);
      }} />
    </div>
  );
}


