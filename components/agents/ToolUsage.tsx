"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AVAILABLE_TOOLS } from "@/lib/tools/config";

interface ToolUsageProps {
  toolId: string;
  input: string;
  output?: string;
  status: "pending" | "approved" | "rejected" | "completed";
  requiresApproval: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}

export function ToolUsage({
  toolId,
  input,
  output,
  status,
  requiresApproval,
  onApprove,
  onReject,
}: ToolUsageProps) {
  const tool = AVAILABLE_TOOLS.find((t) => t.id === toolId);

  return (
    <div className="flex flex-col space-y-3 p-4 rounded-lg border border-border/50 bg-muted/30 dark:bg-muted/10 mx-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {tool?.icon && (
            <tool.icon className="h-5 w-5 text-muted-foreground" />
          )}
          <div className="space-x-2">
            <span className="font-medium text-foreground">
              {tool?.name || toolId}
            </span>
            <Badge
              variant={
                status === "completed"
                  ? "default"
                  : status === "pending"
                  ? "secondary"
                  : status === "approved"
                  ? "default"
                  : "destructive"
              }
              className="capitalize"
            >
              {status}
            </Badge>
          </div>
        </div>
        {requiresApproval && status === "pending" && (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReject}
              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
            >
              Reject
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onApprove}
              className="text-primary hover:text-primary/90 hover:bg-primary/10"
            >
              Approve
            </Button>
          </div>
        )}
      </div>
      <div className="space-y-2 text-sm">
        <div className="text-muted-foreground">
          <span className="font-medium text-foreground/80">Input:</span> {input}
        </div>
        {output && (
          <div className="text-muted-foreground">
            <span className="font-medium text-foreground/80">Output:</span>{" "}
            {output}
          </div>
        )}
      </div>
    </div>
  );
}
