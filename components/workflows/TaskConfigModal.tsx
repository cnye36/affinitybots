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
  onTest: () => Promise<unknown>;
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
  onTest,
}: TaskConfigModalProps) {
  const [currentTask, setCurrentTask] = useState<Task>(task);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("json");
  const [isLoading, setIsLoading] = useState(false);
  const [testOutput, setTestOutput] = useState<TestOutput | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [assistant, setAssistant] = useState<Assistant | null>(null);

  useEffect(() => {
    setCurrentTask(task);
  }, [task]);

  // Separate useEffect for assistant fetching to prevent unnecessary API calls
  useEffect(() => {
    let isMounted = true;

    if (
      isOpen &&
      task.assistant_id &&
      (!assistant || assistant.assistant_id !== task.assistant_id)
    ) {
      fetch(`/api/assistants/${task.assistant_id}`)
        .then((res) => res.json())
        .then((data) => {
          if (isMounted) {
            setAssistant(data);
          }
        })
        .catch((err) => console.error("Error fetching assistant:", err));
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, task.assistant_id, assistant]);

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

      const result = await onTest();
      setTestOutput(result as TestOutput);
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
            required
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
