import React, { memo, useEffect, useState } from "react";
import { Handle, Position } from "reactflow";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Activity, Settings, Plus } from "lucide-react";
import { AgentConfigModal } from "../configuration/AgentConfigModal";
import { Assistant } from "@/types/index";
import { Button } from "@/components/ui/button";

interface AgentNodeProps {
  data: {
    label: string;
    assistant_id: string;
    workflowId?: string;
    onAddTask?: (agentId: string) => void;
    isFirstAgent?: boolean;
  };
}

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
    data.onAddTask?.(data.assistant_id);
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
              <CardTitle className="text-sm truncate flex-1">
                {assistant.name}
              </CardTitle>
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Activity className="text-gray-500" size={16} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Assistant Status</p>
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
