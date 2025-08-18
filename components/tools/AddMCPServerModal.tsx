"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded?: () => void;
}

export function AddMCPServerModal({ open, onOpenChange, onAdded }: Props) {
  const [qualifiedName, setQualifiedName] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [authType, setAuthType] = useState<"unknown" | "none" | "oauth">("unknown");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = `${window.location.origin}/api/mcp/auth/callback`;

  async function discover() {
    setError(null);
    setAuthType("unknown");
    setAuthUrl(null);
    setSessionId(null);
    try {
      setLoading(true);
      const res = await fetch("/api/mcp/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverUrl, callbackUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to discover auth type");
      }
      setAuthType(data.authType || "unknown");
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.authUrl) setAuthUrl(data.authUrl);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function connectOAuth() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/mcp/auth/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverUrl, callbackUrl, serverName: qualifiedName }),
      });
      const data = await res.json();
      if (data?.requiresAuth && data.authUrl) {
        window.location.href = data.authUrl;
        return;
      }
      if (!res.ok) throw new Error(data.error || "Failed to connect");
      onOpenChange(false);
      onAdded?.();
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function saveDirect() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/user-added-servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          qualified_name: qualifiedName, 
          display_name: qualifiedName,
          description: `Custom MCP server: ${qualifiedName}`,
          url: serverUrl, 
          auth_type: authType === "oauth" ? "oauth" : "none",
          config: {} 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save server");
      onOpenChange(false);
      onAdded?.();
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = qualifiedName.trim() && serverUrl.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add MCP Server</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Qualified name</Label>
            <Input value={qualifiedName} onChange={(e) => setQualifiedName(e.target.value)} placeholder="e.g. github, zapier, custom-server" />
          </div>
          <div className="space-y-2">
            <Label>Server URL</Label>
            <Input value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} placeholder="https://host.tld/mcp" />
          </div>

          <div className="text-sm text-muted-foreground">Detect required authentication to connect.</div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={!canSubmit || loading} onClick={discover}>Detect auth</Button>
            {authType !== "unknown" && (
              <div className="text-sm">Detected: <strong>{authType}</strong></div>
            )}
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}
        </div>
        <DialogFooter className="justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          {authType === "oauth" ? (
            <Button disabled={!canSubmit || loading} onClick={connectOAuth}>Connect (OAuth)</Button>
          ) : (
            <Button disabled={!canSubmit || loading} onClick={saveDirect}>Save</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


