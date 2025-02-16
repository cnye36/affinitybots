import React, { memo, useEffect, useState } from "react";
import { Handle, Position } from "reactflow";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Settings, Plus, UserPlus } from "lucide-react";
import { AgentConfigModal } from "../configuration/AgentConfigModal";
import { Assistant } from "@/types/langgraph";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface AgentNodeProps {
  data: {
    label: string;
    assistant_id: string;
    workflowId?: string;
    onAddTask?: (agentId: string) => void;
    onAddAgent?: (sourceAgentId: string) => void;
    isFirstAgent?: boolean;
    hasTask?: boolean;
    status?: "idle" | "running" | "completed" | "error";
  };
}

const statusColors = {
  idle: "bg-gray-400",
  running: "bg-blue-400 animate-pulse",
  completed: "bg-green-400",
  error: "bg-red-400",
};

export const AgentNode = memo(({ data }: AgentNodeProps) => {
  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  useEffect(() => {
    const fetchAssistant = async () => {
      try {
        const response = await fetch(`/api/assistants/${data.assistant_id}`);
        if (!response.ok) throw new Error("Failed to fetch assistant");
        const assistantData = await response.json();
        setAssistant(assistantData);
      } catch (err) {
        console.error("Error fetching assistant:", err);
        setError("Failed to load assistant data");
      } finally {
        setLoading(false);
      }
    };

    fetchAssistant();
  }, [data.assistant_id]);

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!assistant) {
      console.error("Assistant data not loaded");
      return;
    }
    setIsConfigModalOpen(true);
  };

  const handleAddTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onAddTask) {
      data.onAddTask(data.assistant_id);
    }
  };

  const handleAddAgent = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onAddAgent) {
      data.onAddAgent(data.assistant_id);
    }
  };

  if (loading) {
    return (
      <Card className="w-64 bg-gray-100">
        <CardHeader>
          <CardTitle className="text-sm">Loading...</CardTitle>
        </CardHeader>
        <Handle type="target" position={Position.Top} className="w-2 h-2" />
        <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
        <Handle
          type="source"
          position={Position.Right}
          className="w-2 h-2 !bg-primary"
          id="task-handle"
        />
      </Card>
    );
  }

  if (error || !assistant) {
    return (
      <Card className="w-64 bg-red-100">
        <CardHeader>
          <CardTitle className="text-sm">Error</CardTitle>
        </CardHeader>
        <Handle type="target" position={Position.Top} className="w-2 h-2" />
        <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
        <Handle
          type="source"
          position={Position.Right}
          className="w-2 h-2 !bg-primary"
          id="task-handle"
        />
      </Card>
    );
  }

  return (
    <>
      <div className="relative group">
        <Card className="w-64">
          <CardHeader className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  {assistant.avatar ||
                  assistant.config?.configurable?.avatar ? (
                    <AvatarImage
                      src={
                        assistant.avatar ||
                        assistant.config?.configurable?.avatar
                      }
                      alt={assistant.name}
                    />
                  ) : (
                    <AvatarFallback
                      style={{
                        backgroundColor: `hsl(${
                          (assistant.name.length * 30) % 360
                        }, 70%, 50%)`,
                      }}
                    >
                      {assistant.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <CardTitle className="text-sm truncate">
                  {assistant.name}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
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
                      <p>Open Assistant Settings</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-xs text-muted-foreground">
              {(assistant.metadata?.description as string) ||
                "No description available"}
            </p>
            {data.status && (
              <Badge
                variant={data.status === "error" ? "destructive" : "secondary"}
                className="mt-2"
              >
                {data.status}
              </Badge>
            )}
          </CardContent>

          {/* Connection Points */}
          <Handle
            type="target"
            position={Position.Top}
            className="w-2 h-2 !bg-muted-foreground"
            id="agent-target"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            className="w-2 h-2 !bg-muted-foreground"
            id="agent-source"
          />
          <Handle
            type="source"
            position={Position.Right}
            className="w-2 h-2 !bg-primary"
            id="task-handle"
            style={{ top: "50%", right: -4 }}
          />

          {/* Add Task Button */}
          <div className="absolute -right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full w-8 h-8 p-0"
                    onClick={handleAddTask}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add Task</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Add Agent Button - Only show if agent has tasks */}
          {data.hasTask && (
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full w-8 h-8 p-0"
                      onClick={handleAddAgent}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add Next Agent</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </Card>
      </div>

      {assistant && (
        <AgentConfigModal
          open={isConfigModalOpen}
          onOpenChange={setIsConfigModalOpen}
          assistant={assistant}
        />
      )}
    </>
  );
});

AgentNode.displayName = "AgentNode";
