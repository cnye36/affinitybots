import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Settings, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Task, TaskNodeData, TaskType } from "@/types/workflow";
import { TaskConfigModal } from "./TaskConfigModal";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface TaskNodeProps {
  data: TaskNodeData & {
    onAssignAgent?: (taskId: string) => void;
    assignedAgent?: {
      id: string;
      name: string;
      avatar?: string;
    };
  };
}

const statusColors = {
  idle: "bg-gray-400",
  running: "bg-blue-400 animate-pulse",
  completed: "bg-green-400",
  error: "bg-red-400",
};

export const MemoizedTaskNode = memo(
  (props: NodeProps<TaskNodeProps["data"]>) => {
    const handleSettingsClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (props.data.onConfigureTask && props.data.workflow_task_id) {
        props.data.onConfigureTask(props.data.workflow_task_id);
      }
    };

    const handleAssignAgent = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (props.data.onAssignAgent && props.data.workflow_task_id) {
        props.data.onAssignAgent(props.data.workflow_task_id);
      }
    };

    const handleSaveTask = async (updatedTask: Task) => {
      try {
        // Ensure we have a valid assistant_id
        if (!updatedTask.assistant_id) {
          throw new Error("Assistant ID is required");
        }

        const response = await fetch(
          `/api/workflows/${props.data.workflow_id}/tasks/${props.data.workflow_task_id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...updatedTask,
              // Ensure these fields are always included
              workflow_id: props.data.workflow_id,
              workflow_task_id: props.data.workflow_task_id,
              assistant_id: updatedTask.assistant_id,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to update task");
        }

        const savedTask = await response.json();

        // Dispatch update event with all necessary fields
        const event = new CustomEvent("updateTaskNode", {
          detail: {
            taskId: props.data.workflow_task_id,
            updates: {
              name: savedTask.name,
              description: savedTask.description,
              type: savedTask.task_type as TaskType,
              assistant_id: savedTask.assistant_id,
              config: savedTask.config,
            },
          },
        });
        window.dispatchEvent(event);

        return savedTask;
      } catch (error) {
        console.error("Error saving task:", error);
        throw error;
      }
    };

    const handleTestTask = async () => {
      try {
        const response = await fetch(
          `/api/workflows/${props.data.workflow_id}/tasks/${props.data.workflow_task_id}/execute`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              input: {
                messages: [
                  {
                    role: "user",
                    content: props.data.config.input.prompt,
                  },
                ],
              },
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to execute task");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let result = "";

        if (!reader) {
          throw new Error("No response body");
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              try {
                const parsedData = JSON.parse(data);
                result = parsedData;
              } catch (e) {
                console.warn("Failed to parse SSE data:", e);
              }
            }
          }
        }

        return result;
      } catch (error) {
        console.error("Error testing task:", error);
        throw error;
      }
    };

    return (
      <>
        <Card className="min-w-[200px] max-w-[300px] relative group">
          <CardHeader className="p-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm truncate flex-1">
                {props.data.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`w-3 h-3 rounded-full ${
                          statusColors[props.data.status || "idle"]
                        }`}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Status: {props.data.status || "idle"}</p>
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
                {props.data.task_type}
              </Badge>
              {props.data.status && (
                <Badge
                  variant={
                    props.data.status === "error" ? "destructive" : "secondary"
                  }
                  className="text-xs"
                >
                  {props.data.status}
                </Badge>
              )}
            </div>
            {props.data.description && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {props.data.description}
              </p>
            )}

            {/* Agent Assignment Section */}
            <div className="mt-3 pt-3 border-t">
              {props.data.assignedAgent ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    {props.data.assignedAgent.avatar ? (
                      <AvatarImage
                        src={props.data.assignedAgent.avatar}
                        alt={props.data.assignedAgent.name}
                      />
                    ) : (
                      <AvatarFallback>
                        {props.data.assignedAgent.name
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="text-xs">
                    {props.data.assignedAgent.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={handleAssignAgent}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleAssignAgent}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Agent
                </Button>
              )}
            </div>
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
          isOpen={Boolean(props.data.isConfigOpen)}
          onClose={props.data.onConfigClose || (() => {})}
          task={{
            workflow_task_id: props.data.workflow_task_id,
            workflow_id: props.data.workflow_id,
            name: props.data.name,
            description: props.data.description || "",
            type: props.data.task_type,
            assistant_id: props.data.assistant_id,
            config: {
              input: {
                source: "previous_node",
                parameters: {},
                prompt: props.data.config?.input?.prompt || "",
              },
              output: {
                destination: "next_node",
              },
            },
          }}
          onSave={handleSaveTask}
          onTest={handleTestTask}
        />
      </>
    );
  },
  (prevProps, nextProps) =>
    prevProps.data.name === nextProps.data.name &&
    prevProps.data.task_type === nextProps.data.task_type &&
    prevProps.data.description === nextProps.data.description &&
    prevProps.data.status === nextProps.data.status &&
    prevProps.data.isConfigOpen === nextProps.data.isConfigOpen &&
    JSON.stringify(prevProps.data.config) ===
      JSON.stringify(nextProps.data.config) &&
    JSON.stringify(prevProps.data.assignedAgent) ===
      JSON.stringify(nextProps.data.assignedAgent)
);

MemoizedTaskNode.displayName = "MemoizedTaskNode";
