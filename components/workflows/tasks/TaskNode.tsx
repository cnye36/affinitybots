import React, { memo, useState, useEffect, useMemo } from "react"
import { Handle, Position, NodeProps } from "reactflow"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { Settings, UserPlus, PlusCircle, Bot, Sparkles, CheckCircle2, AlertCircle, Loader2, Play, Trash2 } from "lucide-react"
import { SiNotion, SiX, SiGoogle } from "react-icons/si"
import { IntegrationType } from "@/types/workflow"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { TaskConfigModal } from "./TaskConfigModal"
import { TaskNodeData, Task } from "@/types/workflow"
import { Assistant } from "@/types/assistant"
import { cn } from "@/lib/utils"
import { useAgent } from "@/hooks/useAgent"
import { OFFICIAL_MCP_SERVERS } from "@/lib/mcp/officialMcpServers"
import Image from "next/image"
import { getMcpServerLogo } from "@/lib/utils/mcpServerLogo"
import { useTheme } from "next-themes"

interface TaskNodeProps {
	data: TaskNodeData & {
		onAssignAssistant?: (taskId: string) => void,
		onConfigureTask?: (taskId: string) => void,
		assignedAssistant?: {
			id: string,
			name: string,
			avatar?: string,
		},
		isActive?: boolean,
		onAddTask?: () => void,
		isConfigOpen?: boolean,
		onConfigClose?: () => void,
		onDelete?: () => void,
	},
}

// Helper to get integration icon component
const getIntegrationIcon = (type: IntegrationType) => {
	switch (type) {
		case "notion":
			return SiNotion
		case "twitter":
			return SiX
		case "google_calendar":
		case "google_docs":
		case "google_sheets":
		case "google_drive":
			return SiGoogle
		default:
			return null
	}
}

