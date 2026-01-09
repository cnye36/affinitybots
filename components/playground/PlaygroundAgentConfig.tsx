"use client"

import { useState, useEffect, useRef } from "react"
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
	FileText,
	Wrench,
	Database,
	Brain,
	Cpu,
	Loader2,
	ArrowRight,
	Globe,
	ChevronDown,
	ChevronRight,
} from "lucide-react"
import { ModelConfig } from "@/components/configuration/ModelConfig"
import { PromptsConfig } from "@/components/configuration/PromptsConfig"
import { ToolSelector } from "@/components/configuration/ToolSelector"
import { ToolManagement } from "@/components/playground/ToolManagement"
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
	const [configuredServers, setConfiguredServers] = useState<string[]>([])
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const lastSavedConfigRef = useRef<string>("")
	const isPromptEditingRef = useRef(false)

	// Track the current assistant ID to detect changes
	const currentAssistantIdRef = useRef<string>("")

	// Load full assistant data when available
	// Reset config when assistant ID changes to ensure proper isolation per agent
	useEffect(() => {
		const assistantId = fullAssistant?.assistant_id || assistant.assistant_id
		
		// If assistant ID changed, reset everything to ensure clean state
		if (currentAssistantIdRef.current && currentAssistantIdRef.current !== assistantId) {
			console.log(`Assistant changed from ${currentAssistantIdRef.current} to ${assistantId}, resetting config`)
			setConfig(null)
			setToolLogos({})
			lastSavedConfigRef.current = ""
		}
		
		currentAssistantIdRef.current = assistantId
		
		// Load config for the current assistant
		if (fullAssistant) {
			const assistantConfig = fullAssistant.config?.configurable as AssistantConfiguration
			const configToSet = assistantConfig || assistant.config?.configurable as AssistantConfiguration
			if (configToSet) {
				setConfig(configToSet)
				// Reset last saved config for this assistant
				lastSavedConfigRef.current = JSON.stringify(configToSet)
			}
		} else if (assistant.config?.configurable) {
			const configToSet = assistant.config.configurable as AssistantConfiguration
			setConfig(configToSet)
			lastSavedConfigRef.current = JSON.stringify(configToSet)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fullAssistant?.assistant_id, assistant.assistant_id]) // Only depend on IDs, not full objects

	// Load configured servers
	useEffect(() => {
		const fetchConfiguredServers = async () => {
			try {
				const [userRes, userAddedRes] = await Promise.all([
					fetch('/api/user-mcp-servers').then(r => r.json()),
					fetch('/api/user-added-servers').then(r => r.json())
				])

				const userServers = userRes.servers || []
				const userAddedServers = userAddedRes.servers || []
				
				// Get all configured server slugs (enabled ones)
				// This matches the logic in ToolSelector's isConfigured function
				const configured = [
					...userServers.filter((s: any) => s.is_enabled).map((s: any) => s.server_slug),
					...userAddedServers.filter((s: any) => s.is_enabled).map((s: any) => s.server_slug),
				]
				
				// Remove duplicates
				const uniqueConfigured = [...new Set(configured)]
				
				console.log('Configured servers:', uniqueConfigured)
				setConfiguredServers(uniqueConfigured)
			} catch (err) {
				console.error('Failed to fetch configured servers:', err)
			}
		}
		
		fetchConfiguredServers()
	}, [])

	// Load tool logos
	useEffect(() => {
		if (!config?.enabled_mcp_servers) return
		
		const logos: Record<string, string> = {}
		config.enabled_mcp_servers.forEach((serverName) => {
			const server = OFFICIAL_MCP_SERVERS.find(
				(s) => s.serverName === serverName || serverName.includes(s.serverName)
			)
			if (server?.logoUrl) {
				logos[serverName] = server.logoUrl
			}
		})
		setToolLogos(logos)
	}, [config?.enabled_mcp_servers])

	// Auto-save function
	const autoSave = async (configToSave: AssistantConfiguration, skipPrompt = false) => {
		if (!fullAssistant || !configToSave) return

		// Skip if prompt is being edited
		if (isPromptEditingRef.current && !skipPrompt) return

		// Remove selected_tools from config before saving to persistent storage
		// selected_tools is only for playground/workflow runtime context, not agent config
		const { selected_tools, ...configToPersist } = configToSave
		
		const configString = JSON.stringify(configToPersist)
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
						configurable: configToPersist,
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [config, fullAssistant?.assistant_id, assistant.assistant_id])
	// Note: onConfigChange is intentionally excluded to prevent infinite loops
	// It's a callback that may be recreated on every render

	// Initialize last saved config when config is first loaded or assistant changes
	useEffect(() => {
		if (config) {
			const configString = JSON.stringify(config)
			// Only update if it's different (to avoid overwriting during saves)
			if (lastSavedConfigRef.current !== configString) {
				lastSavedConfigRef.current = configString
			}
		}
	}, [config, assistant.assistant_id])

	const handleConfigurableChange = (
		field: keyof AssistantConfiguration,
		value: unknown
	) => {
		if (!config) return
		
		// For enabled_mcp_servers, update immediately and save synchronously
		// This ensures the state is consistent across all components
		if (field === "enabled_mcp_servers") {
			const newServers = value as string[]
			// Create new config object to ensure React sees it as a change
			const newConfig: AssistantConfiguration = {
				...config,
				enabled_mcp_servers: newServers,
			}
			// Update state immediately - this will cause re-render with new enabledTools
			setConfig(newConfig)
			// Update lastSavedConfigRef to prevent duplicate saves
			lastSavedConfigRef.current = JSON.stringify(newConfig)
			// Save immediately to backend to keep everything in sync
			autoSave(newConfig, true)
			return
		}
		
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
	// Use the current config state for enabled tools - this ensures immediate updates
	// Only use what's actually in the config for THIS agent
	const enabledTools = Array.isArray(config?.enabled_mcp_servers) 
		? (config.enabled_mcp_servers as string[])
		: []
	const hasKnowledge = config.knowledge_base?.isEnabled && 
		(config.knowledge_base?.config?.sources?.length || 0) > 0
	const knowledgeCount = config.knowledge_base?.config?.sources?.length || 0
	const memoryEnabled = config.memory?.enabled || false

	return (
		<div className="flex flex-col w-full overflow-hidden">
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
			<div className="p-4 space-y-3 w-full overflow-hidden">
				<Accordion type="multiple" defaultValue={["prompt"]} className="space-y-3 w-full">
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
							<AccordionContent className="overflow-hidden">
								<div className="pt-2 pb-1 w-full overflow-hidden">
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
						<AccordionContent className="overflow-hidden">
							<div 
								className="pt-2 pb-1 w-full overflow-hidden"
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
								<Badge variant="secondary" className="text-xs font-normal bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/50 truncate max-w-[200px]">
									{modelLabel}
								</Badge>
							</div>
						</AccordionTrigger>
						<AccordionContent className="overflow-hidden">
							<div className="pt-2 pb-1 w-full overflow-hidden">
								<ModelConfig
									config={config}
									onConfigurableChange={handleConfigurableChange}
								/>
							</div>
						</AccordionContent>
					</AccordionItem>
				</Accordion>

				{/* Web Search Toggle - Simple inline control */}
				<div className="border border-teal-200/30 dark:border-teal-800/30 rounded-lg px-4 py-3 bg-gradient-to-br from-teal-50/30 to-cyan-50/30 dark:from-teal-950/20 dark:to-cyan-950/20">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Globe className="h-4 w-4 text-teal-600 dark:text-teal-400" />
							<div>
								<Label htmlFor="web-search-toggle" className="text-sm font-medium cursor-pointer">
									Web Search
								</Label>
								<p className="text-xs text-muted-foreground">
									Search the web for current information
								</p>
							</div>
						</div>
						<Switch
							id="web-search-toggle"
							checked={config.web_search_enabled || false}
							onCheckedChange={(checked) =>
								handleConfigurableChange("web_search_enabled", checked)
							}
						/>
					</div>
				</div>

				<Accordion type="multiple" className="space-y-3 w-full">
					{/* Tools Section */}
					<AccordionItem value="tools" className="border border-orange-200/30 dark:border-orange-800/30 rounded-lg px-4 bg-gradient-to-br from-orange-50/30 to-amber-50/30 dark:from-orange-950/20 dark:to-amber-950/20">
						<AccordionTrigger className="hover:no-underline py-2.5">
								<div className="flex items-center justify-between w-full pr-2">
								<div className="flex items-center gap-2">
									<Wrench className="h-4 w-4 text-orange-600 dark:text-orange-400" />
									<span className="font-medium text-sm">Integrations</span>
								</div>
								{(() => {
									// Only show icons for integrations that are:
									// 1. Enabled for THIS specific agent (in enabledTools)
									// 2. Configured and ready to use (in configuredServers)
									const enabledAndConfigured = enabledTools.filter(
										serverName => configuredServers.includes(serverName)
									)
									
									if (enabledAndConfigured.length === 0) {
										return <span className="text-xs text-muted-foreground">None</span>
									}
									
									return (
										<div className="flex items-center gap-1.5">
											{enabledAndConfigured.slice(0, 3).map((serverName) => {
												const logoUrl = toolLogos[serverName]
												return logoUrl ? (
													<div
														key={serverName}
														className="w-5 h-5 rounded border border-orange-200/50 dark:border-orange-800/50 bg-background overflow-hidden flex items-center justify-center"
													>
														<Image
															src={logoUrl}
															alt={serverName}
															width={16}
															height={16}
															className="object-contain"
														/>
													</div>
												) : null
											})}
											{enabledAndConfigured.length > 3 && (
												<Badge variant="secondary" className="text-xs h-5 px-1.5 bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200/50 dark:border-orange-800/50">
													+{enabledAndConfigured.length - 3}
												</Badge>
											)}
										</div>
									)
								})()}
							</div>
						</AccordionTrigger>
						<AccordionContent className="overflow-hidden">
							<div className="pt-2 pb-1 w-full overflow-hidden space-y-3">
								

								{/* Active Integrations - Collapsible */}
								{enabledTools.length > 0 && (
									<Collapsible defaultOpen={true}>
										<CollapsibleTrigger className="flex items-center gap-2 w-full py-2 px-3 rounded-md hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-colors group">
											<ChevronRight className="h-4 w-4 text-orange-600 dark:text-orange-400 transition-transform group-data-[state=open]:rotate-90" />
											<span className="text-sm font-medium">Active Tools</span>
											<Badge variant="secondary" className="ml-auto text-[10px] h-5 px-1.5">
												{config.selected_tools?.length || 0} selected
											</Badge>
										</CollapsibleTrigger>
										<CollapsibleContent className="pt-2">
											<div className="pl-6">
												<ToolManagement
													agentId={assistant.assistant_id}
													selectedTools={config.selected_tools || []}
													onSelectedToolsChange={(tools) =>
														handleConfigurableChange("selected_tools", tools)
													}
													enabledServers={enabledTools}
												/>
											</div>
										</CollapsibleContent>
									</Collapsible>
								)}
								{/* Available Integrations - Collapsible */}
								<Collapsible defaultOpen={false}>
									<CollapsibleTrigger className="flex items-center gap-2 w-full py-2 px-3 rounded-md hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-colors group">
										<ChevronRight className="h-4 w-4 text-orange-600 dark:text-orange-400 transition-transform group-data-[state=open]:rotate-90" />
										<span className="text-sm font-medium">Available Integrations</span>
										<Badge variant="secondary" className="ml-auto text-[10px] h-5 px-1.5">
											{configuredServers.length}
										</Badge>
									</CollapsibleTrigger>
									<CollapsibleContent className="pt-2">
										<div className="pl-6">
											<ToolSelector
												enabledMCPServers={enabledTools}
												onMCPServersChange={(servers) =>
													handleConfigurableChange("enabled_mcp_servers", servers)
												}
												showUnconfigured={false}
												hideHeaders={true}
											/>
										</div>
									</CollapsibleContent>
								</Collapsible>
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
						<AccordionContent className="overflow-hidden">
							<div className="pt-2 pb-1 w-full overflow-hidden">
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
						<AccordionContent className="overflow-hidden">
							<div className="pt-2 pb-1 w-full overflow-hidden">
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
