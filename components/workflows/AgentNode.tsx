import React, { memo, useEffect, useState } from "react";
import { Handle, Position } from "reactflow";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import axios from "axios";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Activity, Settings, Plus } from "lucide-react";
import { AgentConfigModal } from "../configuration/AgentConfigModal";
import { AgentConfig } from "@/types/index";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskModal } from "./TaskModal";
import { toast } from "react-toastify";

interface AgentNodeProps {
  data: {
    label: string;
    agentId: string;
    workflowId?: string;
  };
}

export const AgentNode = memo(({ data }: AgentNodeProps) => {
  const [agent, setAgent] = useState<AgentConfig | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);

  useEffect(() => {
    const fetchAgentAndTasks = async () => {
      try {
        const [agentResponse, tasksResponse] = await Promise.all([
          axios.get(`/api/assistants/${data.assistantId}`),
          axios.get(`/api/tasks?assistantId=${data.assistantId}`),
        ]);
        setAgent(agentResponse.data);
        setTasks(tasksResponse.data.tasks || []);
      } catch (err) {
        console.error("Error fetching agent or tasks:", err);
        setError("Failed to load agent data");
      } finally {
        setLoading(false);
      }
    };

    fetchAgentAndTasks();
  }, [data.agentId]);

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfigModalOpen(true);
  };

  const handleAddTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTask(undefined);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    try {
      if (selectedTask) {
        // Update existing task
        const response = await axios.put(
          `/api/tasks/${selectedTask.id}`,
          taskData
        );
        setTasks(
          tasks.map((t) => (t.id === selectedTask.id ? response.data : t))
        );
        toast.success("Task updated successfully");
      } else {
        // Create new task
        const response = await axios.post("/api/tasks", taskData);
        setTasks([...tasks, response.data]);
        toast.success("Task created successfully");
      }
    } catch (err) {
      console.error("Error saving task:", err);
      toast.error("Failed to save task");
      throw err;
    }
  };

  const handleConfigSave = async (updatedConfig: AgentConfig) => {
    try {
      const response = await axios.put(
        `/api/assistants/${data.assistantId}`,
        updatedConfig
      );
      setAgent(response.data);
      setIsConfigModalOpen(false);
      toast.success("Agent configuration updated");
    } catch (err) {
      console.error("Error updating agent:", err);
      toast.error("Failed to update agent configuration");
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
      </Card>
    );
  }

  if (error || !agent) {
    return (
      <Card className="w-64 bg-red-100">
        <CardHeader>
          <CardTitle className="text-sm">Error</CardTitle>
        </CardHeader>
        <Handle type="target" position={Position.Top} className="w-2 h-2" />
        <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
      </Card>
    );
  }

  return (
    <>
      <Card className="w-64">
        <CardHeader className="p-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm truncate flex-1">
              {agent.name}
            </CardTitle>
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Activity className="text-gray-500" size={16} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Agent Status</p>
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
                    <p>Open Agent Settings</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted-foreground">
              Tasks ({tasks.length})
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleAddTask}
            >
              <Plus size={14} />
            </Button>
          </div>
          <ScrollArea className="h-[100px]">
            {tasks.length > 0 ? (
              <div className="space-y-1">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between bg-muted/50 rounded-sm p-1 text-xs cursor-pointer hover:bg-muted"
                    onClick={(e) => handleEditTask(e, task)}
                  >
                    <span className="truncate flex-1">{task.name}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {task.type}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground text-center py-2">
                No tasks configured
              </div>
            )}
          </ScrollArea>
        </CardContent>
        <Handle type="target" position={Position.Top} className="w-2 h-2" />
        <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
      </Card>
      {agent && (
        <AgentConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          agentId={agent.id}
          initialConfig={agent}
          onSave={handleConfigSave}
        />
      )}
      {data.workflowId && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedTask(undefined);
          }}
          onSave={handleSaveTask}
          agentId={data.agentId}
          workflowId={data.workflowId}
          initialTask={selectedTask}
        />
      )}
    </>
  );
});

AgentNode.displayName = "AgentNode";
