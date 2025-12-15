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
							Model: {getLlmLabel(config.config.llm, config.config.model)}
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
							{/* General Section */}
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

							{/* Prompt Section */}
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

							{/* Tools Section */}
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

							{/* Knowledge Section */}
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

							{/* Memory Section */}
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
						<Button variant="outline" onClick={closeSidebar} disabled={loading}>
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
}
