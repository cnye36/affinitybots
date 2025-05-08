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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates from your workspace</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, i) => (
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
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
