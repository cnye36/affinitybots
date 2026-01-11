"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import ReactMarkdown from "react-markdown"
import { WorkflowNode } from "@/types/workflow"

type TaskRunWithThreadData = {
  run_id: string
  workflow_task_id: string
  status: string
  started_at: string
  completed_at: string | null
  result: any
  error: string | null
  metadata: any
  analytics?: {
    duration_ms: number | null
    thread_id: string | null
    langgraph_run_id: string | null
    tool_calls: string[]
    tool_call_count: number
  }
  threadData?: {
    inputMessages: Array<{ content: string; timestamp: string }>
    aiResponses: Array<{
      content: string
      reasoning_content: string | null
      hasReasoning: boolean
      tool_calls: any[]
      timestamp: string
    }>
    toolCalls: Array<{
      id: string
      name: string
      arguments: any
      result: any
      timestamp: string
    }>
  } | null
}

type RunDetails = {
  run_id: string
  status: string
  started_at: string
  completed_at: string | null
  error?: string | null
  metadata?: Record<string, unknown> | null
  duration_ms?: number | null
  triggerData?: {
    trigger_id: string
    name: string
    type: string
    config: Record<string, unknown>
    initialPayload: unknown
  } | null
  result?: unknown
}

interface RunDetailPanelProps {
  run: RunDetails | null
  taskRuns: TaskRunWithThreadData[]
  nodes: WorkflowNode[]
  isLoading?: boolean
}

type InteractionItem =
  | { type: "input"; content: string; timestamp: string }
  | { type: "response"; content: string; timestamp: string; reasoning?: string | null }
  | { type: "tool"; name: string; arguments: any; result: any; timestamp: string }

type ResponseFormat = "json" | "markdown" | "formatted" | "yaml"

// Simple JSON to YAML converter (handles basic cases)
function jsonToYaml(obj: any, indent = 0): string {
  const indentStr = "  ".repeat(indent)
  
  if (obj === null || obj === undefined) {
    return "null"
  }
  
  if (typeof obj === "string") {
    // Escape strings that need quotes
    if (obj.includes("\n") || obj.includes(":") || obj.includes("#") || obj.trim() !== obj || obj === "") {
      return JSON.stringify(obj)
    }
    // Don't quote simple strings
    return obj
  }
  
  if (typeof obj === "number" || typeof obj === "boolean") {
    return String(obj)
  }
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]"
    return obj.map(item => {
      const itemStr = jsonToYaml(item, indent + 1)
      const lines = itemStr.split("\n")
      const firstLine = lines[0]
      const restLines = lines.length > 1 ? "\n" + lines.slice(1).map(line => indentStr + "  " + line).join("\n") : ""
      return `${indentStr}- ${firstLine}${restLines}`
    }).join("\n")
  }
  
  if (typeof obj === "object") {
    const keys = Object.keys(obj)
    if (keys.length === 0) return "{}"
    return keys.map(key => {
      const value = obj[key]
      const valueStr = jsonToYaml(value, indent + 1)
      const lines = valueStr.split("\n")
      const firstLine = lines[0]
      const restLines = lines.length > 1 ? "\n" + lines.slice(1).map(line => indentStr + "  " + line).join("\n") : ""
      return `${indentStr}${key}: ${firstLine}${restLines}`
    }).join("\n")
  }
  
  return String(obj)
}

