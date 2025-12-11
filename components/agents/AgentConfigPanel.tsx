"use client"

import React, { useState, useEffect } from "react"
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
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
	CheckCircle,
	Loader2,
	Settings2,
	FileText,
	Wrench,
	Database,
	Brain,
	ChevronLeft,
	ChevronRight,
	Cpu,
	AlertCircle,
} from "lucide-react"
import { GeneralConfig } from "@/components/configuration/GeneralConfig"
import { PromptsConfig } from "@/components/configuration/PromptsConfig"
import { ToolSelector } from "@/components/configuration/ToolSelector"
import { KnowledgeConfig } from "@/components/configuration/KnowledgeConfig"
import { MemoryConfig } from "@/components/configuration/MemoryConfig"
import { AssistantConfiguration, AssistantMetadata, Assistant } from "@/types/assistant"
import { useRouter } from "next/navigation"
import { mutate } from "swr"
import { useAgentConfigPanel } from "@/contexts/AgentConfigPanelContext"
import { cn } from "@/lib/utils"

interface AgentConfigPanelProps {
	assistant: Assistant
}

/**
 * Professional AI playground configuration panel
 * Displays as a collapsible side panel on desktop, sheet overlay on mobile
 */
export function AgentConfigPanel({ assistant }: AgentConfigPanelProps) {
	const { isOpen, togglePanel } = useAgentConfigPanel()
	const [config, setConfig] = useState({
		agent_id: assistant.assistant_id,
		description: assistant.metadata.description,
		agent_avatar: assistant.metadata.agent_avatar,
		graph_id: assistant.graph_id,
		created_at: assistant.created_at,
		updated_at: assistant.updated_at,
		name: assistant.name,
		metadata: {
			owner_id: String(assistant.metadata.owner_id),
		} as AssistantMetadata,
		config: assistant.config.configurable as AssistantConfiguration,
	})

	const [loading, setLoading] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)
	const [saveSuccess, setSaveSuccess] = useState<boolean>(false)
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false)
	const [isMobile, setIsMobile] = useState(false)
	const router = useRouter()

	// Detect mobile viewport
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 1024) // lg breakpoint
		}
		checkMobile()
		window.addEventListener("resize", checkMobile)
		return () => window.removeEventListener("resize", checkMobile)
	}, [])

	// Reset config state when panel opens to ensure we always start with fresh data
	useEffect(() => {
		if (isOpen) {
			setConfig({
				agent_id: assistant.assistant_id,
				description: assistant.metadata.description,
				agent_avatar: assistant.metadata.agent_avatar,
				graph_id: assistant.graph_id,
				created_at: assistant.created_at,
				updated_at: assistant.updated_at,
				name: assistant.name,
				metadata: {
					owner_id: String(assistant.metadata.owner_id),
				} as AssistantMetadata,
				config: assistant.config.configurable as AssistantConfiguration,
			})
			setError(null)
			setSaveSuccess(false)
			setHasUnsavedChanges(false)
		}
	}, [isOpen, assistant])

	// Track unsaved changes
	useEffect(() => {
		const hasChanges =
			config.name !== assistant.name ||
			config.description !== assistant.metadata.description ||
			JSON.stringify(config.config) !== JSON.stringify(assistant.config.configurable)
		setHasUnsavedChanges(hasChanges)
	}, [config, assistant])

	const handleChange = (field: string, value: unknown) => {
		setConfig((prev) => ({
			...prev,
			[field]: value,
		}))
	}

	const handleConfigurableChange = (field: string, value: unknown) => {
		setConfig((prev) => ({
			...prev,
			config: {
				...prev.config,
				[field]: value,
			},
		}))
	}

	const handleMCPServersChange = (servers: string[]) => {
		setConfig((prev) => ({
			...prev,
			config: {
				...prev.config,
				enabled_mcp_servers: servers,
			},
		}))
	}

	const handleSubmit = async () => {
		setLoading(true)
		setError(null)
		setSaveSuccess(false)

		try {
			const response = await fetch(`/api/agents/${assistant.assistant_id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: config.name,
					description: config.description,
					metadata: config.metadata,
					config: { configurable: config.config },
				}),
			})

			if (!response.ok) {
				const errorText = await response.text()
				throw new Error(`Failed to save: ${response.status}`)
			}

			const updatedAgent = await response.json()

			await mutate(`/api/agents/${assistant.assistant_id}`, updatedAgent, false)
			await mutate("/api/agents")

			setSaveSuccess(true)
			setHasUnsavedChanges(false)
			router.refresh()

			// Auto-hide success message after 3 seconds
			setTimeout(() => setSaveSuccess(false), 3000)
		} catch (err) {
			console.error("Error updating agent:", err)
			setError("Failed to update agent configuration. Please try again.")
		} finally {
			setLoading(false)
		}
	}

	// Get configuration status indicators
	const hasMemory = config.config.memory?.enabled
	const hasKnowledge = config.config.knowledge_base?.isEnabled
	const enabledTools = Array.isArray(config.config.enabled_mcp_servers)
		? config.config.enabled_mcp_servers.length
		: 0
	const avatarFallback = assistant.name.charAt(0).toUpperCase()

	// Desktop panel (collapsible side panel)
	const DesktopPanel = () => (
		<div
			className={cn(
				"hidden lg:flex flex-col border-l bg-background transition-all duration-300 ease-in-out",
				isOpen ? "fixed right-0 top-0 w-[420px] h-screen z-30" : "w-0"
			)}
			style={{
				minWidth: isOpen ? "420px" : "0px",
			}}
		>
			{/* Collapse/Expand Toggle Button */}
			<button
				onClick={togglePanel}
				className={cn(
					"absolute left-0 top-20 -translate-x-1/2 z-50",
					"h-10 w-6 rounded-l-lg border border-r-0",
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
					<div className="flex items-center gap-3">
						<Avatar className="h-12 w-12">
							{config.agent_avatar ? (
								<AvatarImage src={config.agent_avatar} alt={config.name} />
							) : (
								<AvatarFallback
									className="bg-primary/10"
									style={{
										backgroundColor: `hsl(${(config.name.length * 30) % 360}, 70%, 50%)`,
									}}
								>
									{avatarFallback}
								</AvatarFallback>
							)}
						</Avatar>
						<div className="flex-1 min-w-0">
							<h2 className="text-lg font-semibold truncate">{config.name}</h2>
							<p className="text-sm text-muted-foreground">Configuration</p>
						</div>
					</div>

					{/* Quick Stats */}
					<div className="flex flex-wrap gap-2">
						<Badge variant="outline" className="gap-1.5">
							<Cpu className="h-3.5 w-3.5" />
							<span className="text-xs">{config.config.model || "No model"}</span>
						</Badge>
						{hasMemory && (
							<Badge variant="secondary" className="gap-1.5">
								<Brain className="h-3.5 w-3.5" />
								<span className="text-xs">Memory</span>
							</Badge>
						)}
						{hasKnowledge && (
							<Badge variant="secondary" className="gap-1.5">
								<Database className="h-3.5 w-3.5" />
								<span className="text-xs">Knowledge</span>
							</Badge>
						)}
						{enabledTools > 0 && (
							<Badge variant="secondary" className="gap-1.5">
								<Wrench className="h-3.5 w-3.5" />
								<span className="text-xs">
									{enabledTools} {enabledTools === 1 ? "Tool" : "Tools"}
								</span>
							</Badge>
						)}
					</div>

					{/* Unsaved changes indicator */}
					{hasUnsavedChanges && (
						<Alert variant="default" className="py-2">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription className="text-xs">You have unsaved changes</AlertDescription>
						</Alert>
					)}
				</div>

				{/* Scrollable Configuration Sections */}
				<ScrollArea className="flex-1">
					<div className="px-6 py-4">
						<Accordion type="multiple" defaultValue={["general", "prompt"]} className="space-y-3">
							{/* General Section */}
							<AccordionItem value="general" className="border rounded-lg px-4">
								<AccordionTrigger className="hover:no-underline py-3">
									<div className="flex items-center gap-2">
										<Settings2 className="h-4 w-4" />
										<span className="font-medium">General Settings</span>
									</div>
								</AccordionTrigger>
								<AccordionContent>
									<div className="pt-2 pb-1">
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
										/>
									</div>
								</AccordionContent>
							</AccordionItem>

							{/* Prompt Section */}
							<AccordionItem value="prompt" className="border rounded-lg px-4">
								<AccordionTrigger className="hover:no-underline py-3">
									<div className="flex items-center gap-2">
										<FileText className="h-4 w-4" />
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

							{/* Tools Section */}
							<AccordionItem value="tools" className="border rounded-lg px-4">
								<AccordionTrigger className="hover:no-underline py-3">
									<div className="flex items-center gap-2">
										<Wrench className="h-4 w-4" />
										<span className="font-medium">Tools & Integrations</span>
										{enabledTools > 0 && (
											<Badge variant="secondary" className="ml-auto">
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

							{/* Knowledge Section */}
							<AccordionItem value="knowledge" className="border rounded-lg px-4">
								<AccordionTrigger className="hover:no-underline py-3">
									<div className="flex items-center gap-2">
										<Database className="h-4 w-4" />
										<span className="font-medium">Knowledge Base</span>
										{hasKnowledge && (
											<Badge variant="secondary" className="ml-auto gap-1">
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

							{/* Memory Section */}
							<AccordionItem value="memory" className="border rounded-lg px-4">
								<AccordionTrigger className="hover:no-underline py-3">
									<div className="flex items-center gap-2">
										<Brain className="h-4 w-4" />
										<span className="font-medium">Memory</span>
										{hasMemory && (
											<Badge variant="secondary" className="ml-auto gap-1">
												<CheckCircle className="h-3 w-3" />
												Enabled
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
						</Accordion>
					</div>
				</ScrollArea>

				{/* Footer with Save/Cancel */}
				<div className="flex-none border-t px-6 py-4 bg-background/95 backdrop-blur space-y-3">
					{error && (
						<Alert variant="destructive" className="py-2">
							<AlertDescription className="text-sm">{error}</AlertDescription>
						</Alert>
					)}

					{saveSuccess && (
						<Alert className="py-2 border-green-500 bg-green-50 dark:bg-green-950/30">
							<CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
							<AlertDescription className="text-sm text-green-600 dark:text-green-400">
								Configuration saved successfully!
							</AlertDescription>
						</Alert>
					)}

					<div className="flex gap-2">
						<Button
							variant="outline"
							onClick={() => {
								setConfig({
									agent_id: assistant.assistant_id,
									description: assistant.metadata.description,
									agent_avatar: assistant.metadata.agent_avatar,
									graph_id: assistant.graph_id,
									created_at: assistant.created_at,
									updated_at: assistant.updated_at,
									name: assistant.name,
									metadata: {
										owner_id: String(assistant.metadata.owner_id),
									} as AssistantMetadata,
									config: assistant.config.configurable as AssistantConfiguration,
								})
								setHasUnsavedChanges(false)
							}}
							disabled={loading || !hasUnsavedChanges}
							className="flex-1"
						>
							Reset
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={loading || !hasUnsavedChanges}
							className="flex-1"
						>
							{loading ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Saving...
								</>
							) : (
								"Save Changes"
							)}
						</Button>
					</div>
				</div>
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
				</SheetHeader>

				{/* Configuration Status Bar */}
				<div className="px-6 py-3 bg-muted/30 border-b">
					<div className="flex flex-wrap gap-2">
						<Badge variant="outline" className="gap-1">
							<FileText className="h-3 w-3" />
							Model: {config.config.model || "Not set"}
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
							defaultValue={["general", "prompt"]}
							className="w-full space-y-2"
						>
							{/* Same accordion structure as desktop */}
							<AccordionItem value="general" className="border rounded-lg px-4">
								<AccordionTrigger className="hover:no-underline">
									<div className="flex items-center gap-2">
										<Settings2 className="h-4 w-4" />
										<span className="font-semibold">General Settings</span>
									</div>
								</AccordionTrigger>
								<AccordionContent>
									<div className="pt-2">
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

				{/* Footer with Save/Cancel */}
				<div className="border-t px-6 py-4 bg-background">
					{error && (
						<Alert variant="destructive" className="mb-4">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					{saveSuccess && (
						<Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-950">
							<CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
							<AlertDescription className="text-green-600 dark:text-green-400">
								Configuration saved successfully!
							</AlertDescription>
						</Alert>
					)}

					<div className="flex justify-end gap-3">
						<Button variant="outline" onClick={togglePanel} disabled={loading}>
							Cancel
						</Button>
						<Button onClick={handleSubmit} disabled={loading} className="min-w-[120px]">
							{loading ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Saving...
								</>
							) : (
								"Save Changes"
							)}
						</Button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	)

	return (
		<>
			<DesktopPanel />
			<MobileSheet />
		</>
	)
}
