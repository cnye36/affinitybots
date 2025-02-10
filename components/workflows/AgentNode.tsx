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
import { Assistant, WorkflowTask, TaskType } from "@/types/index";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskModal } from "./TaskModal";
import { toast } from "react-toastify";

interface TaskConfig {
  input?: { source?: string };
  output?: { destination?: string };
}

interface AgentNodeProps {
  data: {
    label: string;
    assistant_id: string;
    workflowId?: string;
  };
}


export const AgentNode = memo(({ data }: AgentNodeProps) => {
  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<WorkflowTask | undefined>(
    undefined
  );

  useEffect(() => {
    const fetchAssistantAndTasks = async () => {
      try {
        const [assistantResponse, tasksResponse] = await Promise.all([
          fetch(`/api/assistants/${data.assistant_id}`).then(res => {
            if (!res.ok) throw new Error('Failed to fetch assistant');
            return res.json();
          }),
          data.workflowId
            ? fetch(`/api/workflows/${data.workflowId}/tasks?assistant_id=${data.assistant_id}`).then(res => {
                if (!res.ok) throw new Error('Failed to fetch tasks');
                return res.json();
              })
            : Promise.resolve({ tasks: [] }),
        ]);
        setAssistant(assistantResponse);
        setTasks(tasksResponse.tasks || []);
      } catch (err) {
        console.error("Error fetching assistant or tasks:", err);
        setError("Failed to load assistant data");
      } finally {
        setLoading(false);
      }
    };

    fetchAssistantAndTasks();
  }, [data.assistant_id, data.workflowId]);

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
    setSelectedTask(undefined);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (e: React.MouseEvent, task: WorkflowTask) => {
    e.stopPropagation();
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (taskData: Partial<WorkflowTask>) => {
    if (!data.workflowId) {
      toast.error("Cannot create task without workflow");
      return;
    }

    try {
      if (selectedTask) {
        // Update existing task
        const response = await fetch(
          `/api/workflows/${data.workflowId}/tasks/${selectedTask.task_id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(taskData),
          }
        );
        
        if (!response.ok) throw new Error('Failed to update task');
        const updatedTask = await response.json();
        
        setTasks(
          tasks.map((t) =>
            t.task_id === selectedTask.task_id ? updatedTask : t
          )
        );
        toast.success("Task updated successfully");
      } else {
        // Create new task
        const response = await fetch(
          `/api/workflows/${data.workflowId}/tasks`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...taskData,
              assistant_id: data.assistant_id,
              workflow_id: data.workflowId,
            }),
          }
        );
        
        if (!response.ok) throw new Error('Failed to create task');
        const newTask = await response.json();
        
        setTasks([...tasks, newTask]);
        toast.success("Task created successfully");
      }
    } catch (err) {
      console.error("Error saving task:", err);
      toast.error("Failed to save task");
      throw err;
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

  if (error || !assistant) {
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
                    key={task.task_id}
                    className="flex items-center justify-between bg-muted/50 rounded-sm p-1 text-xs cursor-pointer hover:bg-muted"
                    onClick={(e) => handleEditTask(e, task)}
                  >
                    <span className="truncate flex-1">{task.name}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {task.task_type}
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
      {assistant && (
        <AgentConfigModal
          open={isConfigModalOpen}
          onOpenChange={setIsConfigModalOpen}
          assistant={assistant}
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
          agentId={data.assistant_id}
          workflowId={data.workflowId}
          initialTask={
            selectedTask
              ? {
                  task_id: selectedTask.task_id,
                  name: selectedTask.name,
                  description: selectedTask.description || "",
                  type: selectedTask.task_type as TaskType,
                  agentId: selectedTask.assistant_id,
                  workflowId: selectedTask.workflow_id,
                  config: {
                    input: {
                      source:
                        (selectedTask.config as TaskConfig)?.input?.source ||
                        "previous_agent",
                    },
                    output: {
                      destination:
                        (selectedTask.config as TaskConfig)?.output
                          ?.destination || "next_agent",
                    },
                  },
                }
              : undefined
          }
        />
      )}
    </>
  );
});

AgentNode.displayName = "AgentNode";
