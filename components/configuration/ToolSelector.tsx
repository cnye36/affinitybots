"use client"

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, CheckCircle, XCircle, Globe, Server, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { OFFICIAL_MCP_SERVERS } from "@/lib/mcp/officialMcpServers";


interface UserMCPServer {
  id: string;
  server_slug: string;
  config: any;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface UserAddedServer {
  id: string;
  server_slug: string;
  display_name: string;
  description: string;
  url: string;
  auth_type: string;
  config: any;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface ToolSelectorProps {
  enabledMCPServers: string[];
  onMCPServersChange: (servers: string[]) => void;
}

export function ToolSelector({
  enabledMCPServers = [],
  onMCPServersChange,
}: ToolSelectorProps) {
  console.log('ToolSelector received enabledMCPServers:', enabledMCPServers);
  const [userServers, setUserServers] = useState<UserMCPServer[]>([]);
  const [userAddedServers, setUserAddedServers] = useState<UserAddedServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch user configurations and user-added servers in parallel
      const [userRes, userAddedRes] = await Promise.all([
        fetch('/api/user-mcp-servers').then(r => r.json()),
        fetch('/api/user-added-servers').then(r => r.json())
      ]);

      if (userRes.error) {
        throw new Error(userRes.error);
      }

      if (userAddedRes.error) {
        throw new Error(userAddedRes.error);
      }

      setUserServers(userRes.servers || []);
      setUserAddedServers(userAddedRes.servers || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tools');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTool = (serverName: string) => {
    const isEnabledForAgent = enabledMCPServers.includes(serverName);

    // Allow toggling regardless of configuration status
    const updatedServers = isEnabledForAgent
      ? enabledMCPServers.filter(name => name !== serverName)
      : [...enabledMCPServers, serverName];

    onMCPServersChange(updatedServers);
  };

  const isConfigured = (serverName: string) => {
    const userServer = userServers.find(s => s.server_slug === serverName);
    const userAddedServer = userAddedServers.find(s => s.server_slug === serverName);
    return userServer?.is_enabled || userAddedServer?.is_enabled || false;
  };

  const isEnabledForAgent = (serverName: string) => {
    return enabledMCPServers.includes(serverName);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading tools...
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            className="ml-2"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Combine all server types (deduplicated by serverName).
  // Priority: custom > official
  const allServersMap: Record<string, any> = {};
  userAddedServers.forEach(server => {
    allServersMap[server.server_slug] = {
      ...server,
      serverName: server.server_slug,
      displayName: server.display_name,
      description: server.description,
      serverType: 'custom' as const,
      isLocal: false
    };
  });
  OFFICIAL_MCP_SERVERS.forEach(server => {
    if (!allServersMap[server.serverName]) {
      allServersMap[server.serverName] = {
        ...server,
        serverType: 'official' as const,
        isLocal: false
      };
    }
  });
  const allServers = Object.values(allServersMap);

  // Separate configured and unconfigured servers
  const configuredServers = allServers.filter(server => isConfigured(server.serverName));
  const unconfiguredServers = allServers.filter(server => !isConfigured(server.serverName));

  const ServerCard = ({ server, isConfiguredSection }: { server: any; isConfiguredSection: boolean }) => {
    const configured = isConfigured(server.serverName);
    const enabled = isEnabledForAgent(server.serverName);
    
    const getServerTypeBadge = () => {
      const variants = {
        official: "default",
        custom: "outline"
      } as const;

      const labels = {
        official: "Official",
        custom: "Custom"
      };

      const serverType = server.serverType as keyof typeof variants;

      return (
        <Badge variant={variants[serverType]} className="text-xs">
          {labels[serverType]}
        </Badge>
      );
    };
    
          return (
        <Card className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 mt-1">
              {server.logoUrl ? (
                <Image
                  src={server.logoUrl}
                  alt={server.displayName || server.serverName}
                  width={32}
                  height={32}
                  className="rounded bg-white border p-0.5 object-contain"
                  style={{ objectFit: 'contain' }}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-lg">
                  {server.serverName === 'github' ? '🐙' :
                   server.serverName === 'notion' ? '📝' : '🛠️'}
                </div>
              )}
            </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-medium text-sm">
                  {server.displayName || server.serverName}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {server.description || "No description available"}
                </p>
              </div>

              {/* Toggle Switch - only show for configured tools */}
              {configured && (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={enabled}
                    onCheckedChange={() => handleToggleTool(server.serverName)}
                  />
                </div>
              )}
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap gap-1 mt-2">
              {getServerTypeBadge()}
              
              {configured ? (
                <Badge variant="default" className="text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Configured
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  Not Configured
                </Badge>
              )}
              
              {server.security?.scanPassed && (
                <Badge variant="secondary" className="text-xs">
                  Security Verified
                </Badge>
              )}
              
              <Badge variant="outline" className="text-xs">
                {server.isLocal ? (
                  <>
                    <Server className="w-3 h-3 mr-1" />
                    Local
                  </>
                ) : (
                  <>
                    <Globe className="w-3 h-3 mr-1" />
                    Remote
                  </>
                )}
              </Badge>
            </div>

            {/* Configure button for unconfigured servers */}
            {!configured && (
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="default"
                  className="text-xs"
                  asChild
                >
                  <Link href={`/tools/${encodeURIComponent(server.serverName)}`}>
                    <Settings className="w-3 h-3 mr-1" />
                    Connect
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="max-h-[520px] overflow-y-auto pr-1">
        {/* Configured Tools Section */}
        {configuredServers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold">Configured Tools</h3>
              <Badge variant="secondary">{configuredServers.length}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {configuredServers.map((server) => (
                <ServerCard
                  key={server.serverName}
                  server={server}
                  isConfiguredSection={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Separator */}
        {configuredServers.length > 0 && unconfiguredServers.length > 0 && (
          <Separator />
        )}

        {/* Available Tools Section */}
        {unconfiguredServers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold">Available Tools</h3>
              <Badge variant="outline">{unconfiguredServers.length}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {unconfiguredServers.map((server) => (
                <ServerCard
                  key={server.serverName}
                  server={server}
                  isConfiguredSection={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {allServers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No tools available at the moment.</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchData}
              className="mt-2"
            >
              Refresh
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
