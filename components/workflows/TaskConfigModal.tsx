import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Task } from "@/types/workflow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Assistant } from "@/types/langgraph";
import { TaskModalHeader } from "./TaskModalHeader";

interface TaskOutput {
  result: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

interface TaskConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  previousNodeOutput?: TaskOutput;
  onSave: (updatedTask: Task) => Promise<void>;
}

type OutputFormat = "json" | "markdown" | "text";

type TestOutput = {
  type?: string;
  content?: string;
  result?: unknown;
  error?: string;
};

export function TaskConfigModal({
  isOpen,
  onClose,
  task,
  previousNodeOutput,
  onSave,
}: TaskConfigModalProps) {
  const [currentTask, setCurrentTask] = useState<Task>(task);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("json");
  const [isLoading, setIsLoading] = useState(false);
  const [testOutput, setTestOutput] = useState<TestOutput | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [assistant, setAssistant] = useState<Assistant | null>(null);

  useEffect(() => {
    setCurrentTask(task);
    // Fetch assistant details when task changes
    if (task.assistant_id) {
      fetch(`/api/assistants/${task.assistant_id}`)
        .then((res) => res.json())
        .then((data) => setAssistant(data))
        .catch((err) => console.error("Error fetching assistant:", err));
    }
  }, [task]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onSave(currentTask);
      toast({
        title: "Task configuration saved successfully",
      });
    } catch (err) {
      console.error("Error saving task:", err);
      toast({
        title: "Failed to save task configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    try {
      setIsLoading(true);
      setIsStreaming(true);
      setTestOutput(null);

      if (!currentTask.config?.input?.prompt) {
        throw new Error("Please provide a prompt before testing");
      }

      const response = await fetch(
        `/api/workflows/${currentTask.workflow_id}/tasks/${currentTask.task_id}/execute`,
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
                  content: currentTask.config.input.prompt,
                },
              ],
            },
            config: {
              mode: "stateless",
              stream: true,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to execute task");
      }

      if (response.headers.get("content-type")?.includes("text/event-stream")) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = JSON.parse(line.slice(6));
              if (data.type === "message") {
                setTestOutput((prev) => ({
                  type: "message",
                  content: (prev?.content || "") + data.content,
                }));
              }
            }
          }
        }
      } else {
        const result = await response.json();
        setTestOutput(result);
      }
    } catch (err) {
      console.error("Error testing task:", err);
      toast({
        title:
          typeof err === "string"
            ? err
            : err instanceof Error
            ? err.message
            : "Failed to test task",
        variant: "destructive",
      });
      setTestOutput({
        type: "error",
        error: err instanceof Error ? err.message : "Unknown error occurred",
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const formatOutput = (data: TestOutput | TaskOutput | null): string => {
    if (!data) return "No data available";

    try {
      switch (outputFormat) {
        case "json":
          return typeof data === "string"
            ? data
            : JSON.stringify(data, null, 2);
        case "markdown":
          return typeof data === "string"
            ? data
            : "```json\n" + JSON.stringify(data, null, 2) + "\n```";
        case "text":
          return typeof data === "string"
            ? data
            : JSON.stringify(data, undefined, 2);
        default:
          return String(data);
      }
    } catch {
      return "Error formatting output";
    }
  };

  const renderConfigurationPanel = () => {
    return (
      <div className="space-y-4">
        {/* Task Name */}
        <div className="space-y-2">
          <Label>Task Name</Label>
          <Input
            value={currentTask.name}
            onChange={(e) =>
              setCurrentTask((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </div>

        {/* Task Description (Optional) */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Description
            <span className="text-xs text-muted-foreground">(Optional)</span>
          </Label>
          <Textarea
            value={currentTask.description || ""}
            onChange={(e) =>
              setCurrentTask((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="Add a description to help identify this task's purpose"
          />
        </div>

        {/* Prompt Input */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Prompt
            <span className="text-xs text-muted-foreground">(Required)</span>
          </Label>
          <Textarea
            value={currentTask.config?.input?.prompt || ""}
            onChange={(e) => {
              setCurrentTask((prev) => ({
                ...prev,
                config: {
                  ...prev.config,
                  input: {
                    ...prev.config.input,
                    prompt: e.target.value,
                  },
                },
              }));
            }}
            placeholder={`Enter your prompt for ${
              assistant?.name || "the agent"
            }...`}
            className="min-h-[200px]"
          />
        </div>

        {/* Advanced Configuration */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Advanced Configuration
            <span className="text-xs text-muted-foreground">(JSON)</span>
          </Label>
          <Textarea
            value={JSON.stringify(currentTask.config, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setCurrentTask((prev) => ({
                  ...prev,
                  config: parsed,
                }));
              } catch {
                // Allow invalid JSON while typing
              }
            }}
            className="font-mono"
            rows={10}
          />
        </div>
      </div>
    );
  };

  const renderOutputPanel = (data: TestOutput | TaskOutput | null) => {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Output</Label>
          <Select
            value={outputFormat}
            onValueChange={(value) => setOutputFormat(value as OutputFormat)}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="markdown">Markdown</SelectItem>
              <SelectItem value="text">Text</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Textarea
          value={formatOutput(data)}
          readOnly
          className={`font-mono h-[400px] ${
            isStreaming ? "animate-pulse" : ""
          }`}
        />
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl">
        <TaskModalHeader
          task={currentTask}
          assistant={assistant}
          isLoading={isLoading}
          onTest={handleTest}
          onSave={handleSave}
        />

        <div className="grid grid-cols-3 gap-4 mt-4">
          {/* Previous Node Output Panel */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-4">Previous Node Output</h3>
            <ScrollArea className="h-[600px]">
              {renderOutputPanel(previousNodeOutput || null)}
            </ScrollArea>
          </div>

          {/* Configuration Panel */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-4">Configuration</h3>
            <ScrollArea className="h-[600px]">
              {renderConfigurationPanel()}
            </ScrollArea>
          </div>

          {/* Test Output Panel */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-4">Test Output</h3>
            <ScrollArea className="h-[600px]">
              {renderOutputPanel(testOutput)}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