// Format content based on selected format
function formatContent(
  content: string,
  format: ResponseFormat,
  metadata?: {
    inputTokens?: number | null
    outputTokens?: number | null
    reasoningTokens?: number | null
    durationMs?: number | null
    timestamp?: string | null
    toolCalls?: Array<{ id: string; name: string; arguments: any; result: any; timestamp: string }>
    reasoning?: string | null
  }
): string {
  if (!content) return ""
  
  try {
    switch (format) {
      case "json": {
        // Create enriched object with metadata
        const enriched: any = {
          content: content,
        }
        
        if (metadata) {
          if (metadata.inputTokens != null) enriched.input_tokens = metadata.inputTokens
          if (metadata.outputTokens != null) enriched.output_tokens = metadata.outputTokens
          if (metadata.reasoningTokens != null) enriched.reasoning_tokens = metadata.reasoningTokens
          if (metadata.durationMs != null) enriched.duration_ms = metadata.durationMs
          if (metadata.timestamp) enriched.timestamp = metadata.timestamp
          if (metadata.toolCalls && metadata.toolCalls.length > 0) {
            enriched.tool_calls = metadata.toolCalls.map(call => ({
              id: call.id,
              name: call.name,
              arguments: call.arguments,
              result: call.result,
              timestamp: call.timestamp,
            }))
          }
          if (metadata.reasoning) enriched.reasoning = metadata.reasoning
        }
        
        return JSON.stringify(enriched, null, 2)
      }
      case "yaml": {
        // Create enriched object with metadata (same as JSON)
        const enriched: any = {
          content: content,
        }
        
        if (metadata) {
          if (metadata.inputTokens != null) enriched.input_tokens = metadata.inputTokens
          if (metadata.outputTokens != null) enriched.output_tokens = metadata.outputTokens
          if (metadata.reasoningTokens != null) enriched.reasoning_tokens = metadata.reasoningTokens
          if (metadata.durationMs != null) enriched.duration_ms = metadata.durationMs
          if (metadata.timestamp) enriched.timestamp = metadata.timestamp
          if (metadata.toolCalls && metadata.toolCalls.length > 0) {
            enriched.tool_calls = metadata.toolCalls.map(call => ({
              id: call.id,
              name: call.name,
              arguments: call.arguments,
              result: call.result,
              timestamp: call.timestamp,
            }))
          }
          if (metadata.reasoning) enriched.reasoning = metadata.reasoning
        }
        
        return jsonToYaml(enriched)
      }
      case "markdown":
      case "formatted":
        // Return raw content for markdown/formatted (formatted uses ReactMarkdown to render)
        return content
      default:
        return content
    }
  } catch {
    return content
  }
}

