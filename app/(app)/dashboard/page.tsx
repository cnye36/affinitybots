import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Settings2,
  Activity,
  AlertCircle,
  Clock,
  BarChart3,
  Zap,
  CheckCircle2,
  User,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function Dashboard() {
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

  // Fetch latest agents
  const { data: latestAgents, error: agentsError } = await supabase
    .from("agents")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

  if (agentsError) {
    console.error("Error fetching agents:", agentsError);
  }

  // Fetch latest workflows
  const { data: latestWorkflows, error: workflowsError } = await supabase
    .from("workflows")
    .select("id, name, created_at, updated_at, status")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

  if (workflowsError) {
    console.error("Error fetching workflows:", workflowsError);
  }

  // Placeholder data for stats
  const stats = {
    activeWorkflows:
      latestWorkflows?.filter((w) => w.status === "active")?.length || 0,
    totalAgents: latestAgents?.length || 0,
    successRate: "98%",
    averageResponseTime: "1.2s",
  };

  // Placeholder data for recent activity
  const recentActivity = [
    {
      type: "workflow_completed",
      message: "Data Processing Workflow completed successfully",
      time: "2 hours ago",
    },
    {
      type: "agent_created",
      message: 'New AI Agent "Research Assistant" created',
      time: "5 hours ago",
    },
    {
      type: "workflow_error",
      message: 'Error in "Document Analysis" workflow',
      time: "1 day ago",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
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

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Workflows
                  </p>
                  <h3 className="text-2xl font-bold mt-2">
                    {stats.activeWorkflows}
                  </h3>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Agents
                  </p>
                  <h3 className="text-2xl font-bold mt-2">
                    {stats.totalAgents}
                  </h3>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <User className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Success Rate
                  </p>
                  <h3 className="text-2xl font-bold mt-2">
                    {stats.successRate}
                  </h3>
                </div>
                <div className="p-2 bg-green-500/10 rounded-full">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Avg Response Time
                  </p>
                  <h3 className="text-2xl font-bold mt-2">
                    {stats.averageResponseTime}
                  </h3>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-full">
                  <Activity className="h-4 w-4 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/agents/new" className="group">
            <div className="relative p-6 rounded-lg overflow-hidden border group-hover:border-primary transition-colors">
              <div className="flex items-center space-x-4">
                <PlusCircle className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Create New Agent
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Design a custom AI agent with specific capabilities
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/workflows/new" className="group">
            <div className="relative p-6 rounded-lg overflow-hidden border group-hover:border-primary transition-colors">
              <div className="flex items-center space-x-4">
                <PlusCircle className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold mb-1">New Workflow</h3>
                  <p className="text-sm text-muted-foreground">
                    Build a multi-agent workflow from scratch
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/settings" className="group">
            <div className="relative p-6 rounded-lg overflow-hidden border group-hover:border-primary transition-colors">
              <div className="flex items-center space-x-4">
                <Settings2 className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold mb-1">Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure your workspace and preferences
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates from your workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-start space-x-4">
                    <div
                      className={`p-2 rounded-full ${
                        activity.type === "workflow_completed"
                          ? "bg-green-500/10"
                          : activity.type === "workflow_error"
                          ? "bg-red-500/10"
                          : "bg-blue-500/10"
                      }`}
                    >
                      {activity.type === "workflow_completed" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : activity.type === "workflow_error" ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Activity className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Workflows */}
          <Card>
            <CardHeader>
              <CardTitle>Active Workflows</CardTitle>
              <CardDescription>
                Currently running workflows and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {latestWorkflows && latestWorkflows.length > 0 ? (
                <div className="space-y-4">
                  {latestWorkflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{workflow.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Updated{" "}
                            {new Date(workflow.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          workflow.status === "active" ? "default" : "secondary"
                        }
                      >
                        {workflow.status || "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No active workflows</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href="/workflows/new">Create Workflow</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
