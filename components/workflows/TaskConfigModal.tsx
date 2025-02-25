import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Task } from "@/types/workflow";
import { toast } from "@/hooks/use-toast";
import { Assistant } from "@/types/langgraph";
import { TaskModalHeader } from "./TaskModalHeader";
import { PreviousNodeOutputPanel } from "./PreviousNodeOutputPanel";
import { TaskConfigurationPanel } from "./TaskConfigurationPanel";
import { TestOutputPanel } from "./TestOutputPanel";

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl">
        <TaskModalHeader
          task={currentTask}
          assistant={assistant}
          isLoading={isLoading}
          onTest={handleTest}
        />

        <div className="grid grid-cols-3 gap-4 mt-4">
          <PreviousNodeOutputPanel
            data={previousNodeOutput || null}
            outputFormat={outputFormat}
            setOutputFormat={setOutputFormat}
          />

          <TaskConfigurationPanel
            currentTask={currentTask}
            setCurrentTask={setCurrentTask}
            assistant={assistant}
          />

          <TestOutputPanel
            testOutput={testOutput}
            outputFormat={outputFormat}
            setOutputFormat={setOutputFormat}
            isStreaming={isStreaming}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
