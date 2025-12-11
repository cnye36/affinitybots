import { Activity, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ActivityItem {
  type: "workflow_completed" | "agent_created" | "workflow_error";
  message: string;
  time: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityStyles = (type: ActivityItem['type']) => {
    switch (type) {
      case "workflow_completed":
        return {
          bg: "bg-emerald-500/10",
          icon: "text-emerald-600",
          border: "border-emerald-500/20"
        };
      case "workflow_error":
        return {
          bg: "bg-red-500/10", 
          icon: "text-red-600",
          border: "border-red-500/20"
        };
      default:
        return {
          bg: "bg-blue-500/10",
          icon: "text-blue-600", 
          border: "border-blue-500/20"
        };
    }
  };

  return (
    <Card data-tutorial="activity-section">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>Latest updates from your workspace</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity, i) => {
              const styles = getActivityStyles(activity.type);
              return (
                <div key={i} className="flex items-start space-x-3 group">
                  <div className={`p-2.5 rounded-xl border ${styles.bg} ${styles.border} group-hover:scale-110 transition-transform duration-200`}>
                    {activity.type === "workflow_completed" ? (
                      <CheckCircle2 className={`h-4 w-4 ${styles.icon}`} />
                    ) : activity.type === "workflow_error" ? (
                      <AlertCircle className={`h-4 w-4 ${styles.icon}`} />
                    ) : (
                      <Activity className={`h-4 w-4 ${styles.icon}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-relaxed">{activity.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
