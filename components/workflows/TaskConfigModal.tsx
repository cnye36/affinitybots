import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Task } from "@/types/workflow";
import { Button } from "@/components/ui/button";
import { Play, Save } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

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
  onTest: () => Promise<void>;
}

export function TaskConfigModal({
  isOpen,
  onClose,
  task,
  previousNodeOutput,
  onSave,
  onTest,
}: TaskConfigModalProps) {
  const [currentTask, setCurrentTask] = useState<Task>(task);
  const [outputFormat, setOutputFormat] = useState<"json" | "yaml" | "text">(
    "json"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [testOutput, setTestOutput] = useState<any>(null);

  useEffect(() => {
    setCurrentTask(task);
  }, [task]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onSave(currentTask);
      toast({
        title: "Task configuration saved successfully",
      });
    } catch (error) {
      console.error("Error saving task:", error);
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
      await onTest();
      // In a real implementation, we would get the test output from the onTest callback
      setTestOutput({ result: "Test output would appear here" });
    } catch (error) {
      console.error("Error testing task:", error);
      toast({
        title: "Failed to test task",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderConfigurationPanel = () => {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Task Name</Label>
          <Input
            value={currentTask.name}
            onChange={(e) =>
              setCurrentTask((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={currentTask.description}
            onChange={(e) =>
              setCurrentTask((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Input Configuration</Label>
          <Textarea
            value={JSON.stringify(currentTask.config.input, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setCurrentTask((prev) => ({
                  ...prev,
                  config: { ...prev.config, input: parsed },
                }));
              } catch (error) {
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

  const renderOutputPanel = (data: any) => {
    if (!data)
      return <div className="text-muted-foreground">No data available</div>;

    let formattedOutput = "";
    try {
      switch (outputFormat) {
        case "json":
          formattedOutput = JSON.stringify(data, null, 2);
          break;
        case "yaml":
          // In a real implementation, we would use a YAML library
          formattedOutput = "YAML format not implemented";
          break;
        case "text":
          formattedOutput =
            typeof data === "string" ? data : JSON.stringify(data);
          break;
      }
    } catch (error) {
      formattedOutput = "Error formatting output";
    }

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Output</Label>
          <div className="space-x-2">
            <Button
              variant={outputFormat === "json" ? "default" : "outline"}
              size="sm"
              onClick={() => setOutputFormat("json")}
            >
              JSON
            </Button>
            <Button
              variant={outputFormat === "yaml" ? "default" : "outline"}
              size="sm"
              onClick={() => setOutputFormat("yaml")}
            >
              YAML
            </Button>
            <Button
              variant={outputFormat === "text" ? "default" : "outline"}
              size="sm"
              onClick={() => setOutputFormat("text")}
            >
              Text
            </Button>
          </div>
        </div>
        <Textarea
          value={formattedOutput}
          readOnly
          className="font-mono h-[400px]"
        />
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Configure Task: {task.name}</span>
            <div className="space-x-2">
              <Button
                onClick={handleTest}
                disabled={isLoading}
                variant="secondary"
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Test
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 mt-4">
          {/* Previous Node Output Panel */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-4">Previous Node Output</h3>
            <ScrollArea className="h-[600px]">
              {renderOutputPanel(previousNodeOutput)}
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
