/**
 * MCP Server Discovery System
 *
 * This module handles discovering and cataloging the capabilities of MCP servers:
 * - Tools: Functions that can be executed
 * - Resources: Data that can be read
 * - Prompts: Pre-built prompt templates
 */

import { MCPOAuthClient } from "@/lib/oauth/oauthClient"
import { GitHubOAuthClient } from "@/lib/oauth/githubOauthClient"
import { sessionStore } from "@/lib/oauth/sessionStore"

export interface MCPTool {
	name: string
	description?: string
	inputSchema?: Record<string, unknown>
	// Additional metadata from the server
	metadata?: Record<string, unknown>
}

export interface MCPResource {
	uri: string
	name?: string
	description?: string
	mimeType?: string
	// Additional metadata
	metadata?: Record<string, unknown>
}

export interface MCPPrompt {
	name: string
	description?: string
	arguments?: Array<{
		name: string
		description?: string
		required?: boolean
	}>
	// Additional metadata
	metadata?: Record<string, unknown>
}

export interface MCPServerCapabilities {
	serverName: string
	tools: MCPTool[]
	resources: MCPResource[]
	prompts: MCPPrompt[]
	discoveredAt: string
	serverInfo?: {
		name?: string
		version?: string
		protocolVersion?: string
	}
}

/**
 * Discovers all capabilities from an MCP server
 */
export async function discoverServerCapabilities(
	serverUrl: string,
	serverName: string,
	options: {
		sessionId?: string
		apiKey?: string
		bearerToken?: string
		apiKeyHeaderName?: string
	} = {}
): Promise<MCPServerCapabilities> {
	console.log(`[${serverName}] 🔍 Starting discovery at ${serverUrl}`)
	console.log(`[${serverName}] Options:`, {
		hasSessionId: !!options.sessionId,
		hasApiKey: !!options.apiKey,
		hasBearerToken: !!options.bearerToken,
		apiKeyHeaderName: options.apiKeyHeaderName
	})

	const capabilities: MCPServerCapabilities = {
		serverName,
		tools: [],
		resources: [],
		prompts: [],
		discoveredAt: new Date().toISOString(),
	}

	try {
		// If we have a session ID, use the OAuth client from session store
		if (options.sessionId) {
			console.log(`[${serverName}] Attempting to get OAuth client for session ${options.sessionId}`)
			const client = await sessionStore.getClient(options.sessionId)
			if (client) {
				console.log(`[${serverName}] ✅ Found OAuth client:`, client.constructor.name)
				
				// Check if client is connected before using it
				if ("isConnected" in client && typeof (client as any).isConnected === "function") {
					const isConnected = (client as any).isConnected()
					console.log(`[${serverName}] Client connection status:`, isConnected)
					if (!isConnected) {
						console.warn(`[${serverName}] ⚠️  OAuth client is not connected; discovery will be skipped. Client may need to reconnect.`)
						// Return empty capabilities rather than failing - static capabilities will be shown as fallback
						return capabilities
					}
				}
				
				console.log(`[${serverName}] Discovering via OAuth client...`)
				capabilities.tools = await discoverToolsFromOAuthClient(client, serverName)
				capabilities.resources = await discoverResourcesFromOAuthClient(client, serverName)
				capabilities.prompts = await discoverPromptsFromOAuthClient(client, serverName)
				console.log(`[${serverName}] ✅ OAuth discovery complete: ${capabilities.tools.length} tools, ${capabilities.resources.length} resources, ${capabilities.prompts.length} prompts`)
				return capabilities
			} else {
				console.warn(`[${serverName}] ⚠️  No OAuth client found for session ${options.sessionId}, falling back to HTTP`)
			}
		}

		// For HTTP/API key servers, or if OAuth client not found, make direct MCP protocol requests
		console.log(`[${serverName}] Discovering via HTTP...`)
		capabilities.tools = await discoverToolsViaHttp(serverUrl, options)
		capabilities.resources = await discoverResourcesViaHttp(serverUrl, options)
		capabilities.prompts = await discoverPromptsViaHttp(serverUrl, options)
		console.log(`[${serverName}] ✅ HTTP discovery complete: ${capabilities.tools.length} tools, ${capabilities.resources.length} resources, ${capabilities.prompts.length} prompts`)

		return capabilities
	} catch (error) {
		console.error(`[${serverName}] ❌ Error discovering capabilities:`, error)
		if (error instanceof Error) {
			console.error(`[${serverName}] Error details:`, {
				message: error.message,
				stack: error.stack,
				cause: (error as any).cause
			})
		}
		return capabilities // Return empty capabilities rather than throwing
	}
}

