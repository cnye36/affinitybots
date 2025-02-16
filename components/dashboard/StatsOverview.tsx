import { Card, CardContent } from "@/components/ui/card";
import { Activity, CheckCircle2, User, Zap } from "lucide-react";

interface StatsOverviewProps {
  stats: {
    totalWorkflows: number;
    totalAgents: number;
    successRate: string;
    averageResponseTime: string;
  };
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardContent className="pt-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Workflows
              </p>
              <h3 className="text-2xl font-bold mt-2">
                {stats.totalWorkflows}
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
              <h3 className="text-2xl font-bold mt-2">{stats.totalAgents}</h3>
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
              <h3 className="text-2xl font-bold mt-2">{stats.successRate}</h3>
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
  );
}
