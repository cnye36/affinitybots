import React, { memo } from "react"
import { Handle, Position, NodeProps } from "reactflow"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { Settings, UserPlus, PlusCircle, Bot, Sparkles, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { TaskConfigModal } from "./TaskConfigModal"
import { TaskNodeData, Task } from "@/types/workflow"
import { Assistant } from "@/types/assistant"
import { cn } from "@/lib/utils"

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
	},
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
}

export const MemoizedTaskNode = memo(
	(props: NodeProps<TaskNodeProps["data"]>) => {
		const handleSettingsClick = (e: React.MouseEvent) => {
			e.stopPropagation()
			if (props.data.onConfigureTask && props.data.workflow_task_id) {
				props.data.onConfigureTask(props.data.workflow_task_id)
			}
		}

		const handleAssignAssistant = (e: React.MouseEvent) => {
			e.stopPropagation()
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
			try {
				const response = await fetch(
					`/api/workflows/${props.data.workflow_id}/tasks/${props.data.workflow_task_id}/execute`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							// Prefer reusing previous node's thread during test if available
							thread_id: props.data.previousNodeThreadId || undefined,
							input: {
								messages: [
									{
										role: "user",
										content: props.data.config.input.prompt,
									},
								],
							},
							overrideConfig: (() => {
								const baseOverride = { ...(overrideConfig || {}) } as Record<string, unknown>
								const incomingContext = (baseOverride.context || {}) as Record<string, unknown>
								const resolvedContext = {
									...incomingContext,
									inputSource: props.data.previousNodeThreadId
										? "previous_output"
										: (incomingContext.inputSource as string) || (props.data as any)?.config?.context?.inputSource,
									thread: props.data.previousNodeThreadId
										? { mode: "workflow" as const }
										: (incomingContext.thread as Record<string, unknown>) || (props.data as any)?.config?.context?.thread,
								}

								const overridePayload: Record<string, unknown> = {
									...baseOverride,
									context: resolvedContext,
								}

								const toolApprovalPreference =
									(baseOverride.toolApproval as Record<string, unknown> | undefined) ||
									((props.data as any)?.config?.toolApproval as Record<string, unknown> | undefined)
								if (toolApprovalPreference) {
									overridePayload.toolApproval = toolApprovalPreference
								}

								return overridePayload
							})(),
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
					const items = Array.isArray(payload)
						? payload
						: payload != null
						? [payload]
						: []
					return items
						.map((item: any) => {
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
						.join("")
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
								if (textDelta) {
									accumulatedText += textDelta
								}
								try {
									window.dispatchEvent(
										new CustomEvent("taskTestStream", {
											detail: {
												workflowTaskId: props.data.workflow_task_id,
												partial: accumulatedText,
											},
										}),
									)
								} catch {}
							}

							if (resolvedEventType === "messages/complete") {
								const finalText = extractTextFromPayload(payload)
								if (finalText) {
									accumulatedText = finalText
								}
								finalEventType = resolvedEventType
								finalPayload = { event: resolvedEventType, data: payload }
								try {
									window.dispatchEvent(
										new CustomEvent("taskTestStream", {
											detail: {
												workflowTaskId: props.data.workflow_task_id,
												partial: accumulatedText,
											},
										}),
									)
								} catch {}
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
								metadata: { event: testResult?.type },
							},
						},
					})
					window.dispatchEvent(event)
				} catch {}

				return testResult
			} catch (error) {
				console.error("Error testing task:", error)
				throw error
			}
		}

		const handleCardDoubleClick = () => {
			if (props.data.onConfigureTask && props.data.workflow_task_id) {
				props.data.onConfigureTask(props.data.workflow_task_id)
			}
		}

		const status = props.data.status || "pending"
		const statusInfo = statusConfig[status] || statusConfig.pending
		const StatusIcon = statusInfo.icon

		return (
			<>
				<div className="relative group">
					{/* Glowing border effect on hover/active/status */}
					<div
						className={cn(
							"absolute -inset-[2px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
							"bg-gradient-to-r from-violet-500/30 to-purple-500/30 dark:from-violet-400/30 dark:to-purple-400/30 blur-sm",
							props.data.isActive && "opacity-100 animate-pulse",
							status === "running" && "opacity-100 from-blue-500/50 to-cyan-500/50",
							status === "completed" && "from-emerald-500/50 to-green-500/50",
							status === "error" && "from-red-500/50 to-rose-500/50",
						)}
					/>

					<Card
						className={cn(
							"relative min-w-[280px] max-w-[320px] cursor-pointer overflow-hidden",
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
						<CardHeader className="p-4 relative overflow-hidden bg-gradient-to-br from-violet-50/80 to-purple-50/80 dark:from-violet-950/30 dark:to-purple-950/30">
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
											"p-2 rounded-lg shadow-md shrink-0",
											"bg-gradient-to-br from-violet-500 to-purple-500 dark:from-violet-600 dark:to-purple-600",
											"transform transition-transform group-hover:scale-110 duration-200",
										)}
									>
										<Bot className="h-4 w-4 text-white" />
									</div>

									{/* Task Name with gradient text */}
									<CardTitle
										className={cn(
											"text-sm font-semibold truncate",
											"bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400",
											"bg-clip-text text-transparent",
										)}
									>
										{props.data.name}
									</CardTitle>
								</div>

								<div className="flex items-center gap-2 shrink-0">
									{/* Status indicator */}
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<div
													className={cn(
														"w-3 h-3 rounded-full ring-2 ring-white dark:ring-gray-800",
														statusInfo.color,
														statusInfo.glow,
													)}
												/>
											</TooltipTrigger>
											<TooltipContent>
												<p className="capitalize">Status: {status}</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>

									{/* Settings button - appears on hover */}
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
								</div>
							</div>
						</CardHeader>

						<CardContent className="p-4 pt-3">
							{/* Task type badge */}
							<div className="flex flex-wrap gap-2 mb-3">
								<Badge
									variant="outline"
									className={cn(
										"text-xs font-medium border-2",
										"bg-gradient-to-r from-violet-500/10 to-purple-500/10 dark:from-violet-400/20 dark:to-purple-400/20",
										"border-transparent shadow-sm",
									)}
								>
									<Sparkles className="h-3 w-3 mr-1" />
									AI Agent
								</Badge>
								{props.data.status && props.data.status !== "pending" && (
									<Badge
										variant={status === "error" || status === "failed" ? "destructive" : "secondary"}
										className={cn(
											"text-xs capitalize",
											status === "running" && "bg-blue-500 dark:bg-blue-600 text-white animate-pulse",
											status === "completed" && "bg-emerald-500 dark:bg-emerald-600 text-white",
										)}
									>
										{StatusIcon && <StatusIcon className="h-3 w-3 mr-1" />}
										{status}
									</Badge>
								)}
							</div>

							{/* Description */}
							{props.data.description && (
								<p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
									{props.data.description}
								</p>
							)}

							{/* Agent Assignment Section */}
							<div className="pt-3 border-t border-violet-200/50 dark:border-violet-800/30">
								{props.data.assignedAssistant ? (
									<div className="flex items-center gap-2">
										{/* Avatar with gradient ring */}
										<div className="relative">
											<div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-purple-500 dark:from-violet-600 dark:to-purple-600 rounded-full blur-sm opacity-75" />
											<Avatar className="relative h-7 w-7 border-2 border-white dark:border-gray-900">
												{props.data.assignedAssistant.avatar ? (
													<AvatarImage
														src={props.data.assignedAssistant.avatar}
														alt={props.data.assignedAssistant.name}
													/>
												) : (
													<AvatarFallback className="text-xs bg-gradient-to-br from-violet-500 to-purple-500 dark:from-violet-600 dark:to-purple-600 text-white">
														{props.data.assignedAssistant.name
															.slice(0, 2)
															.toUpperCase()}
													</AvatarFallback>
												)}
											</Avatar>
										</div>
										<span className="text-xs font-medium flex-1 truncate">
											{props.data.assignedAssistant.name}
										</span>
										<Button
											variant="ghost"
											size="sm"
											className="ml-auto h-7 px-2 text-xs hover:bg-violet-500/10 dark:hover:bg-violet-400/10"
											onClick={handleAssignAssistant}
										>
											Change
										</Button>
									</div>
								) : (
									<Button
										variant="outline"
										size="sm"
										className={cn(
											"w-full gap-2",
											"bg-gradient-to-r from-violet-500/10 to-purple-500/10 dark:from-violet-400/20 dark:to-purple-400/20",
											"border-2 border-violet-300/50 dark:border-violet-700/50",
											"hover:from-violet-500/20 hover:to-purple-500/20 dark:hover:from-violet-400/30 dark:hover:to-purple-400/30",
											"transition-all duration-200 hover:scale-[1.02]",
										)}
										onClick={handleAssignAssistant}
									>
										<UserPlus className="h-4 w-4" />
										<span className="font-medium">Assign Agent</span>
									</Button>
								)}
							</div>
						</CardContent>

						{/* Add Agent Button Removed - using global add button now */}

						{/* Connection Handles with gradient */}
						<Handle
							type="target"
							position={Position.Left}
							className={cn(
								"w-3 h-3 border-2 border-white dark:border-gray-800",
								"bg-gradient-to-br from-violet-500 to-purple-500 dark:from-violet-600 dark:to-purple-600 shadow-lg",
								"transition-transform hover:scale-125",
							)}
							id="task-target"
							style={{ left: -6 }}
						/>
						<Handle
							type="source"
							position={Position.Right}
							className={cn(
								"w-3 h-3 border-2 border-white dark:border-gray-800",
								"bg-gradient-to-br from-violet-500 to-purple-500 dark:from-violet-600 dark:to-purple-600 shadow-lg",
								"transition-transform hover:scale-125",
							)}
							id="task-source"
							style={{ right: -6 }}
						/>
					</Card>
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
						config: {
							input: {
								source: "previous_node",
								parameters: {},
								prompt: props.data.config?.input?.prompt || "",
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
						metadata: {},
					}}
					previousNodeOutput={props.data.previousNodeOutput as any}
					onTest={handleTestTask}
					onUpdate={handleTaskUpdate}
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
