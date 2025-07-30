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

interface SmitheryServer {
  qualifiedName: string;
  displayName?: string;
  description?: string;
  iconUrl?: string;
  logo?: string;
  isLocal?: boolean;
  security?: {
    scanPassed?: boolean;
    provider?: string;
  };
  connections?: Array<{
    configSchema?: any;
    deploymentUrl?: string;
    type?: string;
  }>;
}

interface UserMCPServer {
  id: string;
  qualified_name: string;
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
  const [smitheryServers, setSmitheryServers] = useState<SmitheryServer[]>([]);
  const [userServers, setUserServers] = useState<UserMCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logos, setLogos] = useState<Record<string, string>>({});

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch both Smithery servers and user configurations in parallel
      // Use a large page size to get all servers for the tool selector
      const [smitheryRes, userRes] = await Promise.all([
        fetch('/api/smithery?pageSize=100').then(r => r.json()),
        fetch('/api/user-mcp-servers').then(r => r.json())
      ]);

      if (smitheryRes.error) {
        throw new Error(smitheryRes.error);
      }

      if (userRes.error) {
        throw new Error(userRes.error);
      }

      const servers = smitheryRes.servers?.servers || [];
      setSmitheryServers(servers);
      setUserServers(userRes.servers || []);

      // Fetch logos for servers that have them
      const serversWithLogos = servers.filter((s: SmitheryServer) => s.iconUrl || s.logo);
      if (serversWithLogos.length > 0) {
        const logoMap: Record<string, string> = {};
        serversWithLogos.forEach((server: SmitheryServer) => {
          if (server.iconUrl || server.logo) {
            logoMap[server.qualifiedName] = server.iconUrl || server.logo || '';
          }
        });
        setLogos(logoMap);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tools');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTool = (qualifiedName: string) => {
    const isEnabledForAgent = enabledMCPServers.includes(qualifiedName);
    const userServer = userServers.find(s => s.qualified_name === qualifiedName);
    
    // If enabling but not configured and enabled, don't allow toggle
    if (!isEnabledForAgent && !userServer?.is_enabled) {
      return;
    }

    const updatedServers = isEnabledForAgent
      ? enabledMCPServers.filter(name => name !== qualifiedName)
      : [...enabledMCPServers, qualifiedName];

    onMCPServersChange(updatedServers);
  };

  const isConfigured = (qualifiedName: string) => {
    const userServer = userServers.find(s => s.qualified_name === qualifiedName);
    return userServer?.is_enabled || false;
  };

  const isEnabledForAgent = (qualifiedName: string) => {
    return enabledMCPServers.includes(qualifiedName);
  };

  const needsConfiguration = (server: SmitheryServer) => {
    return server.connections?.[0]?.configSchema && 
           Object.keys(server.connections[0].configSchema.properties || {}).length > 0;
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

  // Separate configured and unconfigured servers
  const configuredServers = smitheryServers.filter(server => isConfigured(server.qualifiedName));
  const unconfiguredServers = smitheryServers.filter(server => !isConfigured(server.qualifiedName));

  const ServerCard = ({ server, isConfiguredSection }: { server: SmitheryServer; isConfiguredSection: boolean }) => {
    const configured = isConfigured(server.qualifiedName);
    const enabled = isEnabledForAgent(server.qualifiedName);
    const requiresConfig = needsConfiguration(server);
    
    return (
      <Card className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-1">
            {logos[server.qualifiedName] ? (
              <Image
                src={logos[server.qualifiedName]}
                alt={server.displayName || server.qualifiedName}
                width={32}
                height={32}
                className="rounded-full bg-white border"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-lg">
                🛠️
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-medium text-sm">
                  {server.displayName || server.qualifiedName}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {server.description || "No description available"}
                </p>
              </div>
              
              {/* Toggle Switch */}
              <div className="flex items-center gap-2">
                {configured && (
                  <Switch
                    checked={enabled}
                    onCheckedChange={() => handleToggleTool(server.qualifiedName)}
                  />
                )}
              </div>
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap gap-1 mt-2">
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

            {/* Configure button */}
            {!configured && (
              <div className="mt-3">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  asChild
                >
                  <Link href={`/tools/${encodeURIComponent(server.qualifiedName)}`}>
                    <Settings className="w-3 h-3 mr-1" />
                    {requiresConfig ? 'Configure' : 'Connect'}
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
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
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
                key={server.qualifiedName} 
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
                key={server.qualifiedName} 
                server={server} 
                isConfiguredSection={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {smitheryServers.length === 0 && (
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
  );
}