/**
 * Discover tools from an OAuth client
 */
async function discoverToolsFromOAuthClient(
	client: MCPOAuthClient | GitHubOAuthClient | any,
	serverName: string
): Promise<MCPTool[]> {
	try {
		const result = await client.listTools()

		// Handle different response formats
		const toolsList = Array.isArray(result?.tools)
			? result.tools
			: Array.isArray(result)
				? result
				: []

		return toolsList.map((tool: any) => ({
			name: tool.name || tool.tool || tool.id,
			description: tool.description || tool.summary || "",
			inputSchema: tool.inputSchema || tool.parameters || tool.schema || {},
			metadata: tool.metadata || {},
		}))
	} catch (error) {
		console.warn(`Failed to discover tools for ${serverName}:`, error)
		return []
	}
}

/**
 * Discover resources from an OAuth client
 */
async function discoverResourcesFromOAuthClient(
	client: MCPOAuthClient | GitHubOAuthClient | any,
	serverName: string
): Promise<MCPResource[]> {
	try {
		// Check if client supports listResources method
		if (typeof client.listResources !== "function") {
			console.log(`${serverName} client does not support listResources`)
			return []
		}

		const result = await client.listResources()

		const resourcesList = Array.isArray(result?.resources)
			? result.resources
			: Array.isArray(result)
				? result
				: []

		return resourcesList.map((resource: any) => ({
			uri: resource.uri || resource.url || resource.id,
			name: resource.name || resource.title,
			description: resource.description,
			mimeType: resource.mimeType || resource.contentType,
			metadata: resource.metadata || {},
		}))
	} catch (error) {
		console.warn(`Failed to discover resources for ${serverName}:`, error)
		return []
	}
}

/**
 * Discover prompts from an OAuth client
 */
async function discoverPromptsFromOAuthClient(
	client: MCPOAuthClient | GitHubOAuthClient | any,
	serverName: string
): Promise<MCPPrompt[]> {
	try {
		// Check if client supports listPrompts method
		if (typeof client.listPrompts !== "function") {
			console.log(`${serverName} client does not support listPrompts`)
			return []
		}

		const result = await client.listPrompts()

		const promptsList = Array.isArray(result?.prompts)
			? result.prompts
			: Array.isArray(result)
				? result
				: []

		return promptsList.map((prompt: any) => ({
			name: prompt.name || prompt.id,
			description: prompt.description,
			arguments: prompt.arguments || prompt.params || [],
			metadata: prompt.metadata || {},
		}))
	} catch (error) {
		console.warn(`Failed to discover prompts for ${serverName}:`, error)
		return []
	}
}

/**
 * Discover tools via direct HTTP request (JSON-RPC 2.0)
 */
