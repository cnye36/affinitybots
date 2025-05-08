import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Settings, UserPlus, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { TaskConfigModal } from "./TaskConfigModal";
import { TaskNodeData, Task } from "@/types/workflow";
import { Agent } from "@/types/agent";

interface TaskNodeProps {
  data: TaskNodeData & {
    onAssignAgent?: (taskId: string) => void;
    onConfigureTask?: (taskId: string) => void;
    assignedAgent?: {
      id: string;
      name: string;
      avatar?: string;
    };
    isActive?: boolean;
    onAddTask?: () => void;
    isConfigOpen?: boolean;
    onConfigClose?: () => void;
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

    const handleTaskUpdate = (
      updatedTask: Task,
      updatedAgent: Agent | null
    ) => {
      // Dispatch update event with all necessary fields
      const event = new CustomEvent("updateTaskNode", {
        detail: {
          taskId: props.data.workflow_task_id,
          updates: {
            name: updatedTask.name,
            description: updatedTask.description,
            type: updatedTask.task_type,
            assignedAgent: updatedAgent
              ? {
                  id: updatedAgent.id,
                  name: updatedAgent.name,
                  avatar: updatedAgent.agent_avatar,
                }
              : props.data.assignedAgent,
            config: updatedTask.config,
          },
        },
      });
      window.dispatchEvent(event);
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

    const handleCardDoubleClick = () => {
      if (props.data.onConfigureTask && props.data.workflow_task_id) {
        props.data.onConfigureTask(props.data.workflow_task_id);
      }
    };

    return (
      <>
        <Card
          className={`min-w-[200px] max-w-[300px] relative group ${
            props.data.isActive
              ? "border-2 border-primary"
              : "border border-border"
          }`}
          onDoubleClick={handleCardDoubleClick}
        >
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
                          statusColors[
                            props.data.status as keyof typeof statusColors
                          ]
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

            {/* Add Task Button - Show on the right side */}
            <div className="absolute -right-40 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-background/60 hover:bg-background"
                onClick={(e) => {
                  e.stopPropagation();
                  props.data.onAddTask?.();
                }}
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Task</span>
              </Button>
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
            task_type: props.data.task_type,
            assignedAgent: props.data.assignedAgent,
            status: props.data.status,
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
            position: props.data.position,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_run_at: new Date().toISOString(),
            owner_id: props.data.owner_id,
            metadata: {},
          }}
          onTest={handleTestTask}
          onUpdate={handleTaskUpdate}
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
    prevProps.data.isActive === nextProps.data.isActive &&
    JSON.stringify(prevProps.data.config) ===
      JSON.stringify(nextProps.data.config) &&
    JSON.stringify(prevProps.data.assignedAgent) ===
      JSON.stringify(nextProps.data.assignedAgent)
);

MemoizedTaskNode.displayName = "MemoizedTaskNode";
