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

const statCards = [
  {
    title: "Total Agents",
    value: (stats: StatsOverviewProps['stats']) => stats.totalAgents.toString(),
    icon: User,
    color: "primary",
    description: "Active AI agents"
  },
  {
    title: "Total Workflows", 
    value: (stats: StatsOverviewProps['stats']) => stats.totalWorkflows.toString(),
    icon: Zap,
    color: "primary", 
    description: "Automation workflows"
  },
  {
    title: "Success Rate",
    value: (stats: StatsOverviewProps['stats']) => stats.successRate,
    icon: CheckCircle2,
    color: "green",
    description: "Task completion rate"
  },
  {
    title: "Avg Response Time",
    value: (stats: StatsOverviewProps['stats']) => stats.averageResponseTime,
    icon: Activity,
    color: "blue",
    description: "System performance"
  }
] as const;

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-tutorial="stats-overview">
      {statCards.map((card, index) => {
        const IconComponent = card.icon;
        const colorClasses = {
          primary: "bg-primary/10 text-primary",
          green: "bg-emerald-500/10 text-emerald-600",
          blue: "bg-blue-500/10 text-blue-600"
        };
        
        return (
          <Card key={index} className="relative overflow-hidden hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <h3 className="text-3xl font-bold tracking-tight">
                    {card.value(stats)}
                  </h3>
                </div>
                <div className={`p-3 rounded-xl ${colorClasses[card.color]}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
