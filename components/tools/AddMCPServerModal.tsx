"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Server, Key, Shield, Sparkles, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type AuthType = "none" | "oauth" | "api_key" | "bearer" | "unknown" | "manual_oauth" | "manual_api_key" | "manual_bearer";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded?: () => void;
}

// Helper function to generate a slug from display name
function generateSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

export function AddMCPServerModal({ open, onOpenChange, onAdded }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [manualAuthType, setManualAuthType] = useState<"oauth" | "api_key" | "bearer" | "none">("none");
  const [apiKey, setApiKey] = useState("");
  const [bearerToken, setBearerToken] = useState("");
  const [apiKeyHeaderName, setApiKeyHeaderName] = useState("X-API-Key");
  const [detectedAuthType, setDetectedAuthType] = useState<AuthType>("unknown");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const callbackUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/mcp/auth/callback` : '';

  // Track if user has manually selected an auth type
  const [hasManualSelection, setHasManualSelection] = useState(false);
  
  // Determine which auth type to use (manual selection takes precedence if user explicitly selected)
  const effectiveAuthType: AuthType = 
    hasManualSelection ? (`manual_${manualAuthType}` as AuthType) : detectedAuthType;
  
  const handleManualAuthChange = (value: string) => {
    setManualAuthType(value as any);
    setHasManualSelection(true);
    setError(null);
  };

  const resetForm = () => {
    setDisplayName("");
    setServerUrl("");
    setManualAuthType("none");
    setHasManualSelection(false);
    setApiKey("");
    setBearerToken("");
    setApiKeyHeaderName("X-API-Key");
    setDetectedAuthType("unknown");
    setSessionId(null);
    setAuthUrl(null);
    setError(null);
    setSuccess(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  async function detectAuth() {
    setError(null);
    setSuccess(null);
    setDetectedAuthType("unknown");
    setAuthUrl(null);
    setSessionId(null);
    
    if (!serverUrl.trim()) {
      setError("Please enter a server URL first");
      return;
    }

    try {
      setDetecting(true);
      const res = await fetch("/api/mcp/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          serverUrl: serverUrl.trim(), 
          callbackUrl,
          apiKey: apiKey.trim() || undefined,
          bearerToken: bearerToken.trim() || undefined,
          apiKeyHeaderName: apiKeyHeaderName.trim() || undefined,
        }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to discover auth type");
      }

      const detectedType = data.authType || "unknown";
      setDetectedAuthType(detectedType);
      
      // Auto-select detected auth type if it's valid and user hasn't manually selected
      if (!hasManualSelection && detectedType !== "unknown") {
        setManualAuthType(detectedType === "none" ? "none" : detectedType as any);
      }
      
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.authUrl) setAuthUrl(data.authUrl);
      
      if (data.detected === true) {
        setSuccess(`Successfully detected: ${detectedType} authentication`);
      } else if (data.detected === false && data.error) {
        setError(data.error);
      } else if (detectedType === "unknown") {
        setError("Could not automatically detect auth type. Please select manually.");
      } else {
        setSuccess(`Auth type detected: ${detectedType}`);
      }
    } catch (e: any) {
      setError(e.message || String(e));
      setDetectedAuthType("unknown");
    } finally {
      setDetecting(false);
    }
  }

  async function connect() {
    setError(null);
    setSuccess(null);

    if (!displayName.trim() || !serverUrl.trim()) {
      setError("Display name and URL are required");
      return;
    }

    // Generate server slug from display name
    const serverSlug = generateSlug(displayName.trim());
    if (!serverSlug) {
      setError("Display name must contain at least one letter or number");
      return;
    }

    // Get the actual auth type to use
    const actualAuthType = effectiveAuthType.replace("manual_", "") as string;

    // For OAuth, use the OAuth connection flow
    if (actualAuthType === "oauth") {
      try {
        setConnecting(true);
        const res = await fetch("/api/mcp/auth/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            serverUrl: serverUrl.trim(), 
            callbackUrl, 
            serverName: serverSlug 
          }),
        });
        const data = await res.json();
        
        if (data?.requiresAuth && data.authUrl) {
          // Store the display name and other info for after OAuth callback
          // The callback will need to create the user_added_servers record
          sessionStorage.setItem('pending_mcp_server', JSON.stringify({
            displayName: displayName.trim(),
            serverSlug,
            serverUrl: serverUrl.trim(),
            authType: actualAuthType,
          }));
          window.location.href = data.authUrl;
          return;
        }
        
        if (!res.ok) throw new Error(data.error || "Failed to connect");
        
        handleOpenChange(false);
        onAdded?.();
      } catch (e: any) {
        setError(e.message || String(e));
      } finally {
        setConnecting(false);
      }
      return;
    }

    // For API key, bearer token, or none, save directly
    try {
      setConnecting(true);
      let authTypeToSave = "none";
      let config: any = {};

      if (actualAuthType === "api_key") {
        if (!apiKey.trim()) {
          setError("API key is required");
          return;
        }
        authTypeToSave = "api_key";
        config = {
          apiKey: apiKey.trim(),
          apiKeyHeaderName: apiKeyHeaderName.trim() || "X-API-Key",
          auth_type: "api_key",
        };
      } else if (actualAuthType === "bearer") {
        if (!bearerToken.trim()) {
          setError("Bearer token is required");
          return;
        }
        authTypeToSave = "bearer";
        config = {
          bearerToken: bearerToken.trim(),
          auth_type: "bearer",
        };
      }

      const res = await fetch("/api/user-added-servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          server_slug: serverSlug,
          display_name: displayName.trim(),
          description: `Custom MCP server: ${displayName.trim()}`,
          url: serverUrl.trim(),
          auth_type: authTypeToSave,
          config,
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save server");
      
      handleOpenChange(false);
      onAdded?.();
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setConnecting(false);
    }
  }

  const canSubmit = displayName.trim() && serverUrl.trim();
  const actualAuthTypeForConnect = effectiveAuthType.replace("manual_", "") as string;
  const canConnect = canSubmit && (
    actualAuthTypeForConnect === "none" ||
    actualAuthTypeForConnect === "unknown" ||
    actualAuthTypeForConnect === "oauth" ||
    (actualAuthTypeForConnect === "api_key" && apiKey.trim()) ||
    (actualAuthTypeForConnect === "bearer" && bearerToken.trim())
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-2 border-teal-200/50 dark:border-teal-800/50">
        {/* Gradient Header */}
        <div className="relative overflow-hidden rounded-t-lg border-b border-teal-200/50 dark:border-teal-800/30 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 px-6 py-4 flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
          
          <DialogHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg">
                <Server className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  Add Custom MCP Server
                </DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  Add your own HTTP MCP server. Use at your own risk.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Basic Info */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="display-name" className="text-sm font-medium flex items-center gap-2">
                <Server className="h-4 w-4" />
                Server Name
              </Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. My Custom Server, GitHub Enterprise"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                This is the name that will be displayed. A URL-safe identifier will be generated automatically.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="server-url" className="text-sm font-medium flex items-center gap-2">
                <Server className="h-4 w-4" />
                Server URL
              </Label>
              <Input
                id="server-url"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://your-server.com/mcp"
                className="w-full"
              />
            </div>
          </div>

          {/* Authentication Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="auth-type" className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Authentication Type
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={detectAuth}
                disabled={!serverUrl.trim() || detecting || connecting}
                className="border-2 hover:border-teal-500/50 hover:bg-teal-500/5"
              >
                {detecting ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Detecting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-2" />
                    Detect Auth
                  </>
                )}
              </Button>
            </div>

            <Select 
              value={
                hasManualSelection 
                  ? manualAuthType 
                  : (detectedAuthType !== "unknown" && detectedAuthType !== "none" ? detectedAuthType : manualAuthType)
              } 
              onValueChange={handleManualAuthChange}
            >
              <SelectTrigger id="auth-type" className="w-full">
                <SelectValue placeholder="Select authentication type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (No Authentication)</SelectItem>
                <SelectItem value="oauth">OAuth</SelectItem>
                <SelectItem value="api_key">API Key</SelectItem>
                <SelectItem value="bearer">Bearer Token</SelectItem>
              </SelectContent>
            </Select>

            {/* Show detected auth type if available and no manual selection */}
            {detectedAuthType !== "unknown" && !hasManualSelection && (
              <Alert className="border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/20 py-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <AlertDescription className="text-sm">
                  Detected: <strong>{detectedAuthType}</strong>
                  {detectedAuthType === "api_key" && apiKey && " (with provided API key)"}
                  {detectedAuthType === "bearer" && bearerToken && " (with provided bearer token)"}
                </AlertDescription>
              </Alert>
            )}

            {/* API Key Fields - Only show when API Key is selected */}
            {manualAuthType === "api_key" && (
              <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="api-key" className="text-sm font-medium">
                    API Key
                  </Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Enter your API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api-key-header" className="text-sm font-medium">
                    Header Name (optional)
                  </Label>
                  <Input
                    id="api-key-header"
                    placeholder="X-API-Key (default)"
                    value={apiKeyHeaderName}
                    onChange={(e) => setApiKeyHeaderName(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Bearer Token Fields - Only show when Bearer Token is selected */}
            {manualAuthType === "bearer" && (
              <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="bearer-token" className="text-sm font-medium">
                    Bearer Token
                  </Label>
                  <Input
                    id="bearer-token"
                    type="password"
                    placeholder="Enter your bearer token"
                    value={bearerToken}
                    onChange={(e) => setBearerToken(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={connecting}
            >
              Cancel
            </Button>
            <Button
              onClick={connect}
              disabled={!canConnect || connecting}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Connect Server
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