async function discoverToolsViaHttp(
	serverUrl: string,
	options: { apiKey?: string; bearerToken?: string; apiKeyHeaderName?: string }
): Promise<MCPTool[]> {
	try {
		console.log(`[HTTP] Requesting tools/list from ${serverUrl}`)
		const response = await makeMcpRequest(serverUrl, "tools/list", {}, options)

		if (!response.result) {
			console.warn(`[HTTP] No tools result from ${serverUrl}`)
			return []
		}

		const tools = Array.isArray(response.result.tools)
			? response.result.tools
			: []

		console.log(`[HTTP] Found ${tools.length} tools from ${serverUrl}`)
		return tools.map((tool: any) => ({
			name: tool.name,
			description: tool.description,
			inputSchema: tool.inputSchema,
			metadata: tool.metadata || {},
		}))
	} catch (error) {
		console.error(`[HTTP] Failed to discover tools via HTTP for ${serverUrl}:`, error)
		if (error instanceof Error) {
			const errorDetails = {
				message: error.message,
				code: (error as any).code,
				errno: (error as any).errno,
				syscall: (error as any).syscall,
				hostname: (error as any).hostname,
				cause: (error as any).cause
			}
			console.error(`[HTTP] Error details:`, errorDetails)
			
			// Check for DNS resolution errors - often caused by Docker service names
			if ((error as any).code === 'ENOTFOUND' && (error as any).hostname) {
				console.error(`[HTTP] ⚠️  DNS resolution failed for hostname: ${(error as any).hostname}`)
				console.error(`[HTTP] ⚠️  This often happens when using Docker service names (e.g., 'google-drive-mcp')`)
				console.error(`[HTTP] ⚠️  Docker service names only resolve inside Docker networks`)
				console.error(`[HTTP] ⚠️  The MCP server URL should be accessible from the Next.js server`)
				console.error(`[HTTP] ⚠️  Consider using 'localhost' or a proper hostname/IP address`)
				console.error(`[HTTP] ⚠️  Current URL: ${serverUrl}`)
			}
		}
		return []
	}
}

/**
 * Discover resources via direct HTTP request (JSON-RPC 2.0)
 */
async function discoverResourcesViaHttp(
	serverUrl: string,
	options: { apiKey?: string; bearerToken?: string; apiKeyHeaderName?: string }
): Promise<MCPResource[]> {
	try {
		console.log(`[HTTP] Requesting resources/list from ${serverUrl}`)
		const response = await makeMcpRequest(serverUrl, "resources/list", {}, options)

		if (!response.result) {
			console.warn(`[HTTP] No resources result from ${serverUrl}`)
			return []
		}

		const resources = Array.isArray(response.result.resources)
			? response.result.resources
			: []

		console.log(`[HTTP] Found ${resources.length} resources from ${serverUrl}`)
		return resources.map((resource: any) => ({
			uri: resource.uri,
			name: resource.name,
			description: resource.description,
			mimeType: resource.mimeType,
			metadata: resource.metadata || {},
		}))
	} catch (error) {
		console.error(`[HTTP] Failed to discover resources via HTTP for ${serverUrl}:`, error)
		if (error instanceof Error) {
			console.error(`[HTTP] Error details:`, {
				message: error.message,
				code: (error as any).code,
				cause: (error as any).cause
			})
		}
		return []
	}
}

/**
 * Discover prompts via direct HTTP request (JSON-RPC 2.0)
 */
async function discoverPromptsViaHttp(
	serverUrl: string,
	options: { apiKey?: string; bearerToken?: string; apiKeyHeaderName?: string }
): Promise<MCPPrompt[]> {
	try {
		console.log(`[HTTP] Requesting prompts/list from ${serverUrl}`)
		const response = await makeMcpRequest(serverUrl, "prompts/list", {}, options)

		if (!response.result) {
			console.warn(`[HTTP] No prompts result from ${serverUrl}`)
			return []
		}

		const prompts = Array.isArray(response.result.prompts)
			? response.result.prompts
			: []

		console.log(`[HTTP] Found ${prompts.length} prompts from ${serverUrl}`)
		return prompts.map((prompt: any) => ({
			name: prompt.name,
			description: prompt.description,
			arguments: prompt.arguments,
			metadata: prompt.metadata || {},
		}))
	} catch (error) {
		console.error(`[HTTP] Failed to discover prompts via HTTP for ${serverUrl}:`, error)
		if (error instanceof Error) {
			console.error(`[HTTP] Error details:`, {
				message: error.message,
				code: (error as any).code,
				cause: (error as any).cause
			})
		}
		return []
	}
}

/**
 * Makes a JSON-RPC 2.0 request to an MCP server
 * Handles both JSON and SSE (Server-Sent Events) response formats
 */
