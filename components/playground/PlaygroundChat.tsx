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

interface PlaygroundChatProps {
	sessionId: string
	agentId: string
	selectedTools: string[]
	previousContext?: string
	mode: "sequential" | "orchestrator"
	orchestratorConfig?: OrchestratorConfig
	selectedTeam: string[]
}

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
	const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])
	const [threadId, setThreadId] = useState<string | null>(null)
	const [isStreaming, setIsStreaming] = useState(false)
	const prevContextRef = useRef<string | null | undefined>(previousContext)

	// Reset chat when agent changes (sequential mode) or mode changes
	useEffect(() => {
		setMessages([])
		setThreadId(null)
		setUserPrompt("")
		prevContextRef.current = previousContext
	}, [agentId, mode, previousContext])

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
				if (userPrompt.trim()) {
					inputMessages.push({
						type: "human",
						content: userPrompt,
					})
					setMessages(prev => [...prev, { role: "user", content: userPrompt }])
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
				if (userPrompt.trim()) {
					inputMessages.push({
						type: "human",
						content: userPrompt,
					})
					setMessages(prev => [...prev, { role: "user", content: userPrompt }])
				}

				configurable.selected_tools = selectedTools.length > 0 ? selectedTools : undefined
			}

			// Submit to LangGraph
			await thread.submit(
				{
					messages: inputMessages,
				},
				{
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
				userPrompt: userPrompt || undefined,
				previousContext: withContext ? previousContext : undefined,
				toolApprovalMode: "auto",
			})

			setUserPrompt("")
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
			// Save context for next agent
			handoffContext(lastAssistantMessage.content, threadId || undefined)
			
			// Clear chat - ready for new conversation
			setMessages([])
			setThreadId(null)
			setUserPrompt("")
		}
	}

	// Update messages from thread
	useEffect(() => {
		if (thread.messages && thread.messages.length > 0) {
			const threadMessages = (thread.messages as any[])
				.filter((m) => m.type === "human" || m.type === "ai")
				.map((m) => ({
					role: m.type === "human" ? ("user" as const) : ("assistant" as const),
					content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
				}))

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
							variant="outline"
							size="sm"
							onClick={handleHandoff}
							disabled={isStreaming}
						>
							<ArrowRight className="h-4 w-4 mr-2" />
							Hand Off Context
						</Button>
					)}
				</div>

				{previousContext && (
					<div className="mt-2 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
						Using previous agent context
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
										<ReactMarkdown>{message.content}</ReactMarkdown>
									</div>
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
					<Label htmlFor="user-prompt">Message (optional)</Label>
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
