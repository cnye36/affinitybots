"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/supabase/client"
import { OFFICIAL_MCP_SERVERS } from "@/lib/mcp/officialMcpServers"
import type { MCPTool, MCPResource, MCPPrompt } from "@/lib/mcp/mcpDiscovery"
import { getStaticCapabilities } from "@/lib/mcp/staticCapabilities"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, ExternalLink, Plug, CheckCircle2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import Image from "next/image"
import { ApiKeyModal } from "@/components/tools/ApiKeyModal"

interface ServerCapabilities {
	tools: MCPTool[]
	resources: MCPResource[]
	prompts: MCPPrompt[]
	discoveredAt?: string
}

export default function ServerDetailPage() {
	const params = useParams()
	const router = useRouter()
	const searchParams = useSearchParams()
	const serverSlug = params.serverSlug as string

	const [loading, setLoading] = useState(true)
	const [discovering, setDiscovering] = useState(false)
	const [capabilities, setCapabilities] = useState<ServerCapabilities | null>(null)
	const [isConnected, setIsConnected] = useState(false)
	const [serverConfig, setServerConfig] = useState<any>(null)
	const [imageError, setImageError] = useState(false)
	const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false)
	const [disconnecting, setDisconnecting] = useState(false)
	const [showingExamples, setShowingExamples] = useState(false)
	const { theme, resolvedTheme } = useTheme()

	// Get the page number from search params or referrer
	const getBackUrl = useCallback(() => {
		const page = searchParams.get("page")
		if (page) {
			return `/tools?page=${page}`
		}
		// Try to get from referrer if available
		if (typeof window !== "undefined" && document.referrer) {
			try {
				const referrerUrl = new URL(document.referrer)
				if (referrerUrl.pathname === "/tools") {
					const referrerPage = referrerUrl.searchParams.get("page")
					if (referrerPage) {
						return `/tools?page=${referrerPage}`
					}
				}
			} catch (e) {
				// Ignore errors parsing referrer
			}
		}
		return "/tools"
	}, [searchParams])

	// Find official server definition
	const officialServer = OFFICIAL_MCP_SERVERS.find(
		(s) => s.serverName === serverSlug
	)

	// Determine which logo URL to use based on theme
	const getLogoUrl = () => {
		if (!officialServer) return null
		const currentTheme = resolvedTheme || theme || "light"
		if (currentTheme === "dark" && officialServer.logoUrlDark) {
			return officialServer.logoUrlDark
		}
		if (currentTheme === "light" && officialServer.logoUrlLight) {
			return officialServer.logoUrlLight
		}
		// Fallback to logoUrl for backward compatibility
		return officialServer.logoUrl
	}

	const effectiveLogoUrl = getLogoUrl()

	// Helper function to truncate text to first 50-60 words
	const truncateDescription = (text: string, maxWords: number = 55): string => {
		if (!text) return ""
		const words = text.trim().split(/\s+/)
		if (words.length <= maxWords) return text
		return words.slice(0, maxWords).join(" ") + "..."
	}

	useEffect(() => {
		loadServerData()
	}, [serverSlug])

	async function loadServerData() {
		setLoading(true)
		setShowingExamples(false)
		try {
			const supabase = createClient()

			// Check if user has this server connected
			const { data: session } = await supabase.auth.getSession()
			if (!session?.session?.user) {
				// Not logged in - show example capabilities
				const exampleCaps = getStaticCapabilities(serverSlug)
				if (exampleCaps) {
					setCapabilities({
						tools: exampleCaps.tools || [],
						resources: exampleCaps.resources || [],
						prompts: exampleCaps.prompts || [],
					})
					setShowingExamples(true)
				}
				setLoading(false)
				return
			}

			// User is logged in - check if they have this server connected
			const { data: userServer, error: serverError } = await supabase
				.from("user_mcp_servers")
				.select("*")
				.eq("server_slug", serverSlug)
				.maybeSingle()

			if (serverError) {
				console.error("Error checking server connection:", serverError)
			}

			if (userServer) {
				setIsConnected(true)
				setServerConfig(userServer)

				// Try to fetch live capabilities
				try {
					const response = await fetch(`/api/mcp/servers/${serverSlug}/discover`)
					if (response.ok) {
						const data = await response.json()
						if (data.tools && data.tools.length > 0) {
							// Found stored discovered capabilities - use them
							setCapabilities({
								tools: data.tools || [],
								resources: data.resources || [],
								prompts: data.prompts || [],
								discoveredAt: data.discovered_at,
							})
							setShowingExamples(false)
							setLoading(false)
							return
						}
					}
				} catch (fetchError) {
					console.warn("Failed to fetch live capabilities:", fetchError)
				}

				// No stored capabilities - trigger discovery since we're connected
				try {
					const discoverResponse = await fetch(`/api/mcp/servers/${serverSlug}/discover`, {
						method: "POST"
					})
					if (discoverResponse.ok) {
						const discoverData = await discoverResponse.json()
						if (discoverData.capabilities && discoverData.capabilities.tools && discoverData.capabilities.tools.length > 0) {
							// Successfully discovered - use discovered capabilities
							setCapabilities({
								tools: discoverData.capabilities.tools || [],
								resources: discoverData.capabilities.resources || [],
								prompts: discoverData.capabilities.prompts || [],
								discoveredAt: new Date().toISOString(),
							})
							setShowingExamples(false)
							setLoading(false)
							return
						}
					}
				} catch (discoverError) {
					console.warn("Discovery request failed:", discoverError)
				}
			} else {
				// Not connected - show example capabilities
				const exampleCaps = getStaticCapabilities(serverSlug)
				if (exampleCaps) {
					setCapabilities({
						tools: exampleCaps.tools || [],
						resources: exampleCaps.resources || [],
						prompts: exampleCaps.prompts || [],
					})
					setShowingExamples(true)
				}
			}
		} catch (error) {
			console.error("Error loading server data:", error)
		} finally {
			setLoading(false)
		}
	}

	async function handleDiscoverCapabilities() {
		if (!isConnected) return

		setDiscovering(true)
		try {
			const response = await fetch(`/api/mcp/servers/${serverSlug}/discover`, {
				method: "POST",
			})

			if (response.ok) {
				const data = await response.json()
				if (data.capabilities) {
					setCapabilities({
						tools: data.capabilities.tools,
						resources: data.capabilities.resources,
						prompts: data.capabilities.prompts,
						discoveredAt: new Date().toISOString(),
					})
					setShowingExamples(false)
				}
			} else {
				console.error("Failed to discover capabilities")
			}
		} catch (error) {
			console.error("Error discovering capabilities:", error)
		} finally {
			setDiscovering(false)
		}
	}

	function handleConnect() {
		// Navigate to connection flow
		if (officialServer?.authType === "oauth") {
			// Google services use a special OAuth flow
			const googleServices = ["google-drive", "gmail", "google-calendar", "google-docs", "google-sheets"];
			const serviceMap: Record<string, string> = {
				"google-drive": "drive",
				"gmail": "gmail",
				"google-calendar": "calendar",
				"google-docs": "docs",
				"google-sheets": "sheets"
			};
			
			if (googleServices.includes(serverSlug)) {
				const service = serviceMap[serverSlug];
				window.location.href = `/api/google/oauth/connect?service=${service}`;
			} else if (serverSlug === "hubspot") {
				// HubSpot has its own OAuth flow
				window.location.href = `/api/hubspot/oauth/start`;
			} else {
				// Standard MCP OAuth flow for other servers
				window.location.href = `/api/mcp/auth/connect?server=${serverSlug}`;
			}
		} else if (officialServer?.authType === "api_key" || officialServer?.authType === "none") {
			// For API key servers or servers with no auth (config only), show the configuration modal
			setApiKeyModalOpen(true);
		}
	}

	function handleApiKeySuccess() {
		// Reload server data after successful API key configuration
		loadServerData()
	}

	async function handleDisconnect() {
		if (!officialServer) return

		setDisconnecting(true)
		try {
			const response = await fetch("/api/mcp/auth/disconnect", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ serverName: officialServer.serverName }),
			})

			const data = await response.json()
			if (!response.ok) {
				throw new Error(data.error || "Failed to disconnect")
			}

			// Immediately update state to show disconnected
			setIsConnected(false)
			setServerConfig(null)
			
			// Load example capabilities
			const exampleCaps = getStaticCapabilities(serverSlug)
			if (exampleCaps) {
				setCapabilities({
					tools: exampleCaps.tools || [],
					resources: exampleCaps.resources || [],
					prompts: exampleCaps.prompts || [],
				})
				setShowingExamples(true)
			}
			
			// Then reload from database to confirm
			await loadServerData()
		} catch (error) {
			console.error("Failed to disconnect:", error)
			alert(error instanceof Error ? error.message : "Failed to disconnect server")
		} finally {
			setDisconnecting(false)
		}
	}

	if (!officialServer) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="text-center">
					<h1 className="text-2xl font-bold mb-4">Server Not Found</h1>
					<p className="text-muted-foreground mb-6">
						The server &quot;{serverSlug}&quot; could not be found.
					</p>
					<Button onClick={() => router.push(getBackUrl())}>Back to Integrations</Button>
				</div>
			</div>
		)
	}

	if (loading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			</div>
		)
	}

	return (
		<div className="container mx-auto px-4 py-8">
			{/* Back Button */}
			<div className="mb-6">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => router.push(getBackUrl())}
					className="gap-2"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Integrations
				</Button>
			</div>

			{/* Header */}
			<div className="mb-8">
				<div className="flex items-start justify-between mb-4">
					<div className="flex flex-col gap-4">
						{/* Integration Icon - Above the name */}
						{effectiveLogoUrl && !imageError ? (
							<div className="flex-shrink-0">
								<Image
									src={effectiveLogoUrl}
									alt={officialServer.displayName}
									width={64}
									height={64}
									className="w-16 h-16 rounded-lg object-contain"
									onError={() => setImageError(true)}
								/>
							</div>
						) : null}
						<div>
							<h1 className="text-3xl font-bold mb-2">{officialServer.displayName}</h1>
							<p className="text-muted-foreground max-w-2xl">
								{officialServer.description}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						{isConnected ? (
							<>
								<Badge variant="default" className="gap-1">
									<CheckCircle2 className="h-3 w-3" />
									Connected
								</Badge>
								<Button
									variant="outline"
									size="sm"
									onClick={handleDiscoverCapabilities}
									disabled={discovering}
								>
									{discovering ? (
										<>
											<Loader2 className="h-4 w-4 mr-2 animate-spin" />
											Discovering...
										</>
									) : (
										<>
											<RefreshCw className="h-4 w-4 mr-2" />
											Refresh Capabilities
										</>
									)}
								</Button>
								<Button
									variant="destructive"
									size="sm"
									onClick={handleDisconnect}
									disabled={disconnecting}
								>
									{disconnecting ? (
										<>
											<Loader2 className="h-4 w-4 mr-2 animate-spin" />
											Disconnecting...
										</>
									) : (
										"Disconnect"
									)}
								</Button>
							</>
						) : (
							<Button onClick={handleConnect}>
								<Plug className="h-4 w-4 mr-2" />
								Connect Server
							</Button>
						)}
					</div>
				</div>

				<div className="flex items-center gap-4 text-sm text-muted-foreground">
					<Badge variant="outline">{officialServer.authType.toUpperCase()}</Badge>
					{officialServer.docsUrl && (
						<Link
							href={officialServer.docsUrl}
							target="_blank"
							className="flex items-center gap-1 hover:text-primary"
						>
							Documentation
							<ExternalLink className="h-3 w-3" />
						</Link>
					)}
					{capabilities?.discoveredAt && (
						<span>
							Last discovered:{" "}
							{new Date(capabilities.discoveredAt).toLocaleDateString()}
						</span>
					)}
				</div>
			</div>

			{/* Example Preview Banner */}
			{showingExamples && (
				<div className="mb-6 p-4 border-2 border-dashed border-muted-foreground/30 rounded-lg bg-muted/30">
					<div className="flex items-start gap-3">
						<div className="flex-1">
							<h3 className="font-semibold mb-1">Example Preview</h3>
							<p className="text-sm text-muted-foreground">
								The tools, resources, and prompts shown below are examples of what this integration typically provides.
								To see the actual capabilities available to you, please connect this integration.
							</p>
						</div>
						{!isConnected && (
							<Button onClick={handleConnect} size="sm">
								<Plug className="h-4 w-4 mr-2" />
								Connect to View Actual Tools
							</Button>
						)}
					</div>
				</div>
			)}

			{/* Capabilities Tabs */}
			{capabilities ? (
				<Tabs defaultValue="tools" className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="tools">
							{showingExamples ? "Example Tools" : "Tools"} ({capabilities.tools.length})
						</TabsTrigger>
						<TabsTrigger value="resources">
							{showingExamples ? "Example Resources" : "Resources"} ({capabilities.resources.length})
						</TabsTrigger>
						<TabsTrigger value="prompts">
							{showingExamples ? "Example Prompts" : "Prompts"} ({capabilities.prompts.length})
						</TabsTrigger>
					</TabsList>

					{/* Tools Tab */}
					<TabsContent value="tools" className="mt-6">
						{capabilities.tools.length === 0 ? (
							<div className="text-center py-12 text-muted-foreground">
								{showingExamples ? "No example tools available" : "No tools available"}
							</div>
						) : (
							<div className={showingExamples ? "opacity-75" : ""}>
								<Accordion type="single" collapsible className="w-full">
									{capabilities.tools.map((tool, index) => (
										<AccordionItem 
											key={index} 
											value={`tool-${index}`}
											className={showingExamples ? "border-dashed" : ""}
										>
											<AccordionTrigger className="hover:no-underline">
												<div className="flex items-start justify-between w-full pr-4">
													<div className="text-left flex items-start gap-2">
														{showingExamples && (
															<Badge variant="outline" className="text-xs mt-0.5">
																Example
															</Badge>
														)}
														<div>
															<div className="font-mono font-semibold">{tool.name}</div>
															{tool.description && (
																<div className="text-sm text-muted-foreground mt-1">
																	{truncateDescription(tool.description)}
																</div>
															)}
														</div>
													</div>
												</div>
											</AccordionTrigger>
											<AccordionContent>
												<div className="pl-4 space-y-4">
													{tool.description && (
														<div>
															<h4 className="font-semibold mb-2">Description</h4>
															<div className="text-sm text-muted-foreground whitespace-pre-wrap">
																{tool.description}
															</div>
														</div>
													)}
													<div>
														<h4 className="font-semibold mb-2">Parameters</h4>
														{tool.inputSchema &&
														typeof tool.inputSchema === "object" &&
														"properties" in tool.inputSchema &&
														tool.inputSchema.properties &&
														typeof tool.inputSchema.properties === "object" &&
														Object.keys(tool.inputSchema.properties).length > 0 ? (
															<div className="space-y-2">
																{Object.entries(tool.inputSchema.properties as Record<string, any>).map(
																	([key, value]: [string, any]) => (
																		<div
																			key={key}
																			className={`border rounded-lg p-3 ${showingExamples ? "bg-muted/30 border-dashed" : "bg-muted/50"}`}
																		>
																			<div className="flex items-center gap-2 mb-1">
																				<code className="text-sm font-mono">{key}</code>
																				<Badge variant="outline" className="text-xs">
																					{value.type}
																				</Badge>
																				{"required" in (tool.inputSchema || {}) &&
																				Array.isArray((tool.inputSchema as any).required) &&
																				(tool.inputSchema as any).required.includes(key) && (
																					<Badge variant="destructive" className="text-xs">
																						required
																					</Badge>
																				)}
																			</div>
																			{value.description && (
																				<p className="text-sm text-muted-foreground">
																					{value.description}
																				</p>
																			)}
																			{value.enum && (
																				<div className="mt-2">
																					<span className="text-xs text-muted-foreground">
																						Options:{" "}
																					</span>
																					{value.enum.map((opt: string, i: number) => (
																						<Badge
																							key={i}
																							variant="secondary"
																							className="text-xs mr-1"
																						>
																							{opt}
																						</Badge>
																					))}
																				</div>
																			)}
																		</div>
																	)
																)}
															</div>
														) : (
															<p className="text-sm text-muted-foreground">
																No parameters required
															</p>
														)}
													</div>
												</div>
											</AccordionContent>
										</AccordionItem>
									))}
								</Accordion>
							</div>
						)}
					</TabsContent>

					{/* Resources Tab */}
					<TabsContent value="resources" className="mt-6">
						{capabilities.resources.length === 0 ? (
							<div className="text-center py-12 text-muted-foreground">
								{showingExamples ? "No example resources available" : "No resources available"}
							</div>
						) : (
							<div className={`space-y-4 ${showingExamples ? "opacity-75" : ""}`}>
								{capabilities.resources.map((resource, index) => (
									<div 
										key={index} 
										className={`border rounded-lg p-4 ${showingExamples ? "border-dashed bg-muted/30" : ""}`}
									>
										<div className="flex items-start justify-between mb-2">
											<div className="flex items-start gap-2">
												{showingExamples && (
													<Badge variant="outline" className="text-xs mt-0.5">
														Example
													</Badge>
												)}
												<div>
													{resource.name && (
														<h3 className="font-semibold">{resource.name}</h3>
													)}
													<code className="text-sm text-muted-foreground">
														{resource.uri}
													</code>
												</div>
											</div>
											{resource.mimeType && (
												<Badge variant="outline">{resource.mimeType}</Badge>
											)}
										</div>
										{resource.description && (
											<p className="text-sm text-muted-foreground">
												{resource.description}
											</p>
										)}
									</div>
								))}
							</div>
						)}
					</TabsContent>

					{/* Prompts Tab */}
					<TabsContent value="prompts" className="mt-6">
						{capabilities.prompts.length === 0 ? (
							<div className="text-center py-12 text-muted-foreground">
								{showingExamples ? "No example prompts available" : "No prompts available"}
							</div>
						) : (
							<div className={`space-y-4 ${showingExamples ? "opacity-75" : ""}`}>
								{capabilities.prompts.map((prompt, index) => (
									<div 
										key={index} 
										className={`border rounded-lg p-4 ${showingExamples ? "border-dashed bg-muted/30" : ""}`}
									>
										<div className="flex items-start gap-2 mb-2">
											{showingExamples && (
												<Badge variant="outline" className="text-xs mt-0.5">
													Example
												</Badge>
											)}
											<h3 className="font-semibold">{prompt.name}</h3>
										</div>
										{prompt.description && (
											<p className="text-sm text-muted-foreground mb-4">
												{prompt.description}
											</p>
										)}
										{prompt.arguments && prompt.arguments.length > 0 && (
											<div>
												<h4 className="text-sm font-semibold mb-2">Arguments</h4>
												<div className="space-y-2">
													{prompt.arguments.map((arg, argIndex) => (
														<div
															key={argIndex}
															className={`border rounded-lg p-3 ${showingExamples ? "bg-muted/30 border-dashed" : "bg-muted/50"}`}
														>
															<div className="flex items-center gap-2 mb-1">
																<code className="text-sm font-mono">{arg.name}</code>
																{arg.required && (
																	<Badge variant="destructive" className="text-xs">
																		required
																	</Badge>
																)}
															</div>
															{arg.description && (
																<p className="text-sm text-muted-foreground">
																	{arg.description}
																</p>
															)}
														</div>
													))}
												</div>
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</TabsContent>
				</Tabs>
			) : (
				<div className="text-center py-12">
					<p className="text-muted-foreground mb-4">
						{isConnected
							? "No capabilities have been discovered yet. Click 'Refresh Capabilities' to discover available tools, resources, and prompts."
							: "No example preview available. Connect this server to discover its capabilities."}
					</p>
					{!isConnected && (
						<Button onClick={handleConnect}>
							<Plug className="h-4 w-4 mr-2" />
							Connect Server
						</Button>
					)}
				</div>
			)}

			{officialServer && (
				<ApiKeyModal
					open={apiKeyModalOpen}
					onOpenChange={setApiKeyModalOpen}
					server={officialServer}
					onSuccess={handleApiKeySuccess}
				/>
			)}
		</div>
	)
}
