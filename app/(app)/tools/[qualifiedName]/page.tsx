"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { ArrowLeft, ExternalLink, Shield, CheckCircle, XCircle, Globe, Server, Calendar, GitBranch, Users, Activity, Settings } from "lucide-react";
import { ServerConfigForm } from "@/components/ServerConfigForm";

interface Tool {
  name: string;
  description?: string;
  inputSchema?: any;
}

interface ServerDetail {
  qualifiedName: string;
  displayName?: string;
  description?: string;
  iconUrl?: string;
  logo?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  security?: {
    scanPassed?: boolean;
    provider?: string;
  };
  tools?: Tool[];
  connections?: any[];
  deploymentUrl?: string;
  isLocal?: boolean;
  publishedAt?: string;
  monthlyToolCalls?: number;
  successRate?: number;
  deployedFrom?: string;
}

export default function ServerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qualifiedName = params.qualifiedName as string;
  const [server, setServer] = useState<ServerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServerDetail() {
      if (!qualifiedName) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Decode the qualifiedName first in case it's already encoded from the URL
        const decodedName = decodeURIComponent(qualifiedName);
        const encodedName = encodeURIComponent(decodedName);
        const response = await fetch(`/api/smithery/${encodedName}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch server details');
        }
        
        const data = await response.json();
        setServer(data.server);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchServerDetail();
  }, [qualifiedName]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="text-center py-12 text-lg">Loading server details...</div>
      </div>
    );
  }

  if (error || !server) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="text-center py-12">
          <div className="text-red-500 text-lg mb-4">
            {error || 'Server not found'}
          </div>
          <Button onClick={() => router.push('/tools')}>
            Return to Tools
          </Button>
        </div>
      </div>
    );
  }

  const hasSecurityCheck = server.security?.scanPassed !== undefined;
  const securityPassed = server.security?.scanPassed;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-start gap-6 mb-6">
          {/* Icon */}
          <div className="flex-shrink-0">
            {server.iconUrl || server.logo ? (
              <div className="w-16 h-16 rounded-full bg-white border overflow-hidden">
                <Image
                  src={server.iconUrl || server.logo || ''}
                  alt={server.displayName || server.qualifiedName}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-3xl">
                🛠️
              </div>
            )}
          </div>

          {/* Title and Description */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">
              {server.displayName || server.qualifiedName}
            </h1>
            <p className="text-muted-foreground text-lg mb-4">
              {server.description || "No description available."}
            </p>
            
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {hasSecurityCheck && (
                <Badge variant={securityPassed ? "default" : "destructive"} className="flex items-center gap-1">
                  {securityPassed ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  Security {securityPassed ? "Passed" : "Failed"}
                </Badge>
              )}
              
              {server.security?.provider && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {server.security.provider}
                </Badge>
              )}
              
              <Badge variant="outline" className="flex items-center gap-1">
                {server.isLocal ? (
                  <Server className="w-3 h-3" />
                ) : (
                  <Globe className="w-3 h-3" />
                )}
                {server.isLocal ? "Local" : "Remote"}
              </Badge>

              {server.license && (
                <Badge variant="outline">
                  {server.license}
                </Badge>
              )}
            </div>

            {/* Links */}
            <div className="flex gap-3">
              {server.homepage && (
                <Button variant="outline" size="sm" asChild>
                  <a href={server.homepage} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Homepage
                  </a>
                </Button>
              )}
              {server.repository && (
                <Button variant="outline" size="sm" asChild>
                  <a href={server.repository} target="_blank" rel="noopener noreferrer">
                    <GitBranch className="w-4 h-4 mr-2" />
                    Source Code
                  </a>
                </Button>
              )}
              {server.deploymentUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={server.deploymentUrl} target="_blank" rel="noopener noreferrer">
                    <Server className="w-4 h-4 mr-2" />
                    Deployment
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {(server.monthlyToolCalls || server.successRate || server.publishedAt || server.deployedFrom) && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {server.monthlyToolCalls && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {server.monthlyToolCalls.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Monthly Tool Calls</div>
                </div>
              )}
              {server.successRate && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {server.successRate}%
                  </div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
              )}
              {server.publishedAt && (
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {new Date(server.publishedAt).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Published</div>
                </div>
              )}
              {server.deployedFrom && (
                <div className="text-center">
                  <div className="text-2xl font-bold font-mono">
                    {server.deployedFrom.slice(0, 8)}
                  </div>
                  <div className="text-sm text-muted-foreground">Deployed From</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Section */}
      {server.connections && server.connections.length > 0 && (
        <div className="mb-8">
          <ServerConfigForm
            qualifiedName={server.qualifiedName}
            configSchema={server.connections[0]?.configSchema}
            serverDetails={server}
            onSave={() => {
              // Optionally refresh data or show success message
            }}
            onDelete={() => {
              // Optionally refresh data or show success message
            }}
          />
          
          {/* Technical Details (Optional) */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Technical Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {server.connections.map((connection, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{connection.type}</Badge>
                      {connection.deploymentUrl && (
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {connection.deploymentUrl}
                        </code>
                      )}
                    </div>
                    {connection.configSchema && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                          View Configuration Schema
                        </summary>
                        <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto">
                          {JSON.stringify(connection.configSchema, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Tools Section */}
      {server.tools && server.tools.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Available Tools ({server.tools.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {server.tools.map((tool, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{tool.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    Tool
                  </Badge>
                </div>
                {tool.description && (
                  <p className="text-muted-foreground mb-3">
                    {tool.description}
                  </p>
                )}
                {tool.inputSchema && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                      View Input Schema
                    </summary>
                    <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto">
                      {JSON.stringify(tool.inputSchema, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Button size="lg">
          Add to Configuration
        </Button>
        <Button variant="outline" size="lg">
          View on Smithery
        </Button>
      </div>
    </div>
  );
}
