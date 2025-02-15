import React, { memo, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Task, TaskType } from "@/types/workflow";
import { TaskConfigModal } from "./TaskConfigModal";

interface TaskNodeProps {
  data: {
    name: string;
    type: TaskType;
    description?: string;
    task_id: string;
    assistant_id: string;
    workflowId: string;
    status?: "idle" | "running" | "completed" | "error";
    onConfigureTask?: (task_id: string) => void;
  };
  isConfigOpen?: boolean;
  onConfigClose?: () => void;
}

const statusColors = {
  idle: "bg-gray-400",
  running: "bg-blue-400 animate-pulse",
  completed: "bg-green-400",
  error: "bg-red-400",
};

export const MemoizedTaskNode = memo((props: NodeProps) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const handleConfigOpen = () => {
    setIsConfigOpen(true);
  };

  const handleConfigClose = () => {
    setIsConfigOpen(false);
  };

  return (
    <TaskNode
      data={{
        ...props.data,
        onConfigureTask: () => handleConfigOpen(),
      }}
      isConfigOpen={isConfigOpen}
      onConfigClose={handleConfigClose}
    />
  );
});

MemoizedTaskNode.displayName = "MemoizedTaskNode";

export const TaskNode = memo(
  ({ data, isConfigOpen, onConfigClose }: TaskNodeProps) => {
    const handleSettingsClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (data.onConfigureTask && data.task_id) {
        data.onConfigureTask(data.task_id);
      }
    };

    const handleSaveTask = async (updatedTask: Task) => {
      try {
        const response = await fetch(
          `/api/workflows/${data.workflowId}/tasks/${data.task_id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedTask),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update task");
        }
      } catch (error) {
        console.error("Error saving task:", error);
        throw error;
      }
    };

    const handleTestTask = async () => {
      try {
        const response = await fetch(
          `/api/workflows/${data.workflowId}/tasks/${data.task_id}/test`,
          {
            method: "POST",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to test task");
        }

        const result = await response.json();
        return result;
      } catch (error) {
        console.error("Error testing task:", error);
        throw error;
      }
    };

    const taskConfig = {
      task_id: data.task_id,
      name: data.name,
      description: data.description || "",
      type: data.type,
      assistant_id: data.assistant_id,
      workflow_id: data.workflowId,
      config: {
        input: {
          source: "previous_node",
          parameters: {},
        },
        output: {
          destination: "next_node",
        },
      },
    };

    return (
      <>
        <Card className="min-w-[200px] max-w-[300px]">
          <CardHeader className="p-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm truncate flex-1">
                {data.name}
              </CardTitle>
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
                      <p>Task Settings</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs">
                {data.type}
              </Badge>
              {data.status && (
                <Badge
                  variant={
                    data.status === "error" ? "destructive" : "secondary"
                  }
                  className="text-xs"
                >
                  {data.status}
                </Badge>
              )}
            </div>
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

        <TaskConfigModal
          isOpen={Boolean(isConfigOpen)}
          onClose={onConfigClose || (() => {})}
          task={taskConfig}
          onSave={handleSaveTask}
          onTest={handleTestTask}
        />
      </>
    );
  }
);

TaskNode.displayName = "TaskNode";
