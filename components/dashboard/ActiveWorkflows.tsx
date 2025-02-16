import Link from "next/link";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Workflow {
  workflow_id: string;
  name: string;
  status: string;
  updated_at: string;
}

interface LatestWorkflowsProps {
  workflows: Workflow[];
}

export function LatestWorkflows({ workflows }: LatestWorkflowsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest Workflows</CardTitle>
        <CardDescription>
          Your most recently created or updated workflows
        </CardDescription>
      </CardHeader>
      <CardContent>
        {workflows && workflows.length > 0 ? (
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <div
                key={workflow.workflow_id}
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
            <p className="text-muted-foreground">No workflows yet</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/workflows/new">Create Workflow</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
