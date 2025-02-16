import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { Button } from "@/components/ui/button";
import { Clock, BarChart3 } from "lucide-react";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { LatestWorkflows } from "@/components/dashboard/ActiveWorkflows";
import { formatRelativeTime } from "@/lib/utils";

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

  // Fetch latest workflows
  const { data: workflows, error: workflowsError } = await supabase
    .from("workflows")
    .select("workflow_id, name, created_at, updated_at, status")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

  if (workflowsError) {
    console.error("Error fetching workflows:", workflowsError);
  }

  // Fetch recent activity from the activity_log table
  const { data: activityLogs, error: activityError } = await supabase
    .from("activity_log")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (activityError) {
    console.error("Error fetching activity logs:", activityError);
  }

  // Transform activity logs into the format expected by RecentActivity component
  const recentActivity =
    activityLogs?.map((log) => ({
      type: log.type as
        | "workflow_completed"
        | "assistant_created"
        | "workflow_error",
      message: log.message,
      time: formatRelativeTime(log.created_at),
    })) || [];

  // Fetch total workflow count
  const { count: totalWorkflows, error: workflowCountError } = await supabase
    .from("workflows")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", user.id);

  if (workflowCountError) {
    console.error("Error fetching total workflows:", workflowCountError);
  }

  // Fetch total agents count
  const { count: totalAgents, error: agentCountError } = await supabase
    .from("user_assistants")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (agentCountError) {
    console.error("Error fetching total agents:", agentCountError);
  }

  // Calculate stats
  const stats = {
    totalWorkflows: totalWorkflows || 0,
    totalAgents: totalAgents || 0,
    successRate: "98%", // This should be calculated based on actual success/failure rates
    averageResponseTime: "1.2s", // This should be calculated based on actual response times
  };

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

        <StatsOverview stats={stats} />
        <QuickActions />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentActivity activities={recentActivity} />
          <LatestWorkflows workflows={workflows || []} />
        </div>
      </div>
    </div>
  );
}
