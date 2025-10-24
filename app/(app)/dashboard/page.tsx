import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { Clock, Bot, Play } from "lucide-react";
import Image from "next/image";
import { headers } from "next/headers";
import { OFFICIAL_MCP_SERVERS } from "@/lib/mcp/officialMcpServers";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { LatestWorkflows } from "@/components/dashboard/ActiveWorkflows";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";

// Helper to impose a maximum time for the entire server function.
function createTimeoutPromise(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });
}

/**
 * A utility to extract enabled MCP server names from an assistant's configuration.
 * Returns an array of enabled tool names.
 */
function getEnabledTools(config: any): string[] {
  if (!config) return [];
  const enabledMcpServers = config.configurable?.enabled_mcp_servers;
  if (Array.isArray(enabledMcpServers)) {
    return enabledMcpServers;
  }
  if (typeof enabledMcpServers === "object" && enabledMcpServers !== null) {
    return Object.entries(enabledMcpServers)
      .filter(([_, value]: [string, any]) => value?.isEnabled)
      .map(([key]: [string, any]) => key);
  }
  return [];
}

/**
 * A utility to get a simple icon for a tool based on its name
 */
function getToolIcon(toolName: string) {
  const name = toolName.toLowerCase();
  if (name.includes('supabase')) return '🗄️';
  if (name.includes('notion')) return '📝';
  if (name.includes('hubspot')) return '🎯';
  if (name.includes('github')) return '🐙';
  if (name.includes('slack')) return '💬';
  if (name.includes('discord')) return '🎮';
  if (name.includes('google')) return '🌐';
  if (name.includes('calendar')) return '📅';
  if (name.includes('drive')) return '💾';
  if (name.includes('email')) return '📧';
  if (name.includes('postgres')) return '🐘';
  if (name.includes('mysql')) return '🐬';
  if (name.includes('redis')) return '🔴';
  if (name.includes('stripe')) return '💳';
  return '🔧';
}

/**
 * A utility to format tool names for display
 */
function formatToolName(qualifiedName: string): string {
  // Extract the tool name from qualified name (e.g., "mcp-server-hubspot" -> "hubspot")
  const parts = qualifiedName.toLowerCase().split('-');
  const toolName = parts[parts.length - 1] || qualifiedName;
  
  // Capitalize first letter
  return toolName.charAt(0).toUpperCase() + toolName.slice(1);
}

