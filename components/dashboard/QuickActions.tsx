import Link from "next/link";
import { PlusCircle, Settings2 } from "lucide-react";

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <Link href="/agents/new" className="group" data-tutorial="create-agent">
        <div className="relative p-6 rounded-lg overflow-hidden border group-hover:border-primary transition-colors">
          <div className="flex items-center space-x-4">
            <PlusCircle className="h-8 w-8 text-primary" />
            <div>
              <h3 className="text-lg font-semibold mb-1">Create New Agent</h3>
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
  );
}
