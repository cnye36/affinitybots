"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { Brain, Play, Loader2, CheckCircle2, XCircle, Bot, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { LLM_OPTIONS, legacyModelToLlmId } from "@/lib/llm/catalog";
import ReactMarkdown from "react-markdown";

interface OrchestratorStep {
  type: "orchestrator_decision" | "agent_execution" | "orchestrator_evaluation" | "completion";
  timestamp: string;
  agent?: string;
  instruction?: string;
  response?: string;
  decision?: string;
  finalResult?: string;
}

interface OrchestratorConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string;
  initialConfig?: {
    system_prompt: string;
    user_prompt: string;
    model: string;
  };
  onSave: (config: any) => void;
}

export function OrchestratorConfigModal({
  open,
  onOpenChange,
  workflowId,
  initialConfig,
  onSave,
}: OrchestratorConfigModalProps) {
  const defaultSystemPrompt = `You are a manager agent coordinating a team of AI assistants.

Your job is to:
1. Analyze the user's request
2. Break it down into sub-tasks
3. Delegate each sub-task to the appropriate agent (ONE agent at a time)
4. Review agent outputs and decide next steps
5. Signal completion when the goal is achieved

Available agents and their capabilities will be provided below.

CRITICAL: Respond with ONLY valid JSON. No markdown, no explanations.

To delegate work to ONE agent, respond with JSON only:
{
  "agent": "agent_name",
  "instruction": "what you want them to do"
}

To signal completion, respond with JSON only:
{
  "complete": true,
  "final_result": "summary of work completed"
}

Remember: Delegate ONE agent at a time, not a plan with multiple agents.`;

  const [systemPrompt, setSystemPrompt] = useState(
    initialConfig?.system_prompt || defaultSystemPrompt
  );

  const [userPrompt, setUserPrompt] = useState(
    initialConfig?.user_prompt || ""
  );

  // Ensure model has correct format (with provider prefix)
  // Use legacyModelToLlmId to handle both legacy and new formats, default to gpt-5.2
  const normalizeModel = (modelValue: string | undefined): string => {
    if (!modelValue) return "openai:gpt-5.2";
    // Handle legacy format (without provider prefix)
    const llmId = legacyModelToLlmId(modelValue);
    return llmId || "openai:gpt-5.2"; // Default to gpt-5.2
  };

  const [model, setModel] = useState(
    normalizeModel(initialConfig?.model)
  );

  // Test execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [steps, setSteps] = useState<OrchestratorStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<"json" | "formatted">("formatted");

  // Update state when initialConfig changes
  useEffect(() => {
    if (initialConfig) {
      setSystemPrompt(initialConfig.system_prompt || defaultSystemPrompt);
      setUserPrompt(initialConfig.user_prompt || "");
      setModel(normalizeModel(initialConfig.model));
    }
  }, [initialConfig]);

  // Reset test state when modal closes
  useEffect(() => {
    if (!open) {
      setIsExecuting(false);
      setExecutionStatus("idle");
      setSteps([]);
      setError(null);
    }
  }, [open]);

  // Auto-save function that saves current config
  const autoSave = () => {
    // Pass config directly, not wrapped in manager (handleSaveOrchestratorConfig wraps it)
    onSave({
      system_prompt: systemPrompt,
      user_prompt: userPrompt,
      model: model,
    });
  };

  // Handle field blur - save when user clicks out of field
  const handleSystemPromptBlur = () => {
    autoSave();
  };

  const handleUserPromptBlur = () => {
    autoSave();
  };

  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    // Save immediately when model changes
    setTimeout(() => {
      onSave({
        system_prompt: systemPrompt,
        user_prompt: userPrompt,
        model: newModel,
      });
    }, 0);
  };

  const handleExecute = async () => {
    if (!userPrompt) {
      setError("Please enter a workflow goal first");
      return;
    }

    setIsExecuting(true);
    setExecutionStatus("running");
    setSteps([]);
    setError(null);

    try {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        // Try to parse error response
        let errorMessage = "Failed to execute orchestrator workflow";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error("Orchestrator execution error:", errorData);
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }
        throw new Error(errorMessage);
      }

      // Read the stream and parse events
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Split complete events by double newline; keep remainder in buffer
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const evt of events) {
          const lines = evt.split("\n");
          let eventType: string | null = null;
          const dataLines: string[] = [];
          
          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventType = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              dataLines.push(line.slice(5).trimStart());
            }
          }
          
          const dataStr = dataLines.join("\n");
          let payload: any = null;
          try {
            payload = dataStr ? JSON.parse(dataStr) : null;
          } catch (e) {
            console.error("Error parsing SSE data:", e);
            continue;
          }

          // Handle different event types from backend
          if (eventType === "orchestrator-start") {
            setSteps((prev) => [
              ...prev,
              {
                type: "orchestrator_decision",
                timestamp: new Date().toISOString(),
                decision: `Started orchestrator with ${payload?.available_agents?.length || 0} available agents`,
              },
            ]);
          } else if (eventType === "manager-decision") {
            setSteps((prev) => [
              ...prev,
              {
                type: "orchestrator_decision",
                timestamp: new Date().toISOString(),
                decision: payload?.decision ? JSON.stringify(payload.decision, null, 2) : "Manager made a decision",
              },
            ]);
          } else if (eventType === "agent-execution") {
            setSteps((prev) => [
              ...prev,
              {
                type: "agent_execution",
                timestamp: new Date().toISOString(),
                response: payload?.result ? JSON.stringify(payload.result, null, 2) : "Agent executed",
              },
            ]);
          } else if (eventType === "done") {
            setSteps((prev) => [
              ...prev,
              {
                type: "completion",
                timestamp: new Date().toISOString(),
                finalResult: payload?.ok ? "Orchestrator completed successfully" : "Orchestrator completed",
              },
            ]);
            setExecutionStatus("completed");
          } else if (eventType === "error") {
            setError(payload?.error || "Unknown error occurred");
            setExecutionStatus("error");
          }
        }
      }

      // If we didn't get a "done" event, mark as completed anyway
      setExecutionStatus((prev) => (prev !== "completed" && prev !== "error" ? "completed" : prev));
    } catch (error) {
      console.error("Error executing orchestrator:", error);
      setError(error instanceof Error ? error.message : "Failed to execute orchestrator");
      setExecutionStatus("error");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[90vh] p-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-emerald-200/30 dark:border-emerald-800/30 bg-gradient-to-r from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
                Orchestrator Configuration & Test
              </DialogTitle>
              <DialogDescription>
                Configure the manager agent and test orchestration
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Split View Content */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Panel - Configuration */}
          <div className="w-1/2 border-r flex flex-col min-w-0">
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {/* Model Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Model</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Choose the AI model for the orchestrator agent
                  </p>
                  <Select value={model} onValueChange={handleModelChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[1000]">
                      {LLM_OPTIONS.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* System Prompt */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">System Prompt</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Instructions for how the orchestrator should coordinate agents
                  </p>
                  <Textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    onBlur={handleSystemPromptBlur}
                    rows={12}
                    placeholder="You are a manager agent..."
                    className="font-mono text-sm resize-y"
                  />
                </div>

                {/* User Prompt / Goal */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Workflow Goal</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    The overall task or goal you want to accomplish
                  </p>
                  <Textarea
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    onBlur={handleUserPromptBlur}
                    rows={6}
                    placeholder="Research market trends and write a comprehensive report..."
                    className="text-sm resize-y"
                  />
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel - Test Output */}
          <div className="w-1/2 flex flex-col bg-muted/20 min-w-0">
            {/* Test Header */}
            <div className="px-6 py-4 border-b bg-background flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-semibold text-foreground">Test Execution</h3>
                <p className="text-xs text-muted-foreground">Watch the orchestrator in action</p>
              </div>
              <div className="flex items-center gap-2">
                {steps.length > 0 && (
                  <Select value={outputFormat} onValueChange={(value: "json" | "formatted") => setOutputFormat(value)}>
                    <SelectTrigger className="w-[120px] bg-background h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formatted">Formatted</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {executionStatus === "running" && (
                  <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Running
                  </Badge>
                )}
                {executionStatus === "completed" && (
                  <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                )}
                {executionStatus === "error" && (
                  <Badge variant="secondary" className="bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300">
                    <XCircle className="w-3 h-3 mr-1" />
                    Error
                  </Badge>
                )}
                <Button
                  onClick={handleExecute}
                  disabled={isExecuting}
                  size="sm"
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Execute
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Timeline */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-6">
                {error && (
                  <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                    </div>
                  </div>
                )}

                {steps.length === 0 && !isExecuting && !error && (
                  <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
                    <Brain className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <p className="text-lg font-medium text-muted-foreground mb-2">
                      Ready to test
                    </p>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Click Execute to watch the orchestrator break down the goal and delegate to agents
                    </p>
                  </div>
                )}

                {steps.length > 0 && (
                  <div className="space-y-4">
                    {steps.map((step, index) => (
                      <TimelineStep 
                        key={index} 
                        step={step} 
                        index={index} 
                        totalSteps={steps.length}
                        outputFormat={outputFormat}
                      />
                    ))}
                  </div>
                )}

                {isExecuting && steps.length === 0 && (
                  <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">Starting orchestrator...</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TimelineStep({ 
  step, 
  index, 
  totalSteps,
  outputFormat 
}: { 
  step: OrchestratorStep; 
  index: number; 
  totalSteps: number;
  outputFormat: "json" | "formatted";
}) {
  // Extract content from JSON string for formatted display
  const extractContent = (jsonString: string | undefined): string => {
    if (!jsonString) return "";
    
    try {
      const parsed = JSON.parse(jsonString);
      
      // If it's already a string, return it
      if (typeof parsed === "string") return parsed;
      
      // Check for content in messages array (common in orchestrator responses)
      if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
        // Get the last message's content
        const lastMessage = parsed.messages[parsed.messages.length - 1];
        if (lastMessage?.content) {
          const content = typeof lastMessage.content === "string" 
            ? lastMessage.content 
            : JSON.stringify(lastMessage.content, null, 2);
          
          // Try to extract JSON from content if it contains agent delegation info
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const innerJson = JSON.parse(jsonMatch[0]);
              // If it's a delegation or completion, format it nicely
              if (innerJson.instruction) {
                return innerJson.instruction;
              }
              if (innerJson.final_result) {
                return innerJson.final_result;
              }
            }
          } catch {
            // Continue with the content as-is
          }
          
          return content;
        }
      }
      
      // Check for instruction field (from agent delegation)
      if (parsed.instruction && typeof parsed.instruction === "string") {
        return parsed.instruction;
      }
      
      // Check for final_result field
      if (parsed.final_result && typeof parsed.final_result === "string") {
        return parsed.final_result;
      }
      
      // Check for content field directly
      if (parsed.content && typeof parsed.content === "string") {
        return parsed.content;
      }
      
      // Check for result.content
      if (parsed.result?.content && typeof parsed.result.content === "string") {
        return parsed.result.content;
      }
      
      // Check for agent and instruction together (delegation format)
      if (parsed.agent && parsed.instruction) {
        return `Delegating to ${parsed.agent}:\n\n${parsed.instruction}`;
      }
      
      // If it's an object with a single string field, return that
      const keys = Object.keys(parsed);
      if (keys.length === 1 && typeof parsed[keys[0]] === "string") {
        return parsed[keys[0]];
      }
      
      // Otherwise return formatted JSON (fallback)
      return JSON.stringify(parsed, null, 2);
    } catch {
      // If it's not valid JSON, return as-is (might already be plain text)
      return jsonString;
    }
  };
  if (step.type === "orchestrator_decision") {
    return (
      <div className="flex gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
        <div className="flex flex-col items-center shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg">
            <Brain className="w-5 h-5 text-white" />
          </div>
          {index < totalSteps - 1 && (
            <div className="w-0.5 h-full bg-gradient-to-b from-emerald-300 to-transparent dark:from-emerald-700 mt-2" />
          )}
        </div>
        <div className="flex-1 pb-6 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs">
              Orchestrator Decision
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(step.timestamp).toLocaleTimeString()}
            </span>
          </div>
          {step.decision && (
            <div className="mb-3">
              {outputFormat === "formatted" ? (
                <div className="prose prose-sm max-w-none text-foreground dark:prose-invert break-words">
                  <ReactMarkdown>{extractContent(step.decision)}</ReactMarkdown>
                </div>
              ) : (
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-muted/50 p-3 rounded overflow-auto">
                  {step.decision}
                </pre>
              )}
            </div>
          )}
          {step.agent && step.instruction && (
            <div className="mt-2 p-3 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/50 dark:border-blue-800/50">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  Delegating to: {step.agent}
                </span>
              </div>
              <p className="text-sm text-foreground pl-6">{step.instruction}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step.type === "agent_execution") {
    const content = extractContent(step.response);
    const isFormatted = outputFormat === "formatted";
    
    return (
      <div className="flex gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          {index < totalSteps - 1 && (
            <div className="w-0.5 h-full bg-gradient-to-b from-blue-300 to-transparent dark:from-blue-700 mt-2" />
          )}
        </div>
        <div className="flex-1 pb-6 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs">
              Agent Response: {step.agent}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(step.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div className="p-4 rounded-lg bg-card border overflow-hidden">
            {isFormatted ? (
              <div className="prose prose-sm max-w-none text-foreground dark:prose-invert break-words">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            ) : (
              <Textarea
                value={step.response || ""}
                readOnly
                className="font-mono text-xs bg-background resize-none border-0 p-0 h-auto min-h-[100px] overflow-auto"
                style={{ height: "auto" }}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step.type === "completion") {
    const content = step.finalResult || "";
    const isFormatted = outputFormat === "formatted";
    
    return (
      <div className="flex gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shrink-0">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="flex-1 pb-6 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs">
              Workflow Complete
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(step.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border border-emerald-200/50 dark:border-emerald-800/50 overflow-hidden">
            <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">
              Final Result
            </h4>
            {isFormatted ? (
              <div className="prose prose-sm max-w-none text-foreground dark:prose-invert break-words">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            ) : (
              <Textarea
                value={content}
                readOnly
                className="font-mono text-xs bg-background resize-none border-0 p-0 h-auto min-h-[100px] overflow-auto"
                style={{ height: "auto" }}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
