import React, { memo } from "react";
import { Handle, Position } from "reactflow";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TaskType } from "@/types";

interface TaskNodeProps {
  data: {
    name: string;
    type: TaskType;
    description?: string;
    task_id: string;
    assistant_id: string;
    workflowId: string;
  };
}

export const TaskNode = memo(({ data }: TaskNodeProps) => {
  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement task settings modal
  };

  return (
    <Card className="w-48">
      <CardHeader className="p-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm truncate flex-1">{data.name}</CardTitle>
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
                <p>Task Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <Badge variant="secondary" className="text-xs">
          {data.type}
        </Badge>
        {data.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {data.description}
          </p>
        )}
      </CardContent>

      {/* Task Connection Points */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 !bg-primary"
        id="task-target"
        style={{ left: -4 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 !bg-primary"
        id="task-source"
        style={{ right: -4 }}
      />
    </Card>
  );
});

TaskNode.displayName = "TaskNode";
