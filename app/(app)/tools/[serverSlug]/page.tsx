"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/supabase/client"
import { OFFICIAL_MCP_SERVERS } from "@/lib/mcp/officialMcpServers"
import { getStaticCapabilities, hasStaticCapabilities } from "@/lib/mcp/staticCapabilities"
import type { MCPTool, MCPResource, MCPPrompt } from "@/lib/mcp/mcpDiscovery"
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

interface ServerCapabilities {
	tools: MCPTool[]
	resources: MCPResource[]
	prompts: MCPPrompt[]
	discoveredAt?: string
}

export default function ServerDetailPage() {
	const params = useParams()
	const router = useRouter()
	const serverSlug = params.serverSlug as string

	const [loading, setLoading] = useState(true)
	const [discovering, setDiscovering] = useState(false)
	const [capabilities, setCapabilities] = useState<ServerCapabilities | null>(null)
	const [isConnected, setIsConnected] = useState(false)
	const [serverConfig, setServerConfig] = useState<any>(null)

	// Find official server definition
	const officialServer = OFFICIAL_MCP_SERVERS.find(
		(s) => s.qualifiedName === serverSlug
	)

	useEffect(() => {
		loadServerData()
	}, [serverSlug])

	async function loadServerData() {
		setLoading(true)
		try {
			const supabase = createClient()

			// Check if user has this server connected
			const { data: session } = await supabase.auth.getSession()
			if (!session?.session?.user) {
				// Not logged in - show static capabilities if available
				if (officialServer && hasStaticCapabilities(serverSlug)) {
					const staticCaps = getStaticCapabilities(serverSlug)
					if (staticCaps) {
						setCapabilities({
							tools: staticCaps.tools,
							resources: staticCaps.resources || [],
							prompts: staticCaps.prompts || [],
						})
					}
				}
				setLoading(false)
				return
			}

			// User is logged in - check if they have this server connected
			const { data: userServer, error: serverError } = await supabase
				.from("user_mcp_servers")
				.select("*")
				.eq("server_slug", serverSlug)
				.single()

			if (userServer) {
				setIsConnected(true)
				setServerConfig(userServer)

				// Try to fetch live capabilities
				const response = await fetch(`/api/mcp/servers/${serverSlug}/discover`)
				if (response.ok) {
					const data = await response.json()
					if (data.tools && data.tools.length > 0) {
						setCapabilities(data)
					} else {
						// No live capabilities yet - show static if available
						if (hasStaticCapabilities(serverSlug)) {
							const staticCaps = getStaticCapabilities(serverSlug)
							if (staticCaps) {
								setCapabilities({
									tools: staticCaps.tools,
									resources: staticCaps.resources || [],
									prompts: staticCaps.prompts || [],
								})
							}
						}
					}
				}
			} else {
				// Not connected - show static capabilities if available
				if (officialServer && hasStaticCapabilities(serverSlug)) {
					const staticCaps = getStaticCapabilities(serverSlug)
					if (staticCaps) {
						setCapabilities({
							tools: staticCaps.tools,
							resources: staticCaps.resources || [],
							prompts: staticCaps.prompts || [],
						})
					}
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
			window.location.href = `/api/mcp/auth/connect?server=${serverSlug}`
		} else {
			// For API key servers, navigate to tools page with connect modal
			router.push(`/tools?connect=${serverSlug}`)
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
					<Button onClick={() => router.push("/tools")}>Back to Tools</Button>
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
					onClick={() => router.push("/tools")}
					className="gap-2"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Tools
				</Button>
			</div>

			{/* Header */}
			<div className="mb-8">
				<div className="flex items-start justify-between mb-4">
					<div className="flex items-start gap-4">
						{officialServer.logoUrl && (
							<img
								src={officialServer.logoUrl}
								alt={officialServer.displayName}
								className="w-16 h-16 rounded-lg object-contain"
							/>
						)}
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

			{/* Capabilities Tabs */}
			{capabilities ? (
				<Tabs defaultValue="tools" className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="tools">
							Tools ({capabilities.tools.length})
						</TabsTrigger>
						<TabsTrigger value="resources">
							Resources ({capabilities.resources.length})
						</TabsTrigger>
						<TabsTrigger value="prompts">
							Prompts ({capabilities.prompts.length})
						</TabsTrigger>
					</TabsList>

					{/* Tools Tab */}
					<TabsContent value="tools" className="mt-6">
						{capabilities.tools.length === 0 ? (
							<div className="text-center py-12 text-muted-foreground">
								No tools available
							</div>
						) : (
							<Accordion type="single" collapsible className="w-full">
								{capabilities.tools.map((tool, index) => (
									<AccordionItem key={index} value={`tool-${index}`}>
										<AccordionTrigger className="hover:no-underline">
											<div className="flex items-start justify-between w-full pr-4">
												<div className="text-left">
													<div className="font-mono font-semibold">{tool.name}</div>
													{tool.description && (
														<div className="text-sm text-muted-foreground mt-1">
															{tool.description}
														</div>
													)}
												</div>
											</div>
										</AccordionTrigger>
										<AccordionContent>
											<div className="pl-4 space-y-4">
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
																		className="border rounded-lg p-3 bg-muted/50"
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
						)}
					</TabsContent>

					{/* Resources Tab */}
					<TabsContent value="resources" className="mt-6">
						{capabilities.resources.length === 0 ? (
							<div className="text-center py-12 text-muted-foreground">
								No resources available
							</div>
						) : (
							<div className="space-y-4">
								{capabilities.resources.map((resource, index) => (
									<div key={index} className="border rounded-lg p-4">
										<div className="flex items-start justify-between mb-2">
											<div>
												{resource.name && (
													<h3 className="font-semibold">{resource.name}</h3>
												)}
												<code className="text-sm text-muted-foreground">
													{resource.uri}
												</code>
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
								No prompts available
							</div>
						) : (
							<div className="space-y-4">
								{capabilities.prompts.map((prompt, index) => (
									<div key={index} className="border rounded-lg p-4">
										<h3 className="font-semibold mb-2">{prompt.name}</h3>
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
															className="border rounded-lg p-3 bg-muted/50"
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
							: "Connect this server to discover its capabilities."}
					</p>
					{!isConnected && (
						<Button onClick={handleConnect}>
							<Plug className="h-4 w-4 mr-2" />
							Connect Server
						</Button>
					)}
				</div>
			)}
		</div>
	)
}
