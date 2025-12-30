"use client"

import { useState, useEffect, useRef } from "react"
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
	FileText,
	Wrench,
	Database,
	Brain,
	Cpu,
	Loader2,
	ArrowRight,
} from "lucide-react"
import { ModelConfig } from "@/components/configuration/ModelConfig"
import { PromptsConfig } from "@/components/configuration/PromptsConfig"
import { ToolSelector } from "@/components/configuration/ToolSelector"
import { KnowledgeConfig } from "@/components/configuration/KnowledgeConfig"
import { MemoryConfig } from "@/components/configuration/MemoryConfig"
import { AssistantConfiguration, Assistant } from "@/types/assistant"
import { mutate } from "swr"
import { useAgent } from "@/hooks/useAgent"
import { getLlmLabel } from "@/lib/llm/catalog"
import { toast } from "@/hooks/useToast"
import { OFFICIAL_MCP_SERVERS } from "@/lib/mcp/officialMcpServers"
import Image from "next/image"
import { usePlaygroundStore } from "@/lib/stores/playgroundStore"
import { ContextViewer } from "./ContextViewer"

interface PlaygroundAgentConfigProps {
	assistant: Assistant
	onConfigChange?: () => void
}

export function PlaygroundAgentConfig({ assistant, onConfigChange }: PlaygroundAgentConfigProps) {
	const { assistant: fullAssistant, isLoading, isError } = useAgent(assistant.assistant_id)
	const { currentContext } = usePlaygroundStore()
	const [config, setConfig] = useState<AssistantConfiguration | null>(null)
	const [isSaving, setIsSaving] = useState(false)
	const [saveError, setSaveError] = useState<string | null>(null)
	const [toolLogos, setToolLogos] = useState<Record<string, string>>({})
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const lastSavedConfigRef = useRef<string>("")
	const isPromptEditingRef = useRef(false)

	// Load full assistant data when available
	useEffect(() => {
		if (fullAssistant) {
			const assistantConfig = fullAssistant.config?.configurable as AssistantConfiguration
			setConfig(assistantConfig || assistant.config?.configurable as AssistantConfiguration)
		} else if (assistant.config?.configurable) {
			setConfig(assistant.config.configurable as AssistantConfiguration)
		}
	}, [fullAssistant, assistant])

	// Load tool logos
	useEffect(() => {
		if (!config?.enabled_mcp_servers) return
		
		const logos: Record<string, string> = {}
		config.enabled_mcp_servers.forEach((qualifiedName) => {
			const server = OFFICIAL_MCP_SERVERS.find(
				(s) => s.qualifiedName === qualifiedName || qualifiedName.includes(s.qualifiedName)
			)
			if (server?.logoUrl) {
				logos[qualifiedName] = server.logoUrl
			}
		})
		setToolLogos(logos)
	}, [config?.enabled_mcp_servers])

	// Auto-save function
	const autoSave = async (configToSave: AssistantConfiguration, skipPrompt = false) => {
		if (!fullAssistant || !configToSave) return

		// Skip if prompt is being edited
		if (isPromptEditingRef.current && !skipPrompt) return

		const configString = JSON.stringify(configToSave)
		if (configString === lastSavedConfigRef.current) return

		setIsSaving(true)
		setSaveError(null)

		try {
			const response = await fetch(`/api/agents/${assistant.assistant_id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: fullAssistant.name,
					config: {
						configurable: configToSave,
					},
				}),
			})

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}))
				throw new Error(errorData.error || "Failed to save configuration")
			}

			const updatedAgent = await response.json()

			// Update cache
			await mutate(`/api/agents/${assistant.assistant_id}`, updatedAgent, false)
			await mutate("/api/agents")

			lastSavedConfigRef.current = configString
			onConfigChange?.()
		} catch (error) {
			console.error("Error saving configuration:", error)
			const errorMessage =
				error instanceof Error ? error.message : "Failed to save configuration"
			setSaveError(errorMessage)
			toast({
				title: "Error",
				description: errorMessage,
				variant: "destructive",
			})
		} finally {
			setIsSaving(false)
		}
	}

	// Auto-save on config changes (debounced, except prompt)
	useEffect(() => {
		if (!config || isPromptEditingRef.current) return

		// Clear existing timeout
		if (saveTimeoutRef.current) {
			clearTimeout(saveTimeoutRef.current)
		}

		// Debounce save by 500ms
		saveTimeoutRef.current = setTimeout(() => {
			autoSave(config)
		}, 500)

		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current)
			}
		}
	}, [config, fullAssistant, assistant.assistant_id, onConfigChange])

	// Initialize last saved config
	useEffect(() => {
		if (config) {
			lastSavedConfigRef.current = JSON.stringify(config)
		}
	}, [])

	const handleConfigurableChange = (
		field: keyof AssistantConfiguration,
		value: unknown
	) => {
		if (!config) return
		setConfig({
			...config,
			[field]: value,
		})
	}

	const handlePromptChange = (field: keyof AssistantConfiguration, value: unknown) => {
		if (!config) return
		isPromptEditingRef.current = false
		const newConfig = {
			...config,
			[field]: value,
		}
		setConfig(newConfig)
		// Save immediately on blur (prompt change)
		setTimeout(() => {
			autoSave(newConfig, true)
		}, 100)
	}

	const handlePromptFocus = () => {
		isPromptEditingRef.current = true
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-8">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		)
	}

	if (isError || !config) {
		return (
			<Alert variant="destructive">
				<AlertDescription>
					{isError?.message || "Failed to load agent configuration"}
				</AlertDescription>
			</Alert>
		)
	}

	const modelLabel = config.llm
		? getLlmLabel(config.llm)
		: config.model || "Not configured"

	const assistantData = fullAssistant || assistant
	const enabledTools = config.enabled_mcp_servers || []
	const hasKnowledge = config.knowledge_base?.isEnabled && 
		(config.knowledge_base?.config?.sources?.length || 0) > 0
	const knowledgeCount = config.knowledge_base?.config?.sources?.length || 0
	const memoryEnabled = config.memory?.enabled || false

	return (
		<div className="flex flex-col">
			{/* Header */}
			
				<div className="flex items-center justify-between">
					
					{isSaving && (
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Loader2 className="h-4 w-4 animate-spin" />
							<span>Saving...</span>
						</div>
					)}
				</div>
			

			{saveError && (
				<Alert variant="destructive" className="m-4">
					<AlertDescription>{saveError}</AlertDescription>
				</Alert>
			)}

			{/* Configuration Sections */}
			<div className="p-4 space-y-3">
				<Accordion type="multiple" defaultValue={["prompt"]} className="space-y-3">
					{/* Previous Agent Context - Only show if context exists */}
					{currentContext && (
						<AccordionItem value="context" className="border border-indigo-200/30 dark:border-indigo-800/30 rounded-lg px-4 bg-gradient-to-br from-indigo-50/30 to-blue-50/30 dark:from-indigo-950/20 dark:to-blue-950/20">
							<AccordionTrigger className="hover:no-underline py-2.5">
								<div className="flex items-center justify-between w-full pr-2">
									<div className="flex items-center gap-2">
										<ArrowRight className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
										<span className="font-medium text-sm">Previous Agent Context</span>
									</div>
									<Badge variant="secondary" className="text-xs font-normal bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-800/50">
										Available
									</Badge>
								</div>
							</AccordionTrigger>
							<AccordionContent>
								<div className="pt-2 pb-1">
									<ContextViewer context={currentContext} />
								</div>
							</AccordionContent>
						</AccordionItem>
					)}
					{/* Prompt Section - Open by default */}
					<AccordionItem value="prompt" className="border border-violet-200/30 dark:border-violet-800/30 rounded-lg px-4 bg-gradient-to-br from-violet-50/30 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-950/20">
						<AccordionTrigger className="hover:no-underline py-3">
							<div className="flex items-center gap-2">
								<FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
								<span className="font-medium">System Prompt</span>
							</div>
						</AccordionTrigger>
						<AccordionContent>
							<div 
								className="pt-2 pb-1"
								onFocusCapture={handlePromptFocus}
								onBlurCapture={() => {
									// Small delay to let PromptsConfig's onBlur fire first
									setTimeout(() => {
										isPromptEditingRef.current = false
									}, 100)
								}}
							>
								<PromptsConfig
									config={config}
									onChange={handlePromptChange}
								/>
							</div>
						</AccordionContent>
					</AccordionItem>

					{/* Model Section - Compact */}
					<AccordionItem value="model" className="border border-blue-200/30 dark:border-blue-800/30 rounded-lg px-4 bg-gradient-to-br from-blue-50/30 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/20">
						<AccordionTrigger className="hover:no-underline py-2.5">
							<div className="flex items-center justify-between w-full pr-2">
								<div className="flex items-center gap-2">
									<Cpu className="h-4 w-4 text-blue-600 dark:text-blue-400" />
									<span className="font-medium text-sm">Model</span>
								</div>
								<Badge variant="secondary" className="text-xs font-normal bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/50">
									{modelLabel}
								</Badge>
							</div>
						</AccordionTrigger>
						<AccordionContent>
							<div className="pt-2 pb-1">
								<ModelConfig
									config={config}
									onConfigurableChange={handleConfigurableChange}
								/>
							</div>
						</AccordionContent>
					</AccordionItem>

					{/* Tools Section */}
					<AccordionItem value="tools" className="border border-orange-200/30 dark:border-orange-800/30 rounded-lg px-4 bg-gradient-to-br from-orange-50/30 to-amber-50/30 dark:from-orange-950/20 dark:to-amber-950/20">
						<AccordionTrigger className="hover:no-underline py-2.5">
							<div className="flex items-center justify-between w-full pr-2">
								<div className="flex items-center gap-2">
									<Wrench className="h-4 w-4 text-orange-600 dark:text-orange-400" />
									<span className="font-medium text-sm">Tools</span>
								</div>
								{enabledTools.length > 0 ? (
									<div className="flex items-center gap-1.5">
										{enabledTools.slice(0, 3).map((qualifiedName) => {
											const logoUrl = toolLogos[qualifiedName]
											return logoUrl ? (
												<div
													key={qualifiedName}
													className="w-5 h-5 rounded border border-orange-200/50 dark:border-orange-800/50 bg-background overflow-hidden flex items-center justify-center"
												>
													<Image
														src={logoUrl}
														alt={qualifiedName}
														width={16}
														height={16}
														className="object-contain"
													/>
												</div>
											) : null
										})}
										{enabledTools.length > 3 && (
											<Badge variant="secondary" className="text-xs h-5 px-1.5 bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200/50 dark:border-orange-800/50">
												+{enabledTools.length - 3}
											</Badge>
										)}
									</div>
								) : (
									<span className="text-xs text-muted-foreground">None</span>
								)}
							</div>
						</AccordionTrigger>
						<AccordionContent>
							<div className="pt-2 pb-1">
								<ToolSelector
									enabledMCPServers={enabledTools}
									onMCPServersChange={(servers) =>
										handleConfigurableChange("enabled_mcp_servers", servers)
									}
								/>
							</div>
						</AccordionContent>
					</AccordionItem>

					{/* Knowledge Section */}
					<AccordionItem value="knowledge" className="border border-emerald-200/30 dark:border-emerald-800/30 rounded-lg px-4 bg-gradient-to-br from-emerald-50/30 to-green-50/30 dark:from-emerald-950/20 dark:to-green-950/20">
						<AccordionTrigger className="hover:no-underline py-2.5">
							<div className="flex items-center justify-between w-full pr-2">
								<div className="flex items-center gap-2">
									<Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
									<span className="font-medium text-sm">Knowledge</span>
								</div>
								{hasKnowledge ? (
									<Badge variant="secondary" className="text-xs font-normal bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/50">
										{knowledgeCount} {knowledgeCount === 1 ? "source" : "sources"}
									</Badge>
								) : (
									<span className="text-xs text-muted-foreground">None</span>
								)}
							</div>
						</AccordionTrigger>
						<AccordionContent>
							<div className="pt-2 pb-1">
								<KnowledgeConfig
									config={config}
									onChange={handleConfigurableChange}
									assistant_id={assistant.assistant_id}
								/>
							</div>
						</AccordionContent>
					</AccordionItem>

					{/* Memory Section */}
					<AccordionItem value="memory" className="border border-purple-200/30 dark:border-purple-800/30 rounded-lg px-4 bg-gradient-to-br from-purple-50/30 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/20">
						<AccordionTrigger className="hover:no-underline py-2.5">
							<div className="flex items-center justify-between w-full pr-2">
								<div className="flex items-center gap-2">
									<Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
									<span className="font-medium text-sm">Memory</span>
								</div>
								<Badge 
									variant="secondary" 
									className={`text-xs font-normal ${
										memoryEnabled
											? "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/50"
											: "bg-muted text-muted-foreground"
									}`}
								>
									{memoryEnabled ? "On" : "Off"}
								</Badge>
							</div>
						</AccordionTrigger>
						<AccordionContent>
							<div className="pt-2 pb-1">
								<MemoryConfig
									config={config}
									onChange={handleConfigurableChange}
									assistantId={assistant.assistant_id}
								/>
							</div>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</div>
		</div>
	)
}