export function RunDetailPanel({ run, taskRuns, nodes, isLoading }: RunDetailPanelProps) {
  const [responseFormat, setResponseFormat] = useState<ResponseFormat>("formatted")
  const taskNodeById = useMemo(() => {
    const entries = new Map<string, WorkflowNode>()
    nodes.forEach((node) => {
      if (node.type === "task") {
        entries.set(node.data.workflow_task_id, node)
      }
    })
    return entries
  }, [nodes])

  // Task runs are already sorted by position from the backend
  const sortedTaskRuns = taskRuns

  const isOrchestratorRun = run?.metadata?.execution_type === "orchestrator"

  const formatTimestamp = (value?: string | null) => {
    if (!value) return "—"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString()
  }

  const formatDuration = (durationMs?: number | null) => {
    if (!durationMs && durationMs !== 0) return "—"
    return `${(durationMs / 1000).toFixed(2)}s`
  }

  // Build structured interaction data for a task
  const buildTaskInteractionData = (
    taskRun: TaskRunWithThreadData,
    taskIndex: number,
    previousTaskRun?: TaskRunWithThreadData
  ) => {
    const threadData = taskRun.threadData
    if (!threadData) {
      return {
        handoffContext: null,
        userPrompt: null,
        agentResponse: null,
        toolCalls: [],
        reasoning: null,
        metadata: {
          inputTokens: null,
          outputTokens: null,
          reasoningTokens: null,
          durationMs: taskRun.analytics?.duration_ms ?? null,
          timestamp: taskRun.started_at,
        },
      }
    }

    const isFirstTask = taskIndex === 0
    
    // Get the most recent (last) input message
    const rawInputMessage = threadData.inputMessages.length > 0 
      ? threadData.inputMessages[threadData.inputMessages.length - 1].content
      : null

    // Parse the input message to separate prepended context from actual prompt
    let handoffContext: string | null = null
    let userPrompt: string | null = null

    if (rawInputMessage) {
      // Check for "--- Previous Agent Output ---" or "--- Trigger Data ---" markers
      const previousAgentMarker = "--- Previous Agent Output ---"
      const triggerDataMarker = "--- Trigger Data ---"
      const yourTaskMarker = "--- Your Task ---"

      if (rawInputMessage.includes(yourTaskMarker)) {
        // Split by "--- Your Task ---"
        const parts = rawInputMessage.split(yourTaskMarker)
        
        if (parts.length >= 2) {
          // The part before "Your Task" contains the context
          const contextPart = parts[0].trim()
          
          // Extract the actual context (remove the marker line)
          if (contextPart.includes(previousAgentMarker)) {
            handoffContext = contextPart.replace(previousAgentMarker, "").trim()
          } else if (contextPart.includes(triggerDataMarker)) {
            handoffContext = contextPart.replace(triggerDataMarker, "").trim()
          }
          
          // The part after "Your Task" is the actual user prompt
          userPrompt = parts.slice(1).join(yourTaskMarker).trim()
        } else {
          // No proper split, use the whole message as prompt
          userPrompt = rawInputMessage
        }
      } else {
        // No markers found, use the entire message as prompt
        userPrompt = rawInputMessage
      }
    }

    // Get the most recent (last) AI response
    const lastAiResponse = threadData.aiResponses.length > 0
      ? threadData.aiResponses[threadData.aiResponses.length - 1]
      : null

    const agentResponse = lastAiResponse?.content ?? null
    const reasoning = lastAiResponse?.reasoning_content ?? null
    const responseTimestamp = lastAiResponse?.timestamp ?? taskRun.started_at

    // If we didn't extract hand-off context from the message but this isn't the first task,
    // fall back to getting it from the previous task's response
    if (!handoffContext && !isFirstTask && previousTaskRun?.threadData?.aiResponses?.length) {
      const prevResponses = previousTaskRun.threadData.aiResponses
      handoffContext = prevResponses[prevResponses.length - 1].content
    }

    // Extract token usage from metadata if available
    const metadata = taskRun.metadata || {}
    const usage = metadata.usage || metadata.token_usage || metadata.usage_metadata || {}
    const inputTokens = usage.input_tokens ?? usage.prompt_tokens ?? usage.total_input_tokens ?? null
    const outputTokens = usage.output_tokens ?? usage.completion_tokens ?? usage.total_output_tokens ?? null
    const reasoningTokens = usage.reasoning_tokens ?? null

    return {
      handoffContext,
      userPrompt,
      agentResponse,
      toolCalls: threadData.toolCalls,
      reasoning,
      metadata: {
        inputTokens,
        outputTokens,
        reasoningTokens,
        durationMs: taskRun.analytics?.duration_ms ?? null,
        timestamp: responseTimestamp,
      },
    }
  }

  if (!run) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <h3 className="text-sm font-semibold">Execution Details</h3>
          <p className="text-xs text-muted-foreground">Select a run to view details.</p>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          {isLoading ? "Loading execution details..." : "No execution selected."}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 md:p-4 border-b bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/50 dark:to-cyan-950/50">
        <h3 className="text-sm font-semibold">Execution Details</h3>
        <p className="text-xs text-muted-foreground truncate">{run.run_id}</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 md:p-4 space-y-3 md:space-y-4">
          <Card className="border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-br from-blue-50/30 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Run Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge
                  variant={run.status === "completed" ? "default" : "destructive"}
                  className="text-[10px] uppercase"
                >
                  {run.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Started:</span>
                <span>{formatTimestamp(run.started_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed:</span>
                <span>{formatTimestamp(run.completed_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span>{formatDuration(run.duration_ms)}</span>
              </div>
              {run.error && (
                <div className="text-xs text-red-600 dark:text-red-400">
                  Error: {run.error}
                </div>
              )}
            </CardContent>
          </Card>

          {run.triggerData && (
            <Card className="border-violet-200/50 dark:border-violet-800/50 bg-gradient-to-br from-violet-50/20 to-purple-50/20 dark:from-violet-950/20 dark:to-purple-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Trigger</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span>{run.triggerData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    {run.triggerData.type}
                  </Badge>
                </div>
                {run.triggerData.initialPayload != null && (
                  <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-[160px] font-mono">
                    {String(JSON.stringify(run.triggerData.initialPayload, null, 2) ?? "")}
                  </pre>
                )}
              </CardContent>
            </Card>
          )}

          {isOrchestratorRun && (
            <Card className="border-emerald-200/50 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50/20 to-green-50/20 dark:from-emerald-950/20 dark:to-green-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Orchestrator Output</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-[240px] font-mono">
                  {JSON.stringify(run.result ?? null, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-200/50 dark:border-slate-800/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Task Timeline</CardTitle>
                <Select value={responseFormat} onValueChange={(value) => setResponseFormat(value as ResponseFormat)}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="markdown">Markdown</SelectItem>
                    <SelectItem value="formatted">Formatted</SelectItem>
                    <SelectItem value="yaml">YAML</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {sortedTaskRuns.length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  No task runs recorded for this execution.
                </div>
              ) : (
                <Accordion type="multiple" className="space-y-3">
                  {sortedTaskRuns.map((taskRun, index) => {
                    const taskNode = taskNodeById.get(taskRun.workflow_task_id)
                    const assignedAssistant =
                      taskNode?.type === "task"
                        ? taskNode.data.assignedAssistant ||
                          (taskNode.data as any).config?.assigned_assistant
                        : null
                    const agentLabel = assignedAssistant?.name || "Unknown Agent"
                    const previousTaskRun = index > 0 ? sortedTaskRuns[index - 1] : undefined
                    const interactionData = buildTaskInteractionData(taskRun, index, previousTaskRun)
                    const isFirstTask = index === 0

                    return (
                      <AccordionItem
                        key={taskRun.run_id || `${taskRun.workflow_task_id}-${index}`}
                        value={taskRun.run_id || taskRun.workflow_task_id}
                        className="border rounded-lg"
                      >
                        <AccordionTrigger className="px-3 py-2 hover:no-underline">
                          <div className="flex flex-1 items-center justify-between text-left">
                            <div>
                              <div className="text-xs font-medium">
                                {index + 1}. {taskNode?.type === "task" ? taskNode.data.name : "Task"}
                              </div>
                              <div className="text-[10px] text-muted-foreground">{agentLabel}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={taskRun.status === "completed" ? "default" : "secondary"}
                                className="text-[10px] uppercase"
                              >
                                {taskRun.status}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {formatDuration(taskRun.analytics?.duration_ms)}
                              </span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-3">
                          <div className="space-y-2 text-xs">
                            {!interactionData.userPrompt && !interactionData.agentResponse ? (
                              <div className="text-muted-foreground">No interaction data captured.</div>
                            ) : (
                              <Accordion type="multiple" className="space-y-2">
                                {/* Hand-off Context or Trigger Data */}
                                {interactionData.handoffContext && (
                                  <AccordionItem value="handoff" className="border rounded-md">
                                    <AccordionTrigger className="px-2 py-1.5 text-[11px] font-medium hover:no-underline">
                                      <span className="text-emerald-600 dark:text-emerald-400">
                                        {isFirstTask ? "Trigger Data" : "Hand-off Context (from previous agent)"}
                                      </span>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-2 pb-2">
                                      <div className="text-xs bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded border border-emerald-200/50 dark:border-emerald-800/50">
                                        {responseFormat === "formatted" ? (
                                          <div className="prose prose-sm max-w-none dark:prose-invert break-words">
                                            <ReactMarkdown>{formatContent(interactionData.handoffContext, responseFormat)}</ReactMarkdown>
                                          </div>
                                        ) : (
                                          <div className="whitespace-pre-wrap break-words font-mono">
                                            {formatContent(interactionData.handoffContext, responseFormat, interactionData.metadata)}
                                          </div>
                                        )}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                )}

                                {/* Task Instruction / Prompt */}
                                {interactionData.userPrompt && (
                                  <AccordionItem value="prompt" className="border rounded-md">
                                    <AccordionTrigger className="px-2 py-1.5 text-[11px] font-medium hover:no-underline">
                                      <span className="text-violet-600 dark:text-violet-400">
                                        Task Instruction
                                      </span>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-2 pb-2">
                                      <div className="text-xs bg-violet-50/50 dark:bg-violet-950/20 p-2 rounded border border-violet-200/50 dark:border-violet-800/50">
                                        {responseFormat === "formatted" ? (
                                          <div className="prose prose-sm max-w-none dark:prose-invert break-words">
                                            <ReactMarkdown>{formatContent(interactionData.userPrompt, responseFormat)}</ReactMarkdown>
                                          </div>
                                        ) : (
                                          <div className="whitespace-pre-wrap break-words font-mono">
                                            {formatContent(interactionData.userPrompt, responseFormat, interactionData.metadata)}
                                          </div>
                                        )}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                )}

                                {/* Agent Response */}
                                {interactionData.agentResponse && (
                                  <AccordionItem value="response" className="border rounded-md">
                                    <AccordionTrigger className="px-2 py-1.5 text-[11px] font-medium hover:no-underline">
                                      <span className="text-blue-600 dark:text-blue-400">
                                        Agent Response
                                      </span>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-2 pb-2">
                                      <div className="text-xs bg-blue-50/50 dark:bg-blue-950/20 p-2 rounded border border-blue-200/50 dark:border-blue-800/50">
                                        {responseFormat === "formatted" ? (
                                          <div className="prose prose-sm max-w-none dark:prose-invert break-words">
                                            <ReactMarkdown>{formatContent(interactionData.agentResponse, responseFormat)}</ReactMarkdown>
                                          </div>
                                        ) : (
                                          <div className="whitespace-pre-wrap break-words font-mono">
                                            {formatContent(interactionData.agentResponse, responseFormat, {
                                              ...interactionData.metadata,
                                              toolCalls: interactionData.toolCalls,
                                              reasoning: interactionData.reasoning,
                                            })}
                                          </div>
                                        )}
                                        {interactionData.reasoning && responseFormat === "formatted" && (
                                          <div className="mt-2 pt-2 border-t border-blue-200/50 dark:border-blue-800/50">
                                            <div className="text-[10px] font-semibold uppercase text-blue-600/70 dark:text-blue-400/70 mb-1">
                                              Reasoning
                                            </div>
                                            <div className="text-[10px] prose prose-sm max-w-none dark:prose-invert break-words">
                                              <ReactMarkdown>{formatContent(interactionData.reasoning, responseFormat)}</ReactMarkdown>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                )}

                                {/* Tool Calls */}
                                {interactionData.toolCalls.length > 0 && (
                                  <AccordionItem value="tools" className="border rounded-md">
                                    <AccordionTrigger className="px-2 py-1.5 text-[11px] font-medium hover:no-underline">
                                      <span className="text-amber-600 dark:text-amber-400">
                                        Tool Calls ({interactionData.toolCalls.length})
                                      </span>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-2 pb-2">
                                      <div className="space-y-2">
                                        {interactionData.toolCalls.map((call, toolIdx) => (
                                          <div
                                            key={toolIdx}
                                            className="text-xs bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded border border-amber-200/50 dark:border-amber-800/50"
                                          >
                                            <div className="font-semibold mb-1 text-amber-700 dark:text-amber-300">
                                              {call.name || "Unknown Tool"}
                                            </div>
                                            <div className="text-[10px] space-y-1">
                                              <div>
                                                <span className="font-medium">Arguments:</span>
                                                <pre className="mt-0.5 bg-muted/50 p-1.5 rounded overflow-auto max-h-[120px] font-mono">
                                                  {JSON.stringify(call.arguments ?? null, null, 2)}
                                                </pre>
                                              </div>
                                              {call.result != null && (
                                                <div>
                                                  <span className="font-medium">Result:</span>
                                                  <pre className="mt-0.5 bg-muted/50 p-1.5 rounded overflow-auto max-h-[120px] font-mono">
                                                    {JSON.stringify(call.result ?? null, null, 2)}
                                                  </pre>
                                                </div>
                                              )}
                                              {call.id && (
                                                <div className="text-[9px] text-muted-foreground">
                                                  ID: {call.id}
                                                </div>
                                              )}
                                              {call.timestamp && (
                                                <div className="text-[9px] text-muted-foreground">
                                                  Timestamp: {new Date(call.timestamp).toLocaleString()}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                )}
                              </Accordion>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}
