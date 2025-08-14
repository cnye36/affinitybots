/*
 * A revamped dashboard page for AgentHub.
 *
 * This file implements a Next.js server component that improves upon the
 * original dashboard by surfacing more information about the user's agents
 * and configured tools.  In addition to the existing statistics,
 * quick‑actions, workflows and activity log, the new dashboard includes
 * two sections:
 *   – **My Tools**: lists a few of the most recently configured MCP
 *     servers for the current user and indicates whether each is
 *     enabled.  If the user hasn't configured any tools yet a helpful
 *     call‑to‑action links to the `/tools` page.
 *   – **My Agents**: shows up to three of the user's most recently
 *     created agents, summarising their names, descriptions and how many
 *     tools they have enabled.  A link is provided for quickly jumping
 *     to the full agents list.
 *
 * The component preserves the structure of the original dashboard by
 * keeping the overview header, stats overview, quick actions and the
 * recent activity/latest workflows split.  Data is fetched from
 * Supabase where possible (e.g. counts, workflows, activity, tools,
 * agents) and any errors encountered during the fetches are logged to
 * the console.  A timeout guard prevents the page from hanging
 * indefinitely if a request stalls.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { Clock, BarChart3 } from "lucide-react";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { QuickActions } from "@/components/dashboard/QuickActions";
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
 * A small utility to extract the number of enabled MCP servers from an
 * assistant's configuration.  The config structure supports both an
 * array (for a simple list of enabled servers) and an object keyed by
 * server name with a nested `isEnabled` flag.  The function always
 * returns a numeric count.
 */
function countEnabledTools(config: any): number {
  if (!config) return 0;
  const enabledMcpServers = config.configurable?.enabled_mcp_servers;
  if (Array.isArray(enabledMcpServers)) {
    return enabledMcpServers.length;
  }
  if (typeof enabledMcpServers === "object" && enabledMcpServers !== null) {
    return Object.values(enabledMcpServers).filter((v: any) => (v as any)?.isEnabled).length;
  }
  return 0;
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
        const recentActivity =
          activityLogs?.map((log: any) => ({
            type: log.type as
              | "workflow_completed"
              | "agent_created"
              | "workflow_error",
            message: log.message,
            time: formatRelativeTime(log.created_at),
          })) || [];

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
        // extracts nested metadata and counts the number of enabled tools.
        const agents = (assistantsData || []).map((assistant: any) => {
          const metadata = (assistant.metadata || {}) as any;
          const config = (assistant.config || {}) as any;
          return {
            id: assistant.assistant_id,
            name: assistant.name || "Unnamed Agent",
            description: metadata.description || "No description provided",
            toolsCount: countEnabledTools(config),
          };
        });

        // --------------------------------------------------------------------
        // Render the dashboard UI
        // --------------------------------------------------------------------
        return (
          <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
              {/* Header with time range and actions */}
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Dashboard Overview</h1>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Clock className="mr-2 h-4 w-4" />
                    Last 7 days
                  </Button>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Reports
                  </Button>
                </div>
              </div>

              {/* Summary statistics */}
              <StatsOverview stats={stats} />

              {/* Tools and Agents summary grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Tools section */}
                <Card>
                  <CardHeader>
                    <CardTitle>My Tools</CardTitle>
                    <CardDescription>
                      Recently configured Smithery/MCP servers
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
                            <div className="font-medium truncate">
                              {tool.qualified_name}
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

                {/* Agents section */}
                <Card>
                  <CardHeader>
                    <CardTitle>My Agents</CardTitle>
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
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {agent.name}
                                </p>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {agent.description}
                                </p>
                              </div>
                              <Badge variant="secondary">
                                {agent.toolsCount} tool{agent.toolsCount === 1 ? "" : "s"}
                              </Badge>
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
              </div>

              {/* Quick actions */}
              <QuickActions />

              {/* Recent activity and workflows */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <RecentActivity activities={recentActivity} />
                <LatestWorkflows workflows={workflows || []} />
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