export default async function Dashboard() {
  try {
    const result = await Promise.race([
      (async () => {
        // Initialise Supabase client and authenticate the current user.
        const supabase = await createClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Error fetching user:", userError);
        }
        if (!user) {
          redirect("/signin");
        }

        // --------------------------------------------------------------------
        // Fetch dashboard statistics
        // --------------------------------------------------------------------
        // Latest workflows (limit 3)
        const { data: workflows, error: workflowsError } = await supabase
          .from("workflows")
          .select("workflow_id, name, created_at, updated_at, status")
          .eq("owner_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(3);
        if (workflowsError) {
          console.error("Error fetching workflows:", workflowsError);
        }

        // Recent activity (limit 5)
        const { data: activityLogs, error: activityError } = await supabase
          .from("activity_log")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(5);
        if (activityError) {
          console.error("Error fetching activity logs:", activityError);
        }

        // Workflow and agent counts
        const { count: totalWorkflows, error: workflowCountError } = await supabase
          .from("workflows")
          .select("*", { count: "exact", head: true })
          .eq("owner_id", user!.id);
        if (workflowCountError) {
          console.error("Error fetching total workflows:", workflowCountError);
        }
        const { count: totalAgents, error: agentCountError } = await supabase
          .from("user_assistants")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user!.id);
        if (agentCountError) {
          console.error("Error fetching total agents:", agentCountError);
        }

        // Build the stats object for StatsOverview component.  The
        // successRate and averageResponseTime values are placeholders;
        // calculations should be updated when corresponding metrics are
        // available in your schema.
        const stats = {
          totalWorkflows: totalWorkflows || 0,
          totalAgents: totalAgents || 0,
          successRate: "98%",
          averageResponseTime: "1.2s",
        };

        // --------------------------------------------------------------------
        // Fetch tools information
        // --------------------------------------------------------------------
        const { data: toolsData, error: toolsError } = await supabase
          .from("user_mcp_servers")
          .select("id, qualified_name, is_enabled, created_at")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(3);
        if (toolsError) {
          console.error("Error fetching tools:", toolsError);
        }
        const tools = toolsData || [];

        // --------------------------------------------------------------------
        // Fetch agent information
        // --------------------------------------------------------------------
        // Query the assistant table with an inner join on user_assistants to
        // scope to the current user.  Limit to the three most recent.
        const { data: assistantsData, error: assistantsError } = await supabase
          .from("assistant")
          .select(
            `assistant_id, name, metadata, config, created_at,
             user_assistants!inner(user_id)`
          )
          .eq("user_assistants.user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(3);
        if (assistantsError) {
          console.error("Error fetching assistants:", assistantsError);
        }
        // Map assistants into a simpler shape for display.  This safely
        // extracts nested metadata and gets the enabled tools.
        const agents = (assistantsData || []).map((assistant: any) => {
          const metadata = (assistant.metadata || {}) as any;
          const config = (assistant.config || {}) as any;
          const enabledTools = getEnabledTools(config);
          return {
            id: assistant.assistant_id,
            name: assistant.name || "Unnamed Agent",
            description: metadata.description || "No description provided",
            enabledTools: enabledTools,
            toolsCount: enabledTools.length,
          };
        });

        // Generate recent activity after all data is fetched
        let recentActivity = activityLogs?.map((log: any) => ({
          type: log.type as
            | "workflow_completed"
            | "agent_created"
            | "workflow_error",
          message: log.message,
          time: formatRelativeTime(log.created_at),
        })) || [];

        // If no activity logs exist, generate some based on recent data
        if (recentActivity.length === 0) {
          const sampleActivity: any[] = [];
          
          // Add workflow-related activities
          if (workflows && workflows.length > 0) {
            workflows.slice(0, 2).forEach((workflow: any) => {
              sampleActivity.push({
                type: "workflow_completed" as const,
                message: `Workflow "${workflow.name}" completed successfully`,
                time: formatRelativeTime(workflow.created_at),
              });
            });
          }
          
          // Add agent-related activities
          if ((assistantsData || []).length > 0) {
            (assistantsData || []).slice(0, 2).forEach((assistant: any) => {
              sampleActivity.push({
                type: "agent_created" as const,
                message: `Agent "${assistant.name}" was created`,
                time: formatRelativeTime(assistant.created_at),
              });
            });
          }
          
          // Add tool-related activities
          if (toolsData && toolsData.length > 0) {
            toolsData.slice(0, 1).forEach((tool: any) => {
              sampleActivity.push({
                type: "agent_created" as const,
                message: `Tool "${formatToolName(tool.qualified_name)}" was configured`,
                time: formatRelativeTime(tool.created_at),
              });
            });
          }
          
          recentActivity = sampleActivity.slice(0, 5);
        }

        // --------------------------------------------------------------------
        // Build tool logo map from official servers
        // --------------------------------------------------------------------
        const allQualifiedNamesSet = new Set<string>();
        agents.forEach((a: any) => (a.enabledTools || []).forEach((q: string) => q && allQualifiedNamesSet.add(q)));
        tools.forEach((t: any) => t?.qualified_name && allQualifiedNamesSet.add(t.qualified_name));

        const toolLogos: Record<string, string> = {};
        // Build logo map from official servers
        OFFICIAL_MCP_SERVERS.forEach((s) => {
          if (s.logoUrl) {
            // Seed by exact name and any qualified names that include the official key
            if (allQualifiedNamesSet.has(s.qualifiedName)) {
              toolLogos[s.qualifiedName] = s.logoUrl as string;
            }
            Array.from(allQualifiedNamesSet).forEach((q) => {
              if (q.toLowerCase().includes(s.qualifiedName.toLowerCase())) {
                toolLogos[q] = s.logoUrl as string;
              }
            });
          }
        });

        // Helper to get an official logo by qualified name
        const officialLogoForQualifiedName = (qualified: string): string | undefined => {
          const lower = (qualified || "").toLowerCase();
          const match = OFFICIAL_MCP_SERVERS.find((s) => lower.includes(s.qualifiedName.toLowerCase()) && s.logoUrl);
          return match?.logoUrl as string | undefined;
        };

        // --------------------------------------------------------------------
        // Render the dashboard UI
        // --------------------------------------------------------------------
        return (
          <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
              {/* Enhanced Header */}
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                      Monitor your agents, workflows, and system performance
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/agents/new">
                        <Bot className="h-4 w-4 mr-2" />
                        New Agent
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/workflows/new">
                        <Play className="h-4 w-4 mr-2" />
                        New Workflow
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm">
                      <Clock className="h-4 w-4 mr-2" />
                      Last 30 days
                    </Button>
                  </div>
                </div>
              </div>

              {/* Summary statistics */}
              <StatsOverview stats={stats} />

              {/* Tools and Agents summary grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">{/* Agents section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Agents</CardTitle>
                    <CardDescription>
                      Your most recently created agents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {agents.length > 0 ? (
                      <div className="space-y-4">
                        {agents.map((agent: any) => (
                          <Link
                            key={agent.id}
                            href={`/agents/${encodeURIComponent(agent.id)}`}
                            className="block p-3 border rounded-lg hover:border-primary transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium truncate">
                                    {agent.name}
                                  </p>
                                  <div className="flex items-center gap-1">
                                    {agent.enabledTools.slice(0, 3).map((tool: string, index: number) => {
                                      const logo = toolLogos[tool] || officialLogoForQualifiedName(tool);
                                      return logo ? (
                                        <Image
                                          key={index}
                                          src={logo}
                                          alt={tool}
                                          width={20}
                                          height={20}
                                          className="object-contain"
                                          style={{ objectFit: "contain" }}
                                        />
                                      ) : (
                                        <span key={index} className="text-sm" title={tool}>
                                          {getToolIcon(tool)}
                                        </span>
                                      );
                                    })}
                                    {agent.enabledTools.length > 3 && (
                                      <span className="text-xs text-muted-foreground">
                                        +{agent.enabledTools.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {agent.description}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))}
                        {assistantsData && assistantsData.length > 3 && (
                          <Link
                            href="/agents"
                            className="text-sm text-primary underline"
                          >
                            View all agents
                          </Link>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">
                          You don’t have any agents yet.
                        </p>
                        <Button variant="outline" asChild>
                          <Link href="/agents/new">Create Agent</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                {/* Tools section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tools</CardTitle>
                    <CardDescription>
                      Recently configured Tools
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {tools.length > 0 ? (
                      <div className="space-y-4">
                        {tools.map((tool: any) => (
                          <div
                            key={tool.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {(toolLogos[tool.qualified_name] || officialLogoForQualifiedName(tool.qualified_name)) ? (
                                <Image
                                  src={toolLogos[tool.qualified_name] || officialLogoForQualifiedName(tool.qualified_name) as string}
                                  alt={tool.qualified_name}
                                  width={28}
                                  height={28}
                                  className="object-contain"
                                  style={{ objectFit: "contain" }}
                                />
                              ) : (
                                <span className="text-lg" title={tool.qualified_name}>
                                  {getToolIcon(tool.qualified_name)}
                                </span>
                              )}
                              <div>
                                <div className="font-medium truncate">
                                  {formatToolName(tool.qualified_name)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {tool.qualified_name}
                                </div>
                              </div>
                            </div>
                            <Badge
                              variant={tool.is_enabled ? "default" : "secondary"}
                            >
                              {tool.is_enabled ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                        ))}
                        {toolsData && toolsData.length > 3 && (
                          <Link
                            href="/tools"
                            className="text-sm text-primary underline"
                          >
                            View all tools
                          </Link>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">
                          You haven’t configured any tools yet.
                        </p>
                        <Button variant="outline" asChild>
                          <Link href="/tools">Configure Tools</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card> 
              </div>

              

              {/* Recent activity and workflows */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LatestWorkflows workflows={workflows || []} />
                <RecentActivity activities={recentActivity} />
              </div>
            </div>
          </div>
        );
      })(),
      createTimeoutPromise(30000),
    ]);
    return result;
  } catch (error) {
    console.error("Error in Dashboard:", error);
    // If the timeout triggered, inform the caller via thrown error
    if (error instanceof Error && error.message.includes("timed out")) {
      throw new Error("Request timed out. Please try again.");
    }
    // Rethrow other errors to be handled by Next.js error boundaries
    throw error;
  }
}