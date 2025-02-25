import React, { memo } from "react";
import { Handle, Position } from "reactflow";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Play, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface TriggerNodeData {
  name: string;
  description?: string;
  trigger_type: "manual" | "webhook" | "form" | "integration";
  trigger_id: string;
  workflow_id: string;
  config: Record<string, unknown>;
  status?: "idle" | "running" | "completed" | "error";
  onConfigureTrigger?: (triggerId: string) => void;
  onOpenTaskSidebar?: () => void;
  hasConnectedTask?: boolean;
}

const statusColors = {
  idle: "bg-gray-400",
  running: "bg-blue-400 animate-pulse",
  completed: "bg-green-400",
  error: "bg-red-400",
};

export const TriggerNode = memo(({ data }: { data: TriggerNodeData }) => {
  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onConfigureTrigger) {
      data.onConfigureTrigger(data.trigger_id);
    }
  };

  const handleAddTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onOpenTaskSidebar) {
      data.onOpenTaskSidebar();
    }
  };

  return (
    <div className="relative">
      <Card className="min-w-[200px] max-w-[300px] border-2 border-primary">
        <CardHeader className="p-3 bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-primary/10">
                <Play className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-sm font-medium">Entrypoint</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        statusColors[data.status || "idle"]
                      }`}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Status: {data.status || "idle"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Settings
                      className="text-gray-500 cursor-pointer hover:text-gray-700"
                      size={16}
                      onClick={handleSettingsClick}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Trigger Settings</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          <div className="flex flex-wrap gap-1">
            <Badge
              variant="outline"
              className="text-xs bg-primary/5 hover:bg-primary/10"
            >
              Manual Trigger
            </Badge>
            {data.status && (
              <Badge
                variant={data.status === "error" ? "destructive" : "secondary"}
                className="text-xs"
              >
                {data.status}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            This workflow will start when manually triggered.
          </p>
        </CardContent>
      </Card>

      {/* Add Task Button - Only show if no task is connected */}
      {!data.hasConnectedTask && (
        <div className="absolute -right-40 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-background/60 hover:bg-background"
            onClick={handleAddTask}
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add First Task</span>
          </Button>
        </div>
      )}

      {/* Only show source handle since this is the entrypoint */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 !bg-primary"
        id="trigger-source"
        style={{ right: -4 }}
      />
    </div>
  );
});

TriggerNode.displayName = "TriggerNode";
