"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet"
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
	CheckCircle,
	Settings2,
	FileText,
	Wrench,
	Database,
	Brain,
	ChevronLeft,
	ChevronRight,
	Cpu,
} from "lucide-react"
import { GeneralConfig } from "@/components/configuration/GeneralConfig"
import { ModelConfig } from "@/components/configuration/ModelConfig"
import { PromptsConfig } from "@/components/configuration/PromptsConfig"
import { ToolSelector } from "@/components/configuration/ToolSelector"
import { KnowledgeConfig } from "@/components/configuration/KnowledgeConfig"
import { MemoryConfig } from "@/components/configuration/MemoryConfig"
import { AssistantConfiguration, AssistantMetadata, Assistant } from "@/types/assistant"
import { mutate } from "swr"
import { useAgentConfigPanel } from "@/contexts/AgentConfigPanelContext"
import { cn } from "@/lib/utils"
import { useAgent } from "@/hooks/useAgent"
import { getLlmLabel } from "@/lib/llm/catalog"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"

interface AgentConfigPanelProps {
	assistant: Assistant
}

/**
 * Professional AI playground configuration panel
 * Displays as a collapsible side panel on desktop, sheet overlay on mobile
 */
export function AgentConfigPanel({ assistant }: AgentConfigPanelProps) {
	const { isOpen, togglePanel } = useAgentConfigPanel()

	const { assistant: liveAssistant } = useAgent(assistant.assistant_id, {
		fallbackData: assistant,
	})
	const currentAssistant = liveAssistant || assistant

	const assistantToDraft = (a: Assistant) => ({
		agent_id: a.assistant_id,
		description: a.metadata.description,
		agent_avatar: a.metadata.agent_avatar,
		graph_id: a.graph_id,
		created_at: a.created_at,
		updated_at: a.updated_at,
		name: a.name,
		metadata: {
			owner_id: String(a.metadata.owner_id),
		} as AssistantMetadata,
		config: a.config.configurable as AssistantConfiguration,
	})

	const [config, setConfig] = useState(() => assistantToDraft(currentAssistant))

	// Ensure draft updates when switching between agents (navigation)
	useEffect(() => {
		setConfig(assistantToDraft(currentAssistant))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentAssistant.assistant_id])

	const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "error">("idle")
	const [saveError, setSaveError] = useState<string | null>(null)

	const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const lastSavedSnapshotRef = useRef<string>("")
	const isInitialSnapshotRef = useRef(true)
	const lastEditKindRef = useRef<"text" | "other">("other")
	const [isMobile, setIsMobile] = useState(false)
	const [isSettingsOpen, setIsSettingsOpen] = useState(false)

	// Detect mobile viewport
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 1024) // lg breakpoint
		}
		checkMobile()
		window.addEventListener("resize", checkMobile)
		return () => window.removeEventListener("resize", checkMobile)
	}, [])

	const updatePayload = useMemo(() => {
		return {
			name: config.name,
			metadata: {
				...config.metadata,
				description: config.description || "",
				agent_avatar: config.agent_avatar || null,
			},
			config: {
				configurable: config.config,
			},
		}
	}, [config.agent_avatar, config.config, config.description, config.metadata, config.name])

	const updateSnapshot = useMemo(() => JSON.stringify(updatePayload), [updatePayload])

	// Autosave agent changes (debounced + snapshot guarded to prevent "save loops")
	useEffect(() => {
		if (!currentAssistant.assistant_id) return

		if (isInitialSnapshotRef.current) {
			lastSavedSnapshotRef.current = updateSnapshot
			isInitialSnapshotRef.current = false
			return
		}

		if (updateSnapshot === lastSavedSnapshotRef.current) return

		const delayMs = lastEditKindRef.current === "text" ? 800 : 250
		if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)

		autosaveTimerRef.current = setTimeout(async () => {
			setSaveStatus("saving")
			setSaveError(null)
			try {
				const response = await fetch(`/api/agents/${currentAssistant.assistant_id}`, {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: updateSnapshot,
				})

				if (!response.ok) {
					const errorText = await response.text().catch(() => "")
					throw new Error(errorText || `Failed to save: ${response.status}`)
				}

				const updatedAgent = (await response.json()) as Assistant

				// Update snapshot from server response to avoid resaving due to server normalization,
				// but DO NOT overwrite the local draft state (prevents cursor loss mid-edit).
				const nextDraft = assistantToDraft(updatedAgent)
				const nextPayload = {
					name: nextDraft.name,
					metadata: {
						...nextDraft.metadata,
						description: nextDraft.description || "",
						agent_avatar: nextDraft.agent_avatar || null,
					},
					config: { configurable: nextDraft.config },
				}
				lastSavedSnapshotRef.current = JSON.stringify(nextPayload)

				// Update caches so header + lists update immediately.
				await mutate(`/api/agents/${currentAssistant.assistant_id}`, updatedAgent, false)
				await mutate("/api/agents")

				setSaveStatus("idle")
			} catch (err) {
				console.error("Autosave failed:", err)
				setSaveStatus("error")
				setSaveError("Failed to save changes. Check your connection and try again.")
			}
		}, delayMs)

		return () => {
			if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [updateSnapshot, currentAssistant.assistant_id])

	const handleChange = (field: string, value: unknown) => {
		lastEditKindRef.current = field === "name" || field === "description" ? "text" : "other"
		setConfig((prev) => ({
			...prev,
			[field]: value,
		}))

		// Optimistically update the SWR cache so the header reflects changes instantly.
		const optimistic = {
			...currentAssistant,
			name: field === "name" ? String(value) : currentAssistant.name,
			metadata: {
				...currentAssistant.metadata,
				description: field === "description" ? String(value) : (currentAssistant.metadata.description || ""),
				agent_avatar:
					field === "agent_avatar" ? (value === null ? undefined : String(value)) : currentAssistant.metadata.agent_avatar,
			},
		} satisfies Assistant

		void mutate(`/api/agents/${currentAssistant.assistant_id}`, optimistic, false)
	}

	const handleConfigurableChange = (field: string, value: unknown) => {
		lastEditKindRef.current = field === "prompt_template" ? "text" : "other"
		setConfig((prev) => ({
			...prev,
			config: {
				...prev.config,
				[field]: value,
			},
		}))

		// Avoid blasting the SWR cache on every keystroke for large text fields.
		if (field === "prompt_template") return

		const optimistic = {
			...currentAssistant,
			config: {
				...currentAssistant.config,
				configurable: {
					...currentAssistant.config.configurable,
					[field]: value as any,
				},
			},
		} satisfies Assistant

		void mutate(`/api/agents/${currentAssistant.assistant_id}`, optimistic, false)
	}

	const handleMCPServersChange = (servers: string[]) => {
		lastEditKindRef.current = "other"
		setConfig((prev) => ({
			...prev,
			config: {
				...prev.config,
				enabled_mcp_servers: servers,
			},
		}))

		const optimistic = {
			...currentAssistant,
			config: {
				...currentAssistant.config,
				configurable: {
					...currentAssistant.config.configurable,
					enabled_mcp_servers: servers,
				},
			},
		} satisfies Assistant

		void mutate(`/api/agents/${currentAssistant.assistant_id}`, optimistic, false)
	}

	// Get configuration status indicators
	const hasMemory = config.config.memory?.enabled
	const hasKnowledge = config.config.knowledge_base?.isEnabled
	const enabledTools = Array.isArray(config.config.enabled_mcp_servers)
		? config.config.enabled_mcp_servers.length
		: 0

	const modelLabel = getLlmLabel(config.config.llm, config.config.model)

	// Desktop panel (collapsible side panel)
	const DesktopPanel = () => (
		<div
			className={cn(
				"hidden lg:flex h-full flex-col border-l bg-background transition-all duration-300 ease-in-out relative",
				isOpen ? "w-[380px]" : "w-0"
			)}
			style={{
				minWidth: isOpen ? "420px" : "0px",
			}}
		>
			{/* Collapse/Expand Toggle Button */}
			<button
				onClick={togglePanel}
				className={cn(
					"absolute -left-8 top-20 z-50",
					"h-10 w-8 rounded-l-lg border border-r-0",
					"bg-background hover:bg-accent",
					"flex items-center justify-center",
					"transition-colors duration-200",
					"shadow-md"
				)}
				aria-label={isOpen ? "Collapse configuration panel" : "Expand configuration panel"}
			>
				{isOpen ? (
					<ChevronRight className="h-4 w-4 text-muted-foreground" />
				) : (
					<ChevronLeft className="h-4 w-4 text-muted-foreground" />
				)}
			</button>

			{/* Panel Content */}
			<div className={cn("flex flex-col h-full overflow-hidden", !isOpen && "opacity-0")}>
				{/* Header Section */}
				<div className="flex-none px-6 pt-6 pb-4 border-b space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-sm font-medium text-muted-foreground">Configuration</h2>
						<div className="flex items-center gap-2">
							{saveStatus === "saving" && (
								<span className="text-xs text-muted-foreground">Saving…</span>
							)}
							{saveStatus === "error" && (
								<span className="text-xs text-destructive">Save failed</span>
							)}
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setIsSettingsOpen(true)}
								aria-label="Open agent settings"
							>
								<Settings2 className="h-4 w-4" />
							</Button>
						</div>
					</div>

					

					{saveError && (
						<Alert variant="destructive" className="py-2">
							<AlertDescription className="text-xs">{saveError}</AlertDescription>
						</Alert>
					)}
				</div>

				{/* Scrollable Configuration Sections */}
				<ScrollArea className="flex-1">
					<div className="px-6 py-4">
						<Accordion type="multiple" defaultValue={["prompt", "models"]} className="space-y-3">
							{/* Prompt Section */}
							<AccordionItem value="prompt" className="border border-violet-200/30 dark:border-violet-800/30 rounded-lg px-4 bg-gradient-to-br from-violet-50/30 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-950/20">
								<AccordionTrigger className="hover:no-underline py-3">
									<div className="flex items-center gap-2">
										<FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
										<span className="font-medium">System Prompt</span>
									</div>
								</AccordionTrigger>
								<AccordionContent>
									<div className="pt-2 pb-1">
										<PromptsConfig
											config={config.config as AssistantConfiguration}
											onChange={handleConfigurableChange}
										/>
									</div>
								</AccordionContent>
							</AccordionItem>

							{/* Models Section - Compact */}
							<AccordionItem value="models" className="border border-blue-200/30 dark:border-blue-800/30 rounded-lg px-4 bg-gradient-to-br from-blue-50/30 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/20">
								<AccordionTrigger className="hover:no-underline py-3">
									<div className="flex items-center gap-2">
										<Cpu className="h-4 w-4 text-blue-600 dark:text-blue-400" />
										<span className="font-medium text-sm">Model: {modelLabel}</span>
									</div>
								</AccordionTrigger>
								<AccordionContent>
									<div className="pt-2 pb-1">
										<ModelConfig
											config={config.config as AssistantConfiguration}
											onConfigurableChange={handleConfigurableChange}
										/>
									</div>
								</AccordionContent>
							</AccordionItem>

							{/* Memory Section - Sleek */}
							<AccordionItem value="memory" className="border border-purple-200/30 dark:border-purple-800/30 rounded-lg px-4 bg-gradient-to-br from-purple-50/30 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/20">
								<AccordionTrigger className="hover:no-underline py-3">
									<div className="flex items-center gap-2">
										<Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
										<span className="font-medium">Memory</span>
										{hasMemory && (
											<Badge variant="secondary" className="ml-auto gap-1 bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/50">
												<CheckCircle className="h-3 w-3" />
												On
											</Badge>
										)}
									</div>
								</AccordionTrigger>
								<AccordionContent>
									<div className="pt-2 pb-1">
										<MemoryConfig
											config={config.config as AssistantConfiguration}
											onChange={handleConfigurableChange}
											assistantId={assistant.assistant_id}
										/>
									</div>
								</AccordionContent>
							</AccordionItem>

							{/* Knowledge Section */}
							<AccordionItem value="knowledge" className="border border-emerald-200/30 dark:border-emerald-800/30 rounded-lg px-4 bg-gradient-to-br from-emerald-50/30 to-green-50/30 dark:from-emerald-950/20 dark:to-green-950/20">
								<AccordionTrigger className="hover:no-underline py-3">
									<div className="flex items-center gap-2">
										<Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
										<span className="font-medium">Knowledge Base</span>
										{hasKnowledge && (
											<Badge variant="secondary" className="ml-auto gap-1 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/50">
												<CheckCircle className="h-3 w-3" />
												Active
											</Badge>
										)}
									</div>
								</AccordionTrigger>
								<AccordionContent>
									<div className="pt-2 pb-1">
										<KnowledgeConfig
											config={config.config as AssistantConfiguration}
											onChange={handleConfigurableChange}
											assistant_id={assistant.assistant_id}
										/>
									</div>
								</AccordionContent>
							</AccordionItem>

							{/* Tools Section */}
							<AccordionItem value="tools" className="border border-orange-200/30 dark:border-orange-800/30 rounded-lg px-4 bg-gradient-to-br from-orange-50/30 to-amber-50/30 dark:from-orange-950/20 dark:to-amber-950/20">
								<AccordionTrigger className="hover:no-underline py-3">
									<div className="flex items-center gap-2">
										<Wrench className="h-4 w-4 text-orange-600 dark:text-orange-400" />
										<span className="font-medium">Tools & Integrations</span>
										{enabledTools > 0 && (
											<Badge variant="secondary" className="ml-auto bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200/50 dark:border-orange-800/50">
												{enabledTools}
											</Badge>
										)}
									</div>
								</AccordionTrigger>
								<AccordionContent>
									<div className="pt-2 pb-1">
										<ToolSelector
											enabledMCPServers={config.config.enabled_mcp_servers || []}
											onMCPServersChange={handleMCPServersChange}
										/>
									</div>
								</AccordionContent>
							</AccordionItem>
						</Accordion>
					</div>
				</ScrollArea>

				{/* No footer: this panel is fully persistent/autosaving */}
			</div>
		</div>
	)

	// Mobile sheet (overlay)
	const MobileSheet = () => (
		<Sheet open={isOpen && isMobile} onOpenChange={togglePanel}>
			<SheetContent
				side="right"
				className="w-full sm:w-[600px] p-0 flex flex-col"
			>
				<SheetHeader className="px-6 pt-6 pb-4 border-b">
					<SheetTitle className="text-2xl font-bold flex items-center gap-2">
						<Settings2 className="h-6 w-6" />
						Agent Configuration
					</SheetTitle>
					<SheetDescription>
						Customize your agent&apos;s behavior, capabilities, and knowledge
					</SheetDescription>
					<div className="pt-2">
						{saveStatus === "saving" && (
							<p className="text-xs text-muted-foreground">Saving…</p>
						)}
						{saveStatus === "error" && saveError && (
							<p className="text-xs text-destructive">{saveError}</p>
						)}
					</div>
				</SheetHeader>

				{/* Configuration Status Bar */}
				<div className="px-6 py-3 bg-muted/30 border-b">
					<div className="flex flex-wrap gap-2">
						<Badge variant="outline" className="gap-1">
							<FileText className="h-3 w-3" />
							Model: {modelLabel}
						</Badge>
						{hasMemory && (
							<Badge variant="secondary" className="gap-1">
								<Brain className="h-3 w-3" />
								Memory Enabled
							</Badge>
						)}
						{hasKnowledge && (
							<Badge variant="secondary" className="gap-1">
								<Database className="h-3 w-3" />
								Knowledge Base
							</Badge>
						)}
						{enabledTools > 0 && (
							<Badge variant="secondary" className="gap-1">
								<Wrench className="h-3 w-3" />
								{enabledTools} {enabledTools === 1 ? "Tool" : "Tools"}
							</Badge>
						)}
					</div>
				</div>

				{/* Scrollable Configuration Sections */}
				<ScrollArea className="flex-1 px-6">
					<div className="py-6">
						<Accordion
							type="multiple"
							defaultValue={["models", "prompt"]}
							className="w-full space-y-2"
						>
							{/* Models Section */}
							<AccordionItem value="models" className="border rounded-lg px-4">
								<AccordionTrigger className="hover:no-underline">
									<div className="flex items-center gap-2">
										<Cpu className="h-4 w-4" />
										<span className="font-semibold">Models</span>
									</div>
								</AccordionTrigger>
								<AccordionContent>
									<div className="pt-2">
										<ModelConfig
											config={config.config as AssistantConfiguration}
											onConfigurableChange={handleConfigurableChange}
										/>
									</div>
								</AccordionContent>
							</AccordionItem>

							<AccordionItem value="prompt" className="border rounded-lg px-4">
								<AccordionTrigger className="hover:no-underline">
									<div className="flex items-center gap-2">
										<FileText className="h-4 w-4" />
										<span className="font-semibold">System Prompt</span>
									</div>
								</AccordionTrigger>
								<AccordionContent>
									<div className="pt-2">
										<PromptsConfig
											config={config.config as AssistantConfiguration}
											onChange={handleConfigurableChange}
										/>
									</div>
								</AccordionContent>
							</AccordionItem>

							<AccordionItem value="tools" className="border rounded-lg px-4">
								<AccordionTrigger className="hover:no-underline">
									<div className="flex items-center gap-2">
										<Wrench className="h-4 w-4" />
										<span className="font-semibold">Tools & Integrations</span>
										{enabledTools > 0 && (
											<Badge variant="secondary" className="ml-2">
												{enabledTools} enabled
											</Badge>
										)}
									</div>
								</AccordionTrigger>
								<AccordionContent>
									<div className="pt-2">
										<ToolSelector
											enabledMCPServers={config.config.enabled_mcp_servers || []}
											onMCPServersChange={handleMCPServersChange}
										/>
									</div>
								</AccordionContent>
							</AccordionItem>

							<AccordionItem value="knowledge" className="border rounded-lg px-4">
								<AccordionTrigger className="hover:no-underline">
									<div className="flex items-center gap-2">
										<Database className="h-4 w-4" />
										<span className="font-semibold">Knowledge Base</span>
										{hasKnowledge && (
											<Badge variant="secondary" className="ml-2 gap-1">
												<CheckCircle className="h-3 w-3" />
												Active
											</Badge>
										)}
									</div>
								</AccordionTrigger>
								<AccordionContent>
									<div className="pt-2">
										<KnowledgeConfig
											config={config.config as AssistantConfiguration}
											onChange={handleConfigurableChange}
											assistant_id={assistant.assistant_id}
										/>
									</div>
								</AccordionContent>
							</AccordionItem>

							<AccordionItem value="memory" className="border rounded-lg px-4">
								<AccordionTrigger className="hover:no-underline">
									<div className="flex items-center gap-2">
										<Brain className="h-4 w-4" />
										<span className="font-semibold">Memory</span>
										{hasMemory && (
											<Badge variant="secondary" className="ml-2 gap-1">
												<CheckCircle className="h-3 w-3" />
												Enabled
											</Badge>
										)}
									</div>
								</AccordionTrigger>
								<AccordionContent>
									<div className="pt-2">
										<MemoryConfig
											config={config.config as AssistantConfiguration}
											onChange={handleConfigurableChange}
											assistantId={assistant.assistant_id}
										/>
									</div>
								</AccordionContent>
							</AccordionItem>
						</Accordion>
					</div>
				</ScrollArea>

				{/* No footer: this sheet is fully persistent/autosaving */}
			</SheetContent>
		</Sheet>
	)

	return (
		<>
			<DesktopPanel />
			<MobileSheet />

			{/* Settings modal for avatar, description & destructive actions */}
			<Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
				<DialogContent className="max-w-xl">
					<DialogHeader>
						<DialogTitle>Agent settings</DialogTitle>
						<DialogDescription>
							Update the agent&apos;s identity and manage advanced actions.
						</DialogDescription>
					</DialogHeader>

					<div className="mt-4">
						<GeneralConfig
							config={{
								id: config.agent_id,
								name: config.name,
								description: config.description || "",
								metadata: config.metadata,
								config: config.config as AssistantConfiguration,
								agent_avatar: config.agent_avatar,
							}}
							onChange={handleChange}
							onConfigurableChange={handleConfigurableChange}
							showProfileSection
							showModelSection={false}
							showDangerZone
						/>
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}
