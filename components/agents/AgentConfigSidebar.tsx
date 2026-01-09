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
import { CheckCircle, Loader2, Settings2, FileText, Wrench, Database, Brain } from "lucide-react"
import { GeneralConfig } from "@/components/configuration/GeneralConfig"
import { PromptsConfig } from "@/components/configuration/PromptsConfig"
import { ToolSelector } from "@/components/configuration/ToolSelector"
import { KnowledgeConfig } from "@/components/configuration/KnowledgeConfig"
import { MemoryConfig } from "@/components/configuration/MemoryConfig"
import { AssistantConfiguration, AssistantMetadata, Assistant } from "@/types/assistant"
import { useRouter } from "next/navigation"
import { mutate } from "swr"
import { useAgentConfigSidebar } from "@/contexts/AgentConfigSidebarContext"
import { cn } from "@/lib/utils"
import { getLlmLabel } from "@/lib/llm/catalog"

interface AgentConfigSidebarProps {
	assistant: Assistant
}

export function AgentConfigSidebar({ assistant }: AgentConfigSidebarProps) {
	const { isOpen, closeSidebar } = useAgentConfigSidebar()
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
	const router = useRouter()

	// Reset config state when sidebar opens to ensure we always start with fresh data
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
		}
	}, [isOpen, assistant])

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
			// Remove selected_tools from config before saving to persistent storage
			// selected_tools is only for playground/workflow runtime context, not agent config
			const { selected_tools, ...configToPersist } = config.config
			
			const response = await fetch(`/api/agents/${assistant.assistant_id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: config.name,
					description: config.description,
					metadata: config.metadata,
					config: { configurable: configToPersist },
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

	return (
		<Sheet open={isOpen} onOpenChange={closeSidebar}>
			<SheetContent
				side="right"
				className="w-full sm:w-[600px] md:w-[700px] lg:w-[800px] p-0 flex flex-col"
			>
				<SheetHeader className="px-6 pt-6 pb-4 border-b border-violet-200/30 dark:border-violet-800/30 bg-gradient-to-r from-violet-500/5 to-purple-500/5">
					<SheetTitle className="text-2xl font-bold flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
						<Settings2 className="h-6 w-6 text-violet-600 dark:text-violet-400" />
						Agent Configuration
					</SheetTitle>
					<SheetDescription className="text-muted-foreground">
						Customize your agent&apos;s behavior, capabilities, and knowledge
					</SheetDescription>
				</SheetHeader>

				{/* Configuration Status Bar */}
				<div className="px-6 py-3 bg-gradient-to-r from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20 border-b border-violet-200/30 dark:border-violet-800/30">
					<div className="flex flex-wrap gap-2">
						<Badge variant="secondary" className="gap-1 bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/50">
							<FileText className="h-3 w-3" />
							Model: {getLlmLabel(config.config.llm, config.config.model)}
						</Badge>
						{hasMemory && (
							<Badge variant="secondary" className="gap-1 bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/50">
								<Brain className="h-3 w-3" />
								Memory Enabled
							</Badge>
						)}
						{hasKnowledge && (
							<Badge variant="secondary" className="gap-1 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/50">
								<Database className="h-3 w-3" />
								Knowledge Base
							</Badge>
						)}
						{enabledTools > 0 && (
							<Badge variant="secondary" className="gap-1 bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200/50 dark:border-orange-800/50">
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
							{/* General Section */}
							<AccordionItem value="general" className="border border-violet-200/30 dark:border-violet-800/30 rounded-lg px-4 bg-gradient-to-br from-violet-50/30 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-950/20">
								<AccordionTrigger className="hover:no-underline">
									<div className="flex items-center gap-2">
										<Settings2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
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

							{/* Prompt Section */}
							<AccordionItem value="prompt" className="border border-violet-200/30 dark:border-violet-800/30 rounded-lg px-4 bg-gradient-to-br from-violet-50/30 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-950/20">
								<AccordionTrigger className="hover:no-underline">
									<div className="flex items-center gap-2">
										<FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
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

							{/* Tools Section */}
							<AccordionItem value="tools" className="border border-orange-200/30 dark:border-orange-800/30 rounded-lg px-4 bg-gradient-to-br from-orange-50/30 to-amber-50/30 dark:from-orange-950/20 dark:to-amber-950/20">
								<AccordionTrigger className="hover:no-underline">
									<div className="flex items-center gap-2">
										<Wrench className="h-4 w-4 text-orange-600 dark:text-orange-400" />
										<span className="font-semibold">Tools & Integrations</span>
										{enabledTools > 0 && (
											<Badge variant="secondary" className="ml-2 bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200/50 dark:border-orange-800/50">
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

							{/* Knowledge Section */}
							<AccordionItem value="knowledge" className="border border-emerald-200/30 dark:border-emerald-800/30 rounded-lg px-4 bg-gradient-to-br from-emerald-50/30 to-green-50/30 dark:from-emerald-950/20 dark:to-green-950/20">
								<AccordionTrigger className="hover:no-underline">
									<div className="flex items-center gap-2">
										<Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
										<span className="font-semibold">Knowledge Base</span>
										{hasKnowledge && (
											<Badge variant="secondary" className="ml-2 gap-1 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/50">
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

							{/* Memory Section */}
							<AccordionItem value="memory" className="border border-purple-200/30 dark:border-purple-800/30 rounded-lg px-4 bg-gradient-to-br from-purple-50/30 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/20">
								<AccordionTrigger className="hover:no-underline">
									<div className="flex items-center gap-2">
										<Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
										<span className="font-semibold">Memory</span>
										{hasMemory && (
											<Badge variant="secondary" className="ml-2 gap-1 bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/50">
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
						<Button variant="outline" onClick={closeSidebar} disabled={loading}>
							Cancel
						</Button>
						<Button onClick={handleSubmit} disabled={loading} className="min-w-[120px] bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white">
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
}