async function makeMcpRequest(
	serverUrl: string,
	method: string,
	params: Record<string, unknown>,
	options: { apiKey?: string; bearerToken?: string; apiKeyHeaderName?: string }
): Promise<any> {
	// Normalize URL - handle Docker service names and ensure /mcp base path
	// This handles cases where URL is stored in DB with Docker service names or without base path
	let normalizedUrl = serverUrl
	
	// Convert Docker service names to localhost for external access
	if (serverUrl.includes('google-drive-mcp:')) {
		normalizedUrl = serverUrl.replace('google-drive-mcp:', 'localhost:')
		console.log(`[HTTP] Converted Docker service name to localhost: ${serverUrl} → ${normalizedUrl}`)
	} else if (serverUrl.includes('gmail-mcp-server:')) {
		normalizedUrl = serverUrl.replace('gmail-mcp-server:', 'localhost:')
		console.log(`[HTTP] Converted Docker service name to localhost: ${serverUrl} → ${normalizedUrl}`)
	}
	
	// Ensure it has /mcp base path if it's a localhost Google server
	if (normalizedUrl.includes('localhost:300') && !normalizedUrl.includes('/mcp')) {
		normalizedUrl = `${normalizedUrl.replace(/\/$/, '')}/mcp`
		console.log(`[HTTP] Added /mcp base path: ${normalizedUrl}`)
	}
	
	if (normalizedUrl !== serverUrl) {
		console.log(`[HTTP] Normalized URL from ${serverUrl} to ${normalizedUrl}`)
	}

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		"Accept": "application/json, text/event-stream",
	}

	// Add authentication if provided
	if (options.bearerToken) {
		headers.Authorization = `Bearer ${options.bearerToken}`
	} else if (options.apiKey) {
		// Use custom header name if specified (e.g., "X-Goog-Api-Key" for Google Maps)
		const headerName = options.apiKeyHeaderName || "X-API-Key"
		headers[headerName] = options.apiKey
		// Some servers also accept API key in Authorization header
		headers.Authorization = `Bearer ${options.apiKey}`
	}

	const request = {
		jsonrpc: "2.0",
		id: Date.now(),
		method,
		params,
	}

	const response = await fetch(normalizedUrl, {
		method: "POST",
		headers,
		body: JSON.stringify(request),
		signal: AbortSignal.timeout(15000), // 15 second timeout
	})

	if (!response.ok) {
		const errorText = await response.text().catch(() => response.statusText)
		throw new Error(`HTTP ${response.status}: ${errorText}`)
	}

	const contentType = response.headers.get("content-type") || ""
	const responseText = await response.text()

	// Handle SSE (Server-Sent Events) format
	if (contentType.includes("text/event-stream") || responseText.includes("event:") && responseText.includes("data:")) {
		const lines = responseText.split("\n")
		const dataLine = lines.find((line) => line.startsWith("data: "))
		if (dataLine) {
			const jsonString = dataLine.substring(6) // Remove 'data: ' prefix
			try {
				return JSON.parse(jsonString)
			} catch (parseError) {
				throw new Error(`Failed to parse SSE data: ${parseError instanceof Error ? parseError.message : String(parseError)}`)
			}
		}
		throw new Error("SSE response format detected but no data field found")
	}

	// Handle plain JSON response
	try {
		return JSON.parse(responseText)
	} catch (parseError) {
		throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : String(parseError)}`)
	}
}

/**
 * Batch discover capabilities for multiple servers
 */
export async function discoverMultipleServers(
	servers: Array<{
		serverName: string
		url: string
		sessionId?: string
		apiKey?: string
		bearerToken?: string
	}>
): Promise<MCPServerCapabilities[]> {
	const discoveries = await Promise.allSettled(
		servers.map((server) =>
			discoverServerCapabilities(server.url, server.serverName, {
				sessionId: server.sessionId,
				apiKey: server.apiKey,
				bearerToken: server.bearerToken,
			})
		)
	)

	return discoveries
		.filter((result): result is PromiseFulfilledResult<MCPServerCapabilities> =>
			result.status === "fulfilled"
		)
		.map((result) => result.value)
}
