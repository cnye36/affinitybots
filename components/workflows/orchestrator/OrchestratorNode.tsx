"use client";

import { Handle, Position } from "reactflow";
import { Brain, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { OrchestratorNodeData } from "@/types/workflow";

interface OrchestratorNodeProps {
  data: OrchestratorNodeData;
  selected?: boolean;
}

export function OrchestratorNode({ data, selected }: OrchestratorNodeProps) {
  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-purple-500"
      />

      <Card
        className={cn(
          "min-w-[300px] border-2 transition-all duration-200",
          selected
            ? "border-purple-500 shadow-lg shadow-purple-500/30"
            : "border-purple-300 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-600"
        )}
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg opacity-0 group-hover:opacity-20 blur transition-opacity duration-200" />

        <CardContent className="relative p-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-md">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm text-foreground">
                Manager Agent
              </div>
              <Badge
                variant="outline"
                className="text-xs mt-0.5 border-purple-500/50 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400"
              >
                Orchestrator
              </Badge>
            </div>
          </div>

          {/* Model Display */}
          <div className="text-xs text-muted-foreground mb-3">
            <span className="font-medium">Model:</span>{" "}
            {data.model || "Not configured"}
          </div>

          {/* System Prompt Preview */}
          {data.system_prompt && (
            <div className="text-xs text-muted-foreground mb-3 p-2 bg-muted/50 rounded border">
              <div className="font-medium mb-1">System Prompt:</div>
              <div className="line-clamp-2">
                {data.system_prompt}
              </div>
            </div>
          )}

          {/* Configure Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              data.onConfigure();
            }}
            className="w-full border-purple-500/50 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:border-purple-500"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configure Orchestrator
          </Button>
        </CardContent>
      </Card>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-purple-500"
      />
    </div>
  );
}
