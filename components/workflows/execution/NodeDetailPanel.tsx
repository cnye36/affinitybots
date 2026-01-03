"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Copy, Check, ChevronDown, ChevronRight } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { WorkflowNode } from "@/types/workflow"

interface ThreadData {
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
}

interface TaskRunWithThreadData {
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
  threadData?: ThreadData | null
}

interface NodeDetailPanelProps {
  node: WorkflowNode
  taskRun: TaskRunWithThreadData | null
  onClose: () => void
}

export function NodeDetailPanel({ node, taskRun, onClose }: NodeDetailPanelProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set())

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const toggleTool = (toolId: string) => {
    const newExpanded = new Set(expandedTools)
    if (newExpanded.has(toolId)) {
      newExpanded.delete(toolId)
    } else {
      newExpanded.add(toolId)
    }
    setExpandedTools(newExpanded)
  }

  // Extract markdown content helper (same as existing implementation)
  const extractMarkdownFrom = (val: any): string | null => {
    if (val == null) return null
    if (typeof val === "string" && val.trim().length > 0) return val

    if (Array.isArray(val)) {
      for (const item of val) {
        const found = extractMarkdownFrom(item)
        if (found) return found
      }
      return null
    }

    if (typeof val === "object") {
      if (typeof val.content === "string" && val.content.trim().length > 0) {
        return val.content
      }
      if (Array.isArray(val.content)) {
        const joined = val.content
          .map((p: any) =>
            typeof p === "string"
              ? p
              : typeof p?.text === "string"
              ? p.text
              : typeof p?.content === "string"
              ? p.content
              : ""
          )
          .filter(Boolean)
          .join("\n\n")
        if (joined.trim().length > 0) return joined
      }

      const maybeAgent = val.agent
      if (maybeAgent && Array.isArray(maybeAgent.messages)) {
        const foundInMessages = extractMarkdownFrom(maybeAgent.messages)
        if (foundInMessages) return foundInMessages
      }

      const alt = extractMarkdownFrom(val.output) || extractMarkdownFrom(val.result)
      if (alt) return alt

      for (const key of Object.keys(val)) {
        const found = extractMarkdownFrom(val[key])
        if (found) return found
      }
    }
    return null
  }

  // For trigger nodes
  if (node.type === "trigger") {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/50 dark:to-cyan-950/50">
          <div>
            <h3 className="text-sm font-semibold">{node.data.name || "Trigger"}</h3>
            <p className="text-xs text-muted-foreground">{node.data.trigger_type}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-6 w-6 p-0">
            ×
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <Card className="border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-br from-blue-50/30 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Trigger Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs">
                <span className="text-muted-foreground">Type:</span>{" "}
                <Badge variant="outline" className="ml-2">
                  {node.data.trigger_type}
                </Badge>
              </div>

              {node.data.description && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Description:</span>
                  <p className="mt-1 text-foreground">{node.data.description}</p>
                </div>
              )}

              {node.data.config && Object.keys(node.data.config).length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Configuration</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(JSON.stringify(node.data.config, null, 2), "trigger-config")}
                      className="h-6 px-2"
                    >
                      {copied === "trigger-config" ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-[200px] font-mono">
                    {JSON.stringify(node.data.config, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </ScrollArea>
      </div>
    )
  }

  // For task nodes
  if (node.type === "task") {
    const threadData = taskRun?.threadData
    const durationMs = taskRun?.analytics?.duration_ms
    const assignedAssistant = (node.data as any)?.assignedAssistant || (node.data as any)?.config?.assigned_assistant
    const agentName = assignedAssistant?.name || "Unknown Agent"
    const model = (taskRun?.metadata as any)?.model || "Unknown"

    const markdownText = extractMarkdownFrom(taskRun?.result)
    const resultText = typeof taskRun?.result === "string" ? taskRun.result : JSON.stringify(taskRun?.result ?? null, null, 2)

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/50 dark:to-cyan-950/50">
          <div>
            <h3 className="text-sm font-semibold">{node.data.name}</h3>
            <p className="text-xs text-muted-foreground">{agentName}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-6 w-6 p-0">
            ×
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Run Information - Always visible */}
            <Card className="border-emerald-200/50 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50/20 to-green-50/20 dark:from-emerald-950/20 dark:to-green-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Run Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge
                    variant={taskRun?.status === "completed" ? "default" : "destructive"}
                    className="text-[10px] uppercase"
                  >
                    {taskRun?.status || "unknown"}
                  </Badge>
                </div>
                {durationMs != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{(durationMs / 1000).toFixed(2)}s</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model:</span>
                  <span className="font-mono text-[11px]">{model}</span>
                </div>
                {taskRun?.started_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Started:</span>
                    <span>{new Date(taskRun.started_at).toLocaleTimeString()}</span>
                  </div>
                )}
                {taskRun?.completed_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed:</span>
                    <span>{new Date(taskRun.completed_at).toLocaleTimeString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Accordion for collapsible sections */}
            <Accordion type="multiple" defaultValue={["input", "output"]} className="space-y-3">
              {/* Input Context */}
              {threadData?.inputMessages && threadData.inputMessages.length > 0 && (
                <AccordionItem
                  value="input"
                  className="border rounded-lg bg-gradient-to-br from-violet-50/20 to-purple-50/20 dark:from-violet-950/20 dark:to-purple-950/20"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                      <span className="text-sm font-medium">Input Context</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {threadData.inputMessages.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3">
                      {threadData.inputMessages.map((msg, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Message {idx + 1}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopy(msg.content, `input-${idx}`)}
                              className="h-6 px-2"
                            >
                              {copied === `input-${idx}` ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          <div className="text-xs bg-muted p-3 rounded-md whitespace-pre-wrap break-words max-h-[200px] overflow-auto">
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Reasoning Process */}
              {threadData?.aiResponses?.some((r) => r.hasReasoning) && (
                <AccordionItem
                  value="reasoning"
                  className="border rounded-lg bg-gradient-to-br from-amber-50/20 to-yellow-50/20 dark:from-amber-950/20 dark:to-yellow-950/20"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <span className="text-sm font-medium">Reasoning Process</span>
                      <Badge variant="secondary" className="text-[10px]">
                        Chain of Thought
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3">
                      {threadData.aiResponses
                        .filter((r) => r.hasReasoning)
                        .map((response, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Step {idx + 1}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCopy(response.reasoning_content || "", `reasoning-${idx}`)}
                                className="h-6 px-2"
                              >
                                {copied === `reasoning-${idx}` ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                            <div className="text-xs bg-muted p-3 rounded-md whitespace-pre-wrap break-words max-h-[300px] overflow-auto">
                              {response.reasoning_content}
                            </div>
                          </div>
                        ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Tool Calls */}
              {threadData?.toolCalls && threadData.toolCalls.length > 0 && (
                <AccordionItem
                  value="tools"
                  className="border rounded-lg bg-gradient-to-br from-orange-50/20 to-amber-50/20 dark:from-orange-950/20 dark:to-amber-950/20"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                      <span className="text-sm font-medium">Tool Calls</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {threadData.toolCalls.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3">
                      {threadData.toolCalls.map((call, idx) => (
                        <div key={idx} className="border rounded-lg p-3 space-y-2 bg-background">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono text-[10px]">
                                {call.name}
                              </Badge>
                              <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleTool(call.id)}
                              className="h-6 w-6 p-0"
                            >
                              {expandedTools.has(call.id) ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>

                          {expandedTools.has(call.id) && (
                            <div className="space-y-2 pt-2 border-t">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium">Arguments</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      handleCopy(JSON.stringify(call.arguments, null, 2), `tool-args-${idx}`)
                                    }
                                    className="h-5 px-1.5"
                                  >
                                    {copied === `tool-args-${idx}` ? (
                                      <Check className="h-3 w-3" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[150px] font-mono">
                                  {JSON.stringify(call.arguments, null, 2)}
                                </pre>
                              </div>

                              {call.result && (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium">Result</span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        handleCopy(
                                          typeof call.result === "string"
                                            ? call.result
                                            : JSON.stringify(call.result, null, 2),
                                          `tool-result-${idx}`
                                        )
                                      }
                                      className="h-5 px-1.5"
                                    >
                                      {copied === `tool-result-${idx}` ? (
                                        <Check className="h-3 w-3" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                  <div className="text-xs bg-muted p-2 rounded overflow-auto max-h-[150px] whitespace-pre-wrap break-words">
                                    {typeof call.result === "string"
                                      ? call.result
                                      : JSON.stringify(call.result, null, 2)}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Output */}
              <AccordionItem
                value="output"
                className="border rounded-lg bg-gradient-to-br from-blue-50/20 to-cyan-50/20 dark:from-blue-950/20 dark:to-cyan-950/20"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium">Output</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <Tabs defaultValue="result" className="w-full">
                    <TabsList className="grid grid-cols-3 w-full">
                      <TabsTrigger value="result">Result</TabsTrigger>
                      <TabsTrigger value="markdown">Markdown</TabsTrigger>
                      <TabsTrigger value="json">JSON</TabsTrigger>
                    </TabsList>

                    <TabsContent value="result" className="mt-3">
                      <div className="relative">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute right-1 top-1 h-7 px-2 z-10"
                          onClick={() => handleCopy(resultText, "result")}
                          title="Copy"
                        >
                          {copied === "result" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                        <pre className="text-xs whitespace-pre-wrap break-words bg-muted p-2 rounded-md max-h-[320px] overflow-auto">
                          {resultText}
                        </pre>
                      </div>
                    </TabsContent>

                    <TabsContent value="markdown" className="mt-3">
                      {markdownText ? (
                        <div className="relative border rounded-md p-2 max-h-[320px] overflow-auto">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute right-1 top-1 h-7 px-2 z-10"
                            onClick={() => handleCopy(markdownText, "markdown")}
                            title="Copy"
                          >
                            {copied === "markdown" ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownText}</ReactMarkdown>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground p-2">No markdown text available.</div>
                      )}
                    </TabsContent>

                    <TabsContent value="json" className="mt-3">
                      <div className="relative">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute right-1 top-1 h-7 px-2 z-10"
                          onClick={() => handleCopy(JSON.stringify(taskRun ?? {}, null, 2), "json")}
                          title="Copy"
                        >
                          {copied === "json" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                        <pre className="text-xs whitespace-pre bg-muted p-2 rounded-md max-h-[320px] overflow-auto font-mono">
                          {JSON.stringify(taskRun ?? {}, null, 2)}
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Error display if present */}
            {taskRun?.error && (
              <Card className="border-red-200 dark:border-red-800 bg-red-50/20 dark:bg-red-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">Error</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-red-600 dark:text-red-400 break-words">{taskRun.error}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>
    )
  }

  return null
}
