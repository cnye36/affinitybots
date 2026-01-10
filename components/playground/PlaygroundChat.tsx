"use client"

import { useState, useEffect, useRef } from "react"
import { usePlaygroundStore } from "@/lib/stores/playgroundStore"
import { OrchestratorConfig } from "@/types/workflow"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Loader2, ArrowRight } from "lucide-react"
import { useStream } from "@langchain/langgraph-sdk/react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism"
import { ToolCallBadge } from "@/components/chat/ToolCallBadge"
import { MemoryBadge } from "@/components/chat/MemoryBadge"
import type { ToolCall } from "@/components/chat/types"
import type { EnhancedMemory } from "@/types/memory"

interface PlaygroundChatProps {
	sessionId: string
	agentId: string
	selectedTools: string[]
	previousContext?: string
	mode: "sequential" | "orchestrator"
	orchestratorConfig?: OrchestratorConfig
	selectedTeam: string[]
}

interface Message {
	role: "user" | "assistant"
	content: string
	toolCalls?: ToolCall[]
	memorySaved?: EnhancedMemory
}

// Per-agent conversation state stored globally per session
const sessionAgentStates = new Map<string, Map<string, { messages: Message[]; threadId: string | null }>>()

export function PlaygroundChat({
	sessionId,
	agentId,
	selectedTools,
	previousContext,
	mode,
	orchestratorConfig,
	selectedTeam,
}: PlaygroundChatProps) {
	const { handoffContext, currentAgentId, addStep, isExecuting, currentContext: storeContext } = usePlaygroundStore()
	const [userPrompt, setUserPrompt] = useState("")
	const [messages, setMessages] = useState<Message[]>([])
	const [threadId, setThreadId] = useState<string | null>(null)
	const [isStreaming, setIsStreaming] = useState(false)
	const prevContextRef = useRef<string | null | undefined>(previousContext)
	const prevAgentIdRef = useRef<string>(agentId)

	// Get or create session-agent storage
	const getAgentState = (sessId: string, agtId: string) => {
		if (!sessionAgentStates.has(sessId)) {
			sessionAgentStates.set(sessId, new Map())
		}
		const sessionMap = sessionAgentStates.get(sessId)!
		if (!sessionMap.has(agtId)) {
			sessionMap.set(agtId, { messages: [], threadId: null })
		}
		return sessionMap.get(agtId)!
	}

	// Save current agent state when switching
	const saveCurrentAgentState = () => {
		const state = getAgentState(sessionId, prevAgentIdRef.current)
		state.messages = messages
		state.threadId = threadId
	}

	// Load agent state when switching to a new agent
	useEffect(() => {
		// Save previous agent's state before switching
		if (prevAgentIdRef.current !== agentId) {
			saveCurrentAgentState()
		}

		// Load new agent's state
		const state = getAgentState(sessionId, agentId)
		setMessages(state.messages)
		setThreadId(state.threadId)
		setUserPrompt("")
		prevContextRef.current = previousContext
		prevAgentIdRef.current = agentId
	}, [agentId, sessionId])

	// Save state when messages or threadId change
	useEffect(() => {
		const state = getAgentState(sessionId, agentId)
		state.messages = messages
		state.threadId = threadId
	}, [messages, threadId, sessionId, agentId])

	// Reset chat when context is cleared (new chat button)
	useEffect(() => {
		// If context was cleared (was present, now null) and we had messages, clear chat
		if (prevContextRef.current && !storeContext && messages.length > 0) {
			setMessages([])
			setThreadId(null)
			setUserPrompt("")
		}
		prevContextRef.current = storeContext
	}, [storeContext, messages.length])

	const apiUrl = process.env.NEXT_PUBLIC_LANGGRAPH_API_URL || "/api/chat"

	// Use orchestrator graph when in orchestrator mode, otherwise use agent's graph
	const effectiveAssistantId = mode === "orchestrator" ? "orchestratorAgent" : agentId

	const thread = useStream<{ messages: any[] }>({
		apiUrl,
		assistantId: effectiveAssistantId,
		messagesKey: "messages",
		threadId: threadId || undefined,
		onThreadId: (newThreadId) => {
			if (!threadId) setThreadId(newThreadId)
		},
	})

	const handleSubmit = async (withContext: boolean = true) => {
		if (!userPrompt.trim() && !previousContext) return

		// Clear input and add message to UI immediately
		const messageToSend = userPrompt
		setUserPrompt("")

		if (messageToSend.trim()) {
			setMessages(prev => [...prev, { role: "user", content: messageToSend }])
		}

		try {
			setIsStreaming(true)

			const inputMessages = []
			const configurable: any = {
				playground_session_id: sessionId,
			}

			if (mode === "orchestrator") {
				// Orchestrator mode: pass orchestrator config and team
				if (orchestratorConfig) {
					Object.assign(configurable, orchestratorConfig)
				}

				// Build available agents map for orchestrator
				const availableAgents: Record<string, any> = {}
				selectedTeam.forEach(teamAgentId => {
					availableAgents[teamAgentId] = {
						assistant_id: teamAgentId,
						name: teamAgentId, // Will be fetched from platform
						config: {
							selected_tools: selectedTools.length > 0 ? selectedTools : undefined,
						},
					}
				})

				configurable.available_agents = availableAgents

				// User prompt becomes the goal for orchestrator
				if (messageToSend.trim()) {
					inputMessages.push({
						type: "human",
						content: messageToSend,
					})
				}
			} else {
				// Sequential mode: normal agent execution
				// Add previous context as system message if available and requested
				if (withContext && previousContext) {
					inputMessages.push({
						type: "system",
						content: `Previous agent output:\n\n${previousContext}`,
					})
				}

				// Add user prompt if provided
				if (messageToSend.trim()) {
					inputMessages.push({
						type: "human",
						content: messageToSend,
					})
				}

				configurable.selected_tools = selectedTools.length > 0 ? selectedTools : undefined
			}

			// Submit to LangGraph
			await thread.submit(
				{
					messages: inputMessages,
				},
				{
					// Request full message data including tool_calls
					streamMode: ["messages", "messages-tuple"],
					config: {
						configurable,
					},
				}
			)

			// Create step record
			await addStep({
				agentId: mode === "orchestrator" ? "orchestrator" : agentId,
				agentName: mode === "orchestrator" ? "Orchestrator Manager" : "Current Agent",
				selectedTools,
				userPrompt: messageToSend || undefined,
				previousContext: withContext ? previousContext : undefined,
				toolApprovalMode: "auto",
			})
		} catch (error) {
			console.error("Error submitting message:", error)
		} finally {
			setIsStreaming(false)
		}
	}

	const handleHandoff = () => {
		// Get last assistant message
		const lastAssistantMessage = messages.filter(m => m.role === "assistant").pop()
		if (lastAssistantMessage) {
			// Save context for next agent (keep current agent's conversation intact)
			handoffContext(lastAssistantMessage.content, threadId || undefined)
		}
	}

	// Update messages from thread
	useEffect(() => {
		if (thread.messages && thread.messages.length > 0) {
			const allMessages = thread.messages as any[]

			// Create a map of tool results by tool_call_id
			const toolResultsMap = new Map<string, any>()
			allMessages
				.filter((m) => m.type === "tool")
				.forEach((toolMsg) => {
					if (toolMsg.tool_call_id) {
						toolResultsMap.set(toolMsg.tool_call_id, toolMsg.content)
					}
				})

			const mappedMessages = allMessages
				.filter((m) => m.type === "human" || m.type === "ai")
				.map((m): Message | null => {
					// Extract tool calls and memory from AI messages
					let toolCalls: ToolCall[] | undefined
					let memorySaved: EnhancedMemory | undefined

					if (m.type === "ai") {
						// Check for tool calls
						const rawToolCalls = m.tool_calls || m.additional_kwargs?.tool_calls
						if (rawToolCalls && Array.isArray(rawToolCalls) && rawToolCalls.length > 0) {
							toolCalls = rawToolCalls.map((tc: any) => ({
								id: tc.id,
								name: tc.name || tc.function?.name,
								args: tc.args || tc.function?.arguments,
								arguments: tc.args || tc.function?.arguments,
								result: tc.id ? toolResultsMap.get(tc.id) : undefined,
							}))
						}

						// Check for memory saved
						if (m.additional_kwargs?.memory_saved && m.additional_kwargs?.memory_data) {
							memorySaved = m.additional_kwargs.memory_data as EnhancedMemory
							console.log("[PLAYGROUND] Memory saved:", memorySaved)
						}
					}

					// Filter out the [MEMORY_SAVED] marker from content
					let content = typeof m.content === "string" ? m.content : JSON.stringify(m.content)
					if (content.startsWith("[MEMORY_SAVED]")) {
						// Don't show the memory notification as regular content
						return null
					}

					return {
						role: m.type === "human" ? ("user" as const) : ("assistant" as const),
						content,
						toolCalls,
						memorySaved,
					}
				})

			const threadMessages: Message[] = mappedMessages.filter((m): m is Message => m !== null)

			setMessages(threadMessages)
		}
	}, [thread.messages])

	const canRunWithContextOnly = !!previousContext && !userPrompt.trim()

	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="p-4 border-b border-border">
				<div className="flex items-center justify-between">
					<h3 className="font-semibold">Chat</h3>
					{mode === "sequential" && messages.length > 0 && (
						<Button
							size="sm"
							onClick={handleHandoff}
							disabled={isStreaming}
							className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-md"
						>
							<ArrowRight className="h-4 w-4 mr-2" />
							Hand Off Context
						</Button>
					)}
				</div>

				{previousContext && (
					<div className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20">
						<span className="inline-flex items-center gap-1.5">
							<ArrowRight className="h-3 w-3" />
							Using context from previous agent
						</span>
					</div>
				)}
			</div>

			{/* Messages */}
			<ScrollArea className="flex-1 p-4">
				<div className="space-y-4">
					{messages.length === 0 ? (
						<div className="text-center text-muted-foreground py-8">
							<p className="text-lg">Start a conversation</p>
							<p className="text-sm mt-2">
								{previousContext
									? "You can run with previous context or add a new prompt"
									: "Type a message to begin"}
							</p>
						</div>
					) : (
						messages.map((message, idx) => (
							<div
								key={idx}
								className={`flex ${
									message.role === "user" ? "justify-end" : "justify-start"
								}`}
							>
								<div
									className={`max-w-[80%] rounded-lg p-3 ${
										message.role === "user"
											? "bg-primary text-primary-foreground"
											: "bg-muted"
									}`}
								>
									<div className="prose prose-sm dark:prose-invert max-w-none">
										<ReactMarkdown
											components={{
												code({ node, inline, className, children, ...props }: any) {
													const match = /language-(\w+)/.exec(className || "")
													const language = match ? match[1] : ""

													return !inline && language ? (
														<SyntaxHighlighter
															style={oneDark}
															language={language}
															PreTag="div"
															className="rounded-md !my-2"
															{...props}
														>
															{String(children).replace(/\n$/, "")}
														</SyntaxHighlighter>
													) : (
														<code
															className={`${className} px-1.5 py-0.5 rounded bg-muted/50 text-sm font-mono`}
															{...props}
														>
															{children}
														</code>
													)
												},
											}}
										>
											{message.content}
										</ReactMarkdown>
									</div>
									{message.role === "assistant" && message.toolCalls && message.toolCalls.length > 0 && (
										<div className="mt-3 flex flex-wrap gap-2">
											{message.toolCalls.map((toolCall) => (
												<ToolCallBadge key={toolCall.id} toolCall={toolCall} />
											))}
										</div>
									)}
									{message.role === "assistant" && message.memorySaved && (
										<div className="mt-3">
											<MemoryBadge memory={message.memorySaved} />
										</div>
									)}
								</div>
							</div>
						))
					)}

					{isStreaming && (
						<div className="flex justify-start">
							<div className="bg-muted rounded-lg p-3">
								<Loader2 className="h-4 w-4 animate-spin" />
							</div>
						</div>
					)}
				</div>
			</ScrollArea>

			{/* Input */}
			<div className="p-4 border-t border-border space-y-2">
				{selectedTools.length > 0 && (
					<div className="text-xs text-muted-foreground">
						{selectedTools.length} tool{selectedTools.length !== 1 ? "s" : ""} selected
					</div>
				)}

				<div className="space-y-2">
					<Label htmlFor="user-prompt">Message</Label>
					<Textarea
						id="user-prompt"
						placeholder={
							previousContext
								? "Add an optional prompt or run with context only..."
								: "Type your message..."
						}
						value={userPrompt}
						onChange={(e) => setUserPrompt(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault()
								handleSubmit(true)
							}
						}}
						rows={3}
						className="resize-none"
					/>

					<div className="flex gap-2">
						{previousContext && (
							<Button
								onClick={() => handleSubmit(false)}
								disabled={isStreaming || !userPrompt.trim()}
								variant="outline"
								className="flex-1"
							>
								Run Without Context
							</Button>
						)}

						<Button
							onClick={() => handleSubmit(true)}
							disabled={isStreaming || (!userPrompt.trim() && !canRunWithContextOnly)}
							className="flex-1"
						>
							{isStreaming ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Running...
								</>
							) : (
								<>
									<Send className="mr-2 h-4 w-4" />
									{previousContext && !userPrompt.trim() ? "Run with Context" : "Run"}
								</>
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
