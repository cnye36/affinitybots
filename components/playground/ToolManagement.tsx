"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, ChevronRight, Loader2, AlertCircle, Wrench } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tool, ServerInfo } from "@/types/playground"
import { OFFICIAL_MCP_SERVERS } from "@/lib/mcp/officialMcpServers"
import Image from "next/image"
import { getMcpServerLogo } from "@/lib/utils/mcpServerLogo"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface ToolManagementProps {
	agentId: string
	selectedTools: string[]
	onSelectedToolsChange: (tools: string[]) => void
	enabledServers?: string[] // Track enabled servers to refetch when they change
}

export function ToolManagement({
	agentId,
	selectedTools = [],
	onSelectedToolsChange,
	enabledServers = [],
}: ToolManagementProps) {
	const [tools, setTools] = useState<Tool[]>([])
	const [servers, setServers] = useState<ServerInfo[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set())
	const prevEnabledServersRef = useRef<string>("")
	const prevAgentIdRef = useRef<string>("")

	// Fetch tools when agent or enabled servers change
	useEffect(() => {
		if (!agentId) return
		
		const enabledServersKey = [...enabledServers].sort().join(",")
		const agentChanged = prevAgentIdRef.current !== agentId
		
		// Reset ref if agent changed
		if (agentChanged) {
			prevEnabledServersRef.current = ""
			prevAgentIdRef.current = agentId
		}
		
		// Only refetch if the enabled servers actually changed or agent changed
		if (prevEnabledServersRef.current !== enabledServersKey) {
			prevEnabledServersRef.current = enabledServersKey
			fetchTools()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [agentId, enabledServers]) // Refetch when enabled servers change

	// Clean up selected tools when available tools change (e.g., when a server is disabled)
	useEffect(() => {
		if (tools.length === 0 || selectedTools.length === 0) return
		
		const availableToolNames = new Set(tools.map(t => t.name))
		const invalidSelectedTools = selectedTools.filter(toolName => !availableToolNames.has(toolName))
		
		if (invalidSelectedTools.length > 0) {
			// Remove tools that are no longer available
			const cleanedTools = selectedTools.filter(toolName => availableToolNames.has(toolName))
			onSelectedToolsChange(cleanedTools)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tools]) // Only depend on tools, not selectedTools to avoid loops

	const fetchTools = async () => {
		setLoading(true)
		setError(null)

		try {
			// Pass enabled servers as query param for immediate updates (before config is saved)
			const queryParams = new URLSearchParams()
			if (enabledServers.length > 0) {
				queryParams.set("enabledServers", JSON.stringify(enabledServers))
			}
			const url = `/api/playground/agents/${agentId}/tools${queryParams.toString() ? `?${queryParams.toString()}` : ""}`

			const response = await fetch(url)

			if (!response.ok) {
				throw new Error("Failed to fetch tools")
			}

			const data = await response.json()
			setTools(data.tools || [])
			setServers(data.servers || [])
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load tools")
		} finally {
			setLoading(false)
		}
	}

	const toggleServer = (serverName: string) => {
		setExpandedServers(prev => {
			const newSet = new Set(prev)
			if (newSet.has(serverName)) {
				newSet.delete(serverName)
			} else {
				newSet.add(serverName)
			}
			return newSet
		})
	}

	const handleToolToggle = (toolName: string) => {
		const isSelected = selectedTools.includes(toolName)
		const updatedTools = isSelected
			? selectedTools.filter(t => t !== toolName)
			: [...selectedTools, toolName]

		onSelectedToolsChange(updatedTools)
	}

	const handleServerToggle = (serverName: string, serverTools: Tool[]) => {
		const toolNames = serverTools.map(t => t.name)
		const allSelected = toolNames.every(name => selectedTools.includes(name))

		if (allSelected) {
			// Deselect all tools from this server
			const updatedTools = selectedTools.filter(t => !toolNames.includes(t))
			onSelectedToolsChange(updatedTools)
		} else {
			// Select all tools from this server
			const updatedTools = [...new Set([...selectedTools, ...toolNames])]
			onSelectedToolsChange(updatedTools)
		}
	}

	const { theme, resolvedTheme } = useTheme()
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	const getServerLogo = (serverName: string) => {
		if (!mounted) {
			const server = OFFICIAL_MCP_SERVERS.find(s => s.serverName === serverName)
			return server?.logoUrl || server?.logoUrlLight || server?.logoUrlDark
		}
		const server = OFFICIAL_MCP_SERVERS.find(s => s.serverName === serverName)
		if (!server) return undefined
		const currentTheme = (resolvedTheme || theme || "light") as "light" | "dark"
		return getMcpServerLogo(server, currentTheme)
	}

	const getToolsForServer = (serverName: string) => {
		return tools.filter(t => t.serverName === serverName)
	}

	const getSelectedCount = (serverName: string) => {
		const serverTools = getToolsForServer(serverName)
		return serverTools.filter(t => selectedTools.includes(t.name)).length
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-8">
				<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
				<span className="ml-2 text-sm text-muted-foreground">Loading tools...</span>
			</div>
		)
	}

	if (error) {
		return (
			<Alert variant="destructive">
				<AlertCircle className="h-4 w-4" />
				<AlertDescription>{error}</AlertDescription>
			</Alert>
		)
	}

	if (servers.length === 0) {
		return (
			<div className="text-center py-8 text-sm text-muted-foreground">
				<Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
				<p>No tools configured for this agent.</p>
				<p className="text-xs mt-1">Enable MCP servers in the Tools section above.</p>
			</div>
		)
	}

	return (
		<div className="space-y-2">
			<div className="text-xs text-muted-foreground mb-3">
				Select specific tools this agent can use from each integration
			</div>

			{servers.map(server => {
				const serverTools = getToolsForServer(server.name)
				const isExpanded = expandedServers.has(server.name)
				const selectedCount = getSelectedCount(server.name)
				const allSelected = serverTools.length > 0 && selectedCount === serverTools.length
				const someSelected = selectedCount > 0 && selectedCount < serverTools.length
				const logoUrl = getServerLogo(server.name)

				return (
					<div
						key={server.name}
						className="border rounded-lg overflow-hidden bg-gradient-to-br from-white/50 to-gray-50/50 dark:from-gray-900/50 dark:to-gray-800/50 backdrop-blur-sm transition-all duration-200 hover:shadow-md"
					>
						{/* Server Header */}
						<div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => toggleServer(server.name)}>
							<div className="flex items-center gap-3 flex-1 min-w-0">
								{/* Expand Icon */}
								<button
									className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
									onClick={(e) => {
										e.stopPropagation()
										toggleServer(server.name)
									}}
								>
									{isExpanded ? (
										<ChevronDown className="h-4 w-4" />
									) : (
										<ChevronRight className="h-4 w-4" />
									)}
								</button>

								{/* Server Logo */}
								{logoUrl ? (
									<div className="flex-shrink-0 w-8 h-8 rounded border bg-white dark:bg-gray-800 p-1 flex items-center justify-center">
										<Image
											src={logoUrl}
											alt={server.displayName}
											width={24}
											height={24}
											className="object-contain"
										/>
									</div>
								) : (
									<div className="flex-shrink-0 w-8 h-8 rounded bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-sm font-bold">
										{server.displayName[0].toUpperCase()}
									</div>
								)}

								{/* Server Info */}
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<h4 className="font-medium text-sm truncate">{server.displayName}</h4>
										<Badge variant="secondary" className="text-[10px] h-5 px-1.5">
											{serverTools.length} {serverTools.length === 1 ? "tool" : "tools"}
										</Badge>
									</div>
									<div className="text-xs text-muted-foreground">
										{selectedCount > 0 ? (
											<span className="text-orange-600 dark:text-orange-400 font-medium">
												{selectedCount} selected
											</span>
										) : (
											<span>None selected</span>
										)}
									</div>
								</div>

								{/* Server-level Toggle */}
								<div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
									<Switch
										checked={allSelected}
										onCheckedChange={() => handleServerToggle(server.name, serverTools)}
										className={cn(
											someSelected && !allSelected && "data-[state=unchecked]:bg-orange-500/50"
										)}
									/>
								</div>
							</div>
						</div>

						{/* Tool List */}
						{isExpanded && (
							<div className="border-t bg-white/30 dark:bg-gray-900/30">
								<div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
									{serverTools.length === 0 ? (
										<div className="text-xs text-muted-foreground text-center py-4">
											No tools available
										</div>
									) : (
										serverTools.map(tool => {
											const isSelected = selectedTools.includes(tool.name)

											return (
												<div
													key={tool.name}
													className={cn(
														"flex items-start gap-3 p-2.5 rounded-md transition-all duration-150",
														"hover:bg-white/50 dark:hover:bg-gray-800/50",
														isSelected && "bg-orange-50/50 dark:bg-orange-900/10 border border-orange-200/50 dark:border-orange-800/50"
													)}
												>
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-2">
															<h5 className="font-medium text-xs truncate">{tool.displayName}</h5>
														</div>
														<p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
															{tool.description}
														</p>
													</div>
													<Switch
														checked={isSelected}
														onCheckedChange={() => handleToolToggle(tool.name)}
														className="flex-shrink-0 mt-0.5"
													/>
												</div>
											)
										})
									)}
								</div>
							</div>
						)}
					</div>
				)
			})}
		</div>
	)
}
