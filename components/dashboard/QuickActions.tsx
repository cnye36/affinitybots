import Link from "next/link";
import { PlusCircle, Settings2, Wrench, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface QuickAction {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  color: "primary" | "blue" | "green" | "orange";
  tutorial?: string;
}

const quickActions: QuickAction[] = [
  {
    href: "/agents/new",
    icon: PlusCircle,
    title: "Create New Agent",
    description: "Design a custom AI agent with specific capabilities",
    color: "primary",
    tutorial: "create-agent"
  },
  {
    href: "/workflows/new", 
    icon: PlusCircle,
    title: "New Workflow",
    description: "Build a multi-agent workflow from scratch",
    color: "blue",
    tutorial: "dashboard-new-workflow"
  },
  {
    href: "/tools",
    icon: Wrench,
    title: "Manage Integrations",
    description: "Configure and connect tools to your agents",
    color: "green"
  },
  {
    href: "/settings",
    icon: Settings2,
    title: "Settings",
    description: "Configure your workspace and preferences",
    color: "orange"
  }
] ;

export function QuickActions() {
  return (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">Quick Actions</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Get started with common tasks
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => {
          const IconComponent = action.icon;
          const colorClasses = {
            primary: "bg-primary/10 text-primary group-hover:bg-primary/20",
            blue: "bg-blue-500/10 text-blue-600 group-hover:bg-blue-500/20",
            green: "bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/20",
            orange: "bg-orange-500/10 text-orange-600 group-hover:bg-orange-500/20"
          };
          
          return (
            <Link 
              key={index}
              href={action.href} 
              className="group" 
              data-tutorial={action.tutorial}
            >
              <Card className="h-full transition-all duration-200 group-hover:shadow-md group-hover:scale-[1.02]">
                <CardContent className="p-6">
                  <div className="flex flex-col items-start space-y-4">
                    <div className={`p-3 rounded-xl transition-colors ${colorClasses[action.color]}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