const statusConfig: Record<string, { color: string, glow: string, icon: any }> = {
	idle: {
		color: "bg-gray-400 dark:bg-gray-500",
		glow: "",
		icon: null,
	},
	pending: {
		color: "bg-gray-400 dark:bg-gray-500",
		glow: "",
		icon: null,
	},
	running: {
		color: "bg-blue-500 dark:bg-blue-400",
		glow: "shadow-lg shadow-blue-500/50 animate-pulse",
		icon: Loader2,
	},
	completed: {
		color: "bg-emerald-500 dark:bg-emerald-400",
		glow: "shadow-lg shadow-emerald-500/50",
		icon: CheckCircle2,
	},
	error: {
		color: "bg-red-500 dark:bg-red-400",
		glow: "shadow-lg shadow-red-500/50",
		icon: AlertCircle,
	},
	failed: {
		color: "bg-red-500 dark:bg-red-400",
		glow: "shadow-lg shadow-red-500/50",
		icon: AlertCircle,
	},
	testing: {
		color: "bg-yellow-500 dark:bg-yellow-400",
		glow: "shadow-lg shadow-yellow-500/50 animate-pulse",
		icon: null,
	},
	testSuccess: {
		color: "bg-emerald-500 dark:bg-emerald-400",
		glow: "shadow-lg shadow-emerald-500/50",
		icon: null,
	},
	testError: {
		color: "bg-red-500 dark:bg-red-400",
		glow: "shadow-lg shadow-red-500/50",
		icon: null,
	},
}

	export const MemoizedTaskNode = memo(
		(props: NodeProps<TaskNodeProps["data"]>) => {
			const [testStatus, setTestStatus] = useState<"idle" | "testing" | "testSuccess" | "testError">("idle")
			const [toolLogos, setToolLogos] = useState<Record<string, string>>({})
			const isReadOnly = props.data.isReadOnly === true

		// Fetch assistant data to get enabled tools
		const { assistant } = useAgent(
			props.data.assignedAssistant?.id,
			{ enabled: !!props.data.assignedAssistant?.id }
		)

		// Extract enabled MCP servers from assistant config
		const enabledTools = useMemo(() => {
			if (!assistant?.config?.configurable?.enabled_mcp_servers) return []
			const enabledMcp = assistant.config.configurable.enabled_mcp_servers
			if (Array.isArray(enabledMcp)) return enabledMcp as string[]
			if (typeof enabledMcp === "object" && enabledMcp !== null) {
				return Object.entries(enabledMcp)
					.filter(([, v]) => (v as { isEnabled?: boolean })?.isEnabled)
					.map(([k]) => k)
			}
			return []
		}, [assistant])

		const { theme, resolvedTheme } = useTheme()
		const [mounted, setMounted] = useState(false)

		useEffect(() => {
			setMounted(true)
		}, [])

		// Load tool logos
		useEffect(() => {
			if (enabledTools.length === 0) {
				setToolLogos({})
				return
			}
			if (!mounted) return
			
			const currentTheme = (resolvedTheme || theme || "light") as "light" | "dark"
			const logos: Record<string, string> = {}
			OFFICIAL_MCP_SERVERS.forEach((s) => {
				if (enabledTools.includes(s.serverName)) {
					const logoUrl = getMcpServerLogo(s, currentTheme)
					if (logoUrl) {
						logos[s.serverName] = logoUrl
					}
				}
			})
			setToolLogos(logos)
		}, [enabledTools, mounted, theme, resolvedTheme])

		const handleSettingsClick = (e: React.MouseEvent) => {
			e.stopPropagation()
			if (isReadOnly) return
			if (props.data.onConfigureTask && props.data.workflow_task_id) {
				props.data.onConfigureTask(props.data.workflow_task_id)
			}
		}

		const handleAssignAssistant = (e: React.MouseEvent) => {
			e.stopPropagation()
			if (isReadOnly) return
			if (props.data.onAssignAssistant && props.data.workflow_task_id) {
				props.data.onAssignAssistant(props.data.workflow_task_id)
			}
		}

		const handleTaskUpdate = (
			updatedTask: Task,
			updatedAssistant: Assistant | null,
		) => {
			// Dispatch update event with all necessary fields
			const event = new CustomEvent("updateTaskNode", {
				detail: {
					taskId: props.data.workflow_task_id,
					updates: {
						name: updatedTask.name,
						description: updatedTask.description,
						type: updatedTask.task_type,
						assignedAssistant: updatedAssistant
							? {
									id: updatedAssistant.assistant_id,
									name: updatedAssistant.name,
									avatar: updatedAssistant.metadata.agent_avatar,
								}
							: props.data.assignedAssistant,
						config: updatedTask.config,
					},
				},
			})
			window.dispatchEvent(event)
		}

		type StreamTestResult = { type?: string, content?: string, result?: unknown }

		const handleTestTask = async (overrideConfig?: Record<string, unknown>) => {
			setTestStatus("testing")
			try {
				const response = await fetch(
					`/api/workflows/${props.data.workflow_id}/tasks/${props.data.workflow_task_id}/execute`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							// Pass previous node's output for auto-injection
							previousOutput: props.data.previousNodeOutput?.result || null,
							// Pass the input (backend will build the prompt with auto-injection)
							input: {
								prompt: props.data.config.input.prompt,
							},
							overrideConfig: overrideConfig || {},
						}),
					},
				)

				if (!response.ok) {
					throw new Error("Failed to execute task")
				}

				const reader = response.body?.getReader()
				const decoder = new TextDecoder()
				if (!reader) {
					throw new Error("No response body")
				}

				const extractTextFromPayload = (payload: unknown): string => {
					// Handle messages array (messages-tuple format)
					if (Array.isArray(payload)) {
						// Filter to only AI messages, skip human/user messages
						const aiMessages = payload.filter((msg: any) => {
							const type = msg?.type || msg?.role
							return type === "ai" || type === "assistant" || (!type && msg?.content)
						})
						
						return aiMessages
							.map((item: any) => {
								// Skip human messages
								if (item?.type === "human" || item?.role === "user") return ""
								
								if (typeof item === "string") return item
								if (typeof item?.delta === "string") return item.delta
								if (typeof item?.text === "string") return item.text
								if (typeof item?.token === "string") return item.token
								
								const content = item?.content
								if (typeof content === "string") return content
								if (Array.isArray(content)) {
									return content
										.map((part) => {
											if (typeof part === "string") return part
											if (typeof part?.text === "string") return part.text
											return ""
										})
										.join("")
								}
								return ""
							})
							.filter(Boolean)
							.join("")
					}
					
					// Handle single object
					if (payload != null && typeof payload === "object") {
						// Skip if it's a human message
						if ((payload as any)?.type === "human" || (payload as any)?.role === "user") {
							return ""
						}
						
						const item = payload as any
						if (typeof item.delta === "string") return item.delta
						if (typeof item.text === "string") return item.text
						if (typeof item.token === "string") return item.token
						
						const content = item.content
						if (typeof content === "string") return content
						if (Array.isArray(content)) {
							return content
								.map((part) => {
									if (typeof part === "string") return part
									if (typeof part?.text === "string") return part.text
									return ""
								})
								.join("")
						}
					}
					
					return ""
				}

				// Proper SSE parsing with buffering across chunks
				let buffer = ""
				let accumulatedText = ""
				let finalPayload: any = null
				let finalEventType: string | null = null

				while (true) {
					const { done, value } = await reader.read()
					if (done) break

					buffer += decoder.decode(value, { stream: true })

					// Split complete events by double newline; keep remainder in buffer
					const events = buffer.split("\n\n")
					buffer = events.pop() || ""

					for (const evt of events) {
						const lines = evt.split("\n")
						let eventType: string | null = null
						const dataLines: string[] = []
						for (const line of lines) {
							if (line.startsWith("event:")) {
								eventType = line.slice(6).trim()
							} else if (line.startsWith("data:")) {
								dataLines.push(line.slice(5).trimStart())
							}
						}
						const dataStr = dataLines.join("\n")
						try {
							const parsed = dataStr ? JSON.parse(dataStr) : null
							const resolvedEventType =
								eventType || (parsed && typeof parsed.event === "string" ? parsed.event : null)
							const payload =
								parsed && typeof parsed === "object" && "event" in parsed && "data" in parsed
									? (parsed as any).data
									: parsed

							if (resolvedEventType === "metadata" && payload?.thread_id) {
								(window as any).__lastTestThreadId = payload.thread_id
							}

							if (resolvedEventType === "rate-limit") {
								window.dispatchEvent(new Event("rate-limit:updated"))
							}

							if (resolvedEventType === "messages/partial") {
								const textDelta = extractTextFromPayload(payload)
								if (textDelta && textDelta.trim()) {
									// Only accumulate if we have actual AI content (not user prompt)
									accumulatedText += textDelta
								}
							}

							if (resolvedEventType === "messages/complete") {
								const finalText = extractTextFromPayload(payload)
								if (finalText && finalText.trim()) {
									// Use the final extracted text, which should only contain AI response
									accumulatedText = finalText
								}
								finalEventType = resolvedEventType
								finalPayload = { event: resolvedEventType, data: payload }
							}

							if (resolvedEventType === "error" && payload?.error) {
								const streamError = new Error(payload.error)
								;(streamError as any).__fromStream = true
								throw streamError
							}
						} catch (err) {
							if (err instanceof Error && (err as any).__fromStream) {
								throw err
							}
							// Ignore partial fragments; they will be completed in subsequent chunks
						}
					}
				}

			const testResult: StreamTestResult = {
				type: finalEventType || "messages/complete",
				content: accumulatedText,
				result: finalPayload?.data ?? finalPayload ?? null,
			}

			// Broadcast completion so the next node can display it as previous output
			try {
				const event = new CustomEvent("taskTestCompleted", {
					detail: {
						workflowTaskId: props.data.workflow_task_id,
						output: {
							result: testResult?.result ?? accumulatedText ?? null,
							metadata: { 
								event: testResult?.type,
								content: testResult?.content ?? accumulatedText,
							},
						},
					},
			})
			window.dispatchEvent(event)
		} catch {}

			setTestStatus("testSuccess")
			setTimeout(() => setTestStatus("idle"), 3000) // Reset after 3 seconds
			return testResult
		} catch (error) {
			console.error("Error testing task:", error)
			setTestStatus("testError")
			setTimeout(() => setTestStatus("idle"), 3000) // Reset after 3 seconds
			throw error
		}
	}

		const handlePlayClick = async (e: React.MouseEvent) => {
			e.stopPropagation()
			if (isReadOnly) return
			await handleTestTask()
		}

		const handleDeleteClick = (e: React.MouseEvent) => {
			e.stopPropagation()
			if (isReadOnly) return
			if (props.data.onDelete) {
				props.data.onDelete()
			}
		}

		const handleCardDoubleClick = () => {
			if (isReadOnly) return
			if (props.data.onConfigureTask && props.data.workflow_task_id) {
				props.data.onConfigureTask(props.data.workflow_task_id)
			}
		}

		const status = props.data.status || "pending"
		// Use test status if testing, otherwise use regular status
		const displayStatus = testStatus !== "idle" ? testStatus : status
		const statusInfo = statusConfig[displayStatus] || statusConfig.pending

		return (
			<>
				<div className="relative group">
					{/* Status indicator and action buttons - positioned outside top-right */}
					<div className="absolute -top-8 right-0 flex items-center gap-2 z-20">
						{/* Play button for testing */}
						{!isReadOnly && (
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<button
											onClick={handlePlayClick}
											className={cn(
												"p-1.5 rounded-lg",
												"bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm",
												"hover:bg-white dark:hover:bg-gray-700",
												"transition-all duration-200 hover:scale-110",
												"shadow-md border border-gray-200 dark:border-gray-700",
												testStatus === "testing" && "opacity-50 cursor-not-allowed",
											)}
											disabled={testStatus === "testing"}
										>
											<Play className="h-3 w-3 text-gray-700 dark:text-gray-300 fill-current" />
										</button>
									</TooltipTrigger>
									<TooltipContent>
										<p>Test Task</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)}

						{/* Status indicator dot - positioned next to play button */}
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<div
										className={cn(
											"w-3 h-3 rounded-full ring-2 ring-white dark:ring-gray-900",
											statusInfo.color,
											statusInfo.glow,
										)}
									/>
								</TooltipTrigger>
								<TooltipContent>
									<p className="capitalize">Status: {displayStatus}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>

						{/* Delete button */}
						{props.data.onDelete && !isReadOnly && (
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<button
											onClick={handleDeleteClick}
											className={cn(
												"p-1.5 rounded-lg",
												"bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm",
												"hover:bg-red-50 dark:hover:bg-red-900/20",
												"transition-all duration-200 hover:scale-110",
												"shadow-md border border-gray-200 dark:border-gray-700",
											)}
										>
											<Trash2 className="h-3 w-3 text-red-600 dark:text-red-400" />
										</button>
									</TooltipTrigger>
									<TooltipContent>
										<p>Delete Task</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)}
					</div>
					{/* Glowing border effect on hover/active/status */}
					<div
						className={cn(
							"absolute -inset-[2px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
							"bg-gradient-to-r from-violet-500/30 to-purple-500/30 dark:from-violet-400/30 dark:to-purple-400/30 blur-sm",
							"pointer-events-none",
							props.data.isActive && "opacity-100 animate-pulse",
							status === "running" && "opacity-100 from-blue-500/50 to-cyan-500/50",
							status === "completed" && "from-emerald-500/50 to-green-500/50",
							status === "error" && "from-red-500/50 to-rose-500/50",
						)}
					/>

					<Card
						className={cn(
							"relative min-w-[200px] max-w-[240px] cursor-pointer overflow-hidden",
							"border-2 transition-all duration-300",
							"hover:shadow-xl hover:-translate-y-0.5",
							"bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm",
							props.data.isActive
								? "border-violet-500 dark:border-violet-400 shadow-lg shadow-violet-500/20"
								: "border-violet-200/50 dark:border-violet-800/50",
							status === "running" && "border-blue-500 dark:border-blue-400",
							status === "completed" && "border-emerald-500 dark:border-emerald-400",
							status === "error" && "border-red-500 dark:border-red-400",
						)}
						onDoubleClick={handleCardDoubleClick}
					>
						{/* Header with gradient background */}
						<CardHeader className="p-3 relative overflow-hidden bg-gradient-to-br from-violet-50/80 to-purple-50/80 dark:from-violet-950/30 dark:to-purple-950/30">
							{/* Subtle animated gradient overlay */}
							<div
								className={cn(
									"absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent",
									props.data.isActive && "animate-shimmer",
								)}
							/>

							<div className="relative flex items-center justify-between">
								<div className="flex items-center gap-2 flex-1 min-w-0">
									{/* AI Task Icon */}
									<div
										className={cn(
											"p-1.5 rounded-lg shadow-md shrink-0",
											"bg-gradient-to-br from-violet-500 to-purple-500 dark:from-violet-600 dark:to-purple-600",
											"transform transition-transform group-hover:scale-110 duration-200",
										)}
									>
										<Bot className="h-3.5 w-3.5 text-white" />
									</div>

									{/* Task Name with gradient text */}
									<CardTitle
										className={cn(
											"text-xs font-semibold truncate",
											"bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400",
											"bg-clip-text text-transparent",
										)}
									>
										{props.data.name}
									</CardTitle>
								</div>

								<div className="flex items-center gap-2 shrink-0">
									{/* Settings button - appears on hover */}
									{!isReadOnly && (
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<button
														onClick={handleSettingsClick}
														className={cn(
															"p-1.5 rounded-lg opacity-0 group-hover:opacity-100",
															"bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm",
															"hover:bg-white dark:hover:bg-gray-700",
															"transition-all duration-200 hover:scale-110",
															"shadow-md",
														)}
													>
														<Settings className="h-4 w-4 text-gray-600 dark:text-gray-300" />
													</button>
												</TooltipTrigger>
												<TooltipContent>
													<p>Configure Task</p>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									)}
								</div>
							</div>
						</CardHeader>

						<CardContent className="p-3 pt-2">
							{/* Task type badge and integration icons */}
							<div className="flex flex-wrap items-center gap-1.5 mb-2.5">
								<Badge
									variant="outline"
									className={cn(
										"text-[10px] font-medium border px-1.5 py-0",
										"bg-gradient-to-r from-violet-500/10 to-purple-500/10 dark:from-violet-400/20 dark:to-purple-400/20",
										"border-transparent shadow-sm",
									)}
								>
									<Sparkles className="h-2.5 w-2.5 mr-0.5" />
									AI Agent
								</Badge>
								{/* Integration icon from task integration field */}
								{props.data.integration && (() => {
									const IconComponent = getIntegrationIcon(props.data.integration.type)
									if (!IconComponent) return null
									return (
										<TooltipProvider key={`task-integration-${props.data.integration.type}`}>
											<Tooltip>
												<TooltipTrigger asChild>
													<div className="flex items-center justify-center w-5 h-5 rounded border border-violet-200/50 dark:border-violet-800/50 bg-background">
														<IconComponent className="h-3 w-3 text-violet-600 dark:text-violet-400" />
													</div>
												</TooltipTrigger>
												<TooltipContent>
													<p className="capitalize">{props.data.integration.type.replace(/_/g, " ")}</p>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									)
								})()}
								{/* Integration icons from assistant's enabled MCP servers */}
								{enabledTools.map((qualifiedName) => {
									const logoUrl = toolLogos[qualifiedName]
									const server = OFFICIAL_MCP_SERVERS.find(s => s.serverName === qualifiedName)
									const displayName = server?.displayName || qualifiedName.split('/').pop() || qualifiedName
									return (
										<TooltipProvider key={`tool-${qualifiedName}`}>
											<Tooltip>
												<TooltipTrigger asChild>
													<div className="flex items-center justify-center w-5 h-5 rounded border border-violet-200/50 dark:border-violet-800/50 bg-background overflow-hidden">
														{logoUrl ? (
															<Image
																src={logoUrl}
																alt={displayName}
																width={12}
																height={12}
																className="object-contain"
															/>
														) : (
															<div className="text-[8px]">🔧</div>
														)}
													</div>
												</TooltipTrigger>
												<TooltipContent>
													<p>{displayName}</p>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									)
								})}
							</div>

							{/* Agent Assignment Section */}
							<div className="pt-2.5 border-t border-violet-200/50 dark:border-violet-800/30">
								{props.data.assignedAssistant ? (
									<div className="flex items-center gap-2">
										{/* Avatar with gradient ring */}
										<div className="relative">
											<div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-purple-500 dark:from-violet-600 dark:to-purple-600 rounded-full blur-sm opacity-75" />
											<Avatar className="relative h-6 w-6 border-2 border-white dark:border-gray-900">
												{props.data.assignedAssistant.avatar ? (
													<AvatarImage
														src={props.data.assignedAssistant.avatar}
														alt={props.data.assignedAssistant.name}
													/>
												) : (
													<AvatarFallback className="text-[9px] bg-gradient-to-br from-violet-500 to-purple-500 dark:from-violet-600 dark:to-purple-600 text-white">
														{props.data.assignedAssistant.name
															.slice(0, 2)
															.toUpperCase()}
													</AvatarFallback>
												)}
											</Avatar>
										</div>
										<span className="text-[11px] font-medium flex-1 truncate">
											{props.data.assignedAssistant.name}
										</span>
										<Button
											variant="ghost"
											size="sm"
											className="ml-auto h-6 px-1.5 text-[10px] hover:bg-violet-500/10 dark:hover:bg-violet-400/10"
											onClick={handleAssignAssistant}
											disabled={isReadOnly}
										>
											Change
										</Button>
									</div>
								) : (
									<Button
										variant="outline"
										size="sm"
										className={cn(
											"w-full gap-1.5 h-7",
											"bg-gradient-to-r from-violet-500/10 to-purple-500/10 dark:from-violet-400/20 dark:to-purple-400/20",
											"border border-violet-300/50 dark:border-violet-700/50",
											"hover:from-violet-500/20 hover:to-purple-500/20 dark:hover:from-violet-400/30 dark:hover:to-purple-400/30",
											"transition-all duration-200 hover:scale-[1.02]",
										)}
										onClick={handleAssignAssistant}
										disabled={isReadOnly}
									>
										<UserPlus className="h-3 w-3" />
										<span className="font-medium text-[10px]">Assign Agent</span>
									</Button>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Add Agent Button - appears on hover when no outgoing connection */}
					{props.data.onAddTask && !isReadOnly && (
						<button
							onClick={(e) => {
								e.stopPropagation();
								props.data.onAddTask?.();
							}}
							className={cn(
								"absolute -right-32 top-1/2 -translate-y-1/2",
								"opacity-0 group-hover:opacity-100 transition-opacity duration-200",
								"px-3 py-1.5 rounded-lg",
								"bg-gradient-to-r from-violet-500 to-purple-500 dark:from-violet-600 dark:to-purple-600",
								"hover:shadow-lg shadow-md text-white",
								"flex items-center gap-1.5 text-xs font-medium",
								"whitespace-nowrap z-10",
								"backdrop-blur-sm",
							)}
							title="Add Agent"
						>
							<PlusCircle className="w-3.5 h-3.5" />
							<span>Add Agent</span>
						</button>
					)}

					{/* Connection Handles - Conditional based on workflow type */}
					{props.data.workflowType === "orchestrator" ? (
						<>
							{/* Top handle for orchestrator connections (target) */}
							<Handle
								type="target"
								position={Position.Top}
								className="!w-3 !h-3 !border-2 !border-white dark:!border-gray-900 !bg-violet-500 dark:!bg-violet-400 !shadow-[0_0_6px_rgba(139,92,246,0.5)] dark:!shadow-[0_0_8px_rgba(167,139,250,0.6)] !rounded-full"
								id="task-target-top"
								style={{ top: -6 }}
							/>
							{/* Bottom handle for output (source) */}
							<Handle
								type="source"
								position={Position.Bottom}
								className="!w-3 !h-3 !border-2 !border-white dark:!border-gray-900 !bg-violet-500 dark:!bg-violet-400 !shadow-[0_0_6px_rgba(139,92,246,0.5)] dark:!shadow-[0_0_8px_rgba(167,139,250,0.6)] !rounded-full"
								id="task-source-bottom"
								style={{ bottom: -6 }}
							/>
						</>
					) : (
						<>
							{/* Left handle for sequential connections (target) */}
							<Handle
								type="target"
								position={Position.Left}
								className="!w-3 !h-3 !border-2 !border-white dark:!border-gray-900 !bg-violet-500 dark:!bg-violet-400 !shadow-[0_0_6px_rgba(139,92,246,0.5)] dark:!shadow-[0_0_8px_rgba(167,139,250,0.6)] !rounded-full"
								id="task-target-left"
								style={{ left: -6 }}
							/>
							{/* Right handle for output (source) */}
							<Handle
								type="source"
								position={Position.Right}
								className="!w-3 !h-3 !border-2 !border-white dark:!border-gray-900 !bg-violet-500 dark:!bg-violet-400 !shadow-[0_0_6px_rgba(139,92,246,0.5)] dark:!shadow-[0_0_8px_rgba(167,139,250,0.6)] !rounded-full"
								id="task-source"
								style={{ right: -6 }}
							/>
						</>
					)}
				</div>

				<TaskConfigModal
					isOpen={Boolean(props.data.isConfigOpen)}
					onClose={props.data.onConfigClose || (() => {})}
					task={{
						workflow_task_id: props.data.workflow_task_id,
						workflow_id: props.data.workflow_id,
						name: props.data.name,
						description: props.data.description || "",
						task_type: props.data.task_type,
						assignedAssistant: props.data.assignedAssistant,
						status: props.data.status,
						config: props.data.config || {
							input: {
								source: "previous_node",
								parameters: {},
								prompt: "",
							},
							output: {
								destination: "next_node",
							},
						},
						position: props.data.position,
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
						last_run_at: new Date().toISOString(),
						owner_id: props.data.owner_id,
						metadata: (props.data as any).metadata || (props.data as any).task?.metadata || {},
					}}
					previousNodeOutput={props.data.previousNodeOutput as any}
					onTest={handleTestTask}
					onUpdate={handleTaskUpdate}
					workflowType={props.data.workflowType}
				/>
			</>
		)
	},
	(prevProps, nextProps) =>
		prevProps.data.name === nextProps.data.name &&
		prevProps.data.task_type === nextProps.data.task_type &&
		prevProps.data.description === nextProps.data.description &&
		prevProps.data.status === nextProps.data.status &&
		prevProps.data.isConfigOpen === nextProps.data.isConfigOpen &&
		prevProps.data.isActive === nextProps.data.isActive &&
		JSON.stringify(prevProps.data.config) ===
			JSON.stringify(nextProps.data.config) &&
		JSON.stringify(prevProps.data.assignedAssistant) ===
			JSON.stringify(nextProps.data.assignedAssistant) &&
		JSON.stringify(prevProps.data.previousNodeOutput) ===
			JSON.stringify(nextProps.data.previousNodeOutput),
)

MemoizedTaskNode.displayName = "MemoizedTaskNode"
