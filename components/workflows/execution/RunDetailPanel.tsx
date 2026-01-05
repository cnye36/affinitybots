"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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

export function RunDetailPanel({ run, taskRuns, nodes, isLoading }: RunDetailPanelProps) {
  const taskNodeById = useMemo(() => {
    const entries = new Map<string, WorkflowNode>()
    nodes.forEach((node) => {
      if (node.type === "task") {
        entries.set(node.data.workflow_task_id, node)
      }
    })
    return entries
  }, [nodes])

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

  const buildInteractions = (threadData?: TaskRunWithThreadData["threadData"]) => {
    if (!threadData) return []
    const items: InteractionItem[] = []
    threadData.inputMessages.forEach((msg) => {
      items.push({ type: "input", content: msg.content, timestamp: msg.timestamp })
    })
    threadData.aiResponses.forEach((response) => {
      items.push({
        type: "response",
        content: response.content,
        timestamp: response.timestamp,
        reasoning: response.reasoning_content,
      })
    })
    threadData.toolCalls.forEach((call) => {
      items.push({
        type: "tool",
        name: call.name,
        arguments: call.arguments,
        result: call.result,
        timestamp: call.timestamp,
      })
    })
    return items.sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime()
      const bTime = new Date(b.timestamp).getTime()
      if (Number.isNaN(aTime) || Number.isNaN(bTime)) return 0
      return aTime - bTime
    })
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
              <CardTitle className="text-sm font-medium">Task Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {taskRuns.length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  No task runs recorded for this execution.
                </div>
              ) : (
                <Accordion type="multiple" className="space-y-3">
                  {taskRuns.map((taskRun, index) => {
                    const taskNode = taskNodeById.get(taskRun.workflow_task_id)
                    const assignedAssistant =
                      taskNode?.type === "task"
                        ? taskNode.data.assignedAssistant ||
                          (taskNode.data as any).config?.assigned_assistant
                        : null
                    const agentLabel = assignedAssistant?.name || "Unknown Agent"
                    const interactions = buildInteractions(taskRun.threadData)

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
                                {taskNode?.type === "task" ? taskNode.data.name : "Task"}
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
                          <div className="space-y-3 text-xs">
                            {interactions.length === 0 ? (
                              <div className="text-muted-foreground">No interaction data captured.</div>
                            ) : (
                              interactions.map((item, idx) => (
                                <div
                                  key={`${taskRun.run_id}-${idx}`}
                                  className="border rounded-md p-2 bg-muted/30"
                                >
                                  {item.type === "input" && (
                                    <div>
                                      <div className="text-[10px] font-semibold uppercase text-violet-600">
                                        Input
                                      </div>
                                      <div className="whitespace-pre-wrap break-words">{item.content}</div>
                                    </div>
                                  )}
                                  {item.type === "response" && (
                                    <div>
                                      <div className="text-[10px] font-semibold uppercase text-blue-600">
                                        Response
                                      </div>
                                      <div className="whitespace-pre-wrap break-words">{item.content}</div>
                                      {item.reasoning && (
                                        <div className="mt-2 text-[10px] text-muted-foreground whitespace-pre-wrap">
                                          {item.reasoning}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {item.type === "tool" && (
                                    <div>
                                      <div className="text-[10px] font-semibold uppercase text-amber-600">
                                        Tool: {item.name || "Unknown"}
                                      </div>
                                      <pre className="text-[10px] bg-muted p-2 rounded-md overflow-auto max-h-[160px]">
                                        {JSON.stringify(item.arguments ?? null, null, 2)}
                                      </pre>
                                      {item.result != null && (
                                        <pre className="text-[10px] bg-muted p-2 rounded-md overflow-auto max-h-[160px] mt-2">
                                          {JSON.stringify(item.result ?? null, null, 2)}
                                        </pre>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))
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
