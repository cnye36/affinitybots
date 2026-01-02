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
	qualifiedName: string
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
	qualifiedName: string,
	options: {
		sessionId?: string
		apiKey?: string
		bearerToken?: string
	} = {}
): Promise<MCPServerCapabilities> {
	console.log(`🔍 Discovering capabilities for ${qualifiedName} at ${serverUrl}`)

	const capabilities: MCPServerCapabilities = {
		qualifiedName,
		tools: [],
		resources: [],
		prompts: [],
		discoveredAt: new Date().toISOString(),
	}

	try {
		// If we have a session ID, use the OAuth client from session store
		if (options.sessionId) {
			const client = await sessionStore.getClient(options.sessionId)
			if (client) {
				console.log(`Using OAuth client for ${qualifiedName}`)
				capabilities.tools = await discoverToolsFromOAuthClient(client, qualifiedName)
				capabilities.resources = await discoverResourcesFromOAuthClient(client, qualifiedName)
				capabilities.prompts = await discoverPromptsFromOAuthClient(client, qualifiedName)
				return capabilities
			}
		}

		// For HTTP/API key servers, make direct MCP protocol requests
		capabilities.tools = await discoverToolsViaHttp(serverUrl, options)
		capabilities.resources = await discoverResourcesViaHttp(serverUrl, options)
		capabilities.prompts = await discoverPromptsViaHttp(serverUrl, options)

		return capabilities
	} catch (error) {
		console.error(`Error discovering capabilities for ${qualifiedName}:`, error)
		return capabilities // Return empty capabilities rather than throwing
	}
}

/**
 * Discover tools from an OAuth client
 */
async function discoverToolsFromOAuthClient(
	client: MCPOAuthClient | GitHubOAuthClient | any,
	qualifiedName: string
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
		console.warn(`Failed to discover tools for ${qualifiedName}:`, error)
		return []
	}
}

/**
 * Discover resources from an OAuth client
 */
async function discoverResourcesFromOAuthClient(
	client: MCPOAuthClient | GitHubOAuthClient | any,
	qualifiedName: string
): Promise<MCPResource[]> {
	try {
		// Check if client supports listResources method
		if (typeof client.listResources !== "function") {
			console.log(`${qualifiedName} client does not support listResources`)
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
		console.warn(`Failed to discover resources for ${qualifiedName}:`, error)
		return []
	}
}

/**
 * Discover prompts from an OAuth client
 */
async function discoverPromptsFromOAuthClient(
	client: MCPOAuthClient | GitHubOAuthClient | any,
	qualifiedName: string
): Promise<MCPPrompt[]> {
	try {
		// Check if client supports listPrompts method
		if (typeof client.listPrompts !== "function") {
			console.log(`${qualifiedName} client does not support listPrompts`)
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
		console.warn(`Failed to discover prompts for ${qualifiedName}:`, error)
		return []
	}
}

/**
 * Discover tools via direct HTTP request (JSON-RPC 2.0)
 */
async function discoverToolsViaHttp(
	serverUrl: string,
	options: { apiKey?: string; bearerToken?: string }
): Promise<MCPTool[]> {
	try {
		const response = await makeMcpRequest(serverUrl, "tools/list", {}, options)

		if (!response.result) {
			console.warn(`No tools result from ${serverUrl}`)
			return []
		}

		const tools = Array.isArray(response.result.tools)
			? response.result.tools
			: []

		return tools.map((tool: any) => ({
			name: tool.name,
			description: tool.description,
			inputSchema: tool.inputSchema,
			metadata: tool.metadata || {},
		}))
	} catch (error) {
		console.warn(`Failed to discover tools via HTTP for ${serverUrl}:`, error)
		return []
	}
}

/**
 * Discover resources via direct HTTP request (JSON-RPC 2.0)
 */
async function discoverResourcesViaHttp(
	serverUrl: string,
	options: { apiKey?: string; bearerToken?: string }
): Promise<MCPResource[]> {
	try {
		const response = await makeMcpRequest(serverUrl, "resources/list", {}, options)

		if (!response.result) {
			return []
		}

		const resources = Array.isArray(response.result.resources)
			? response.result.resources
			: []

		return resources.map((resource: any) => ({
			uri: resource.uri,
			name: resource.name,
			description: resource.description,
			mimeType: resource.mimeType,
			metadata: resource.metadata || {},
		}))
	} catch (error) {
		console.warn(`Failed to discover resources via HTTP for ${serverUrl}:`, error)
		return []
	}
}

/**
 * Discover prompts via direct HTTP request (JSON-RPC 2.0)
 */
async function discoverPromptsViaHttp(
	serverUrl: string,
	options: { apiKey?: string; bearerToken?: string }
): Promise<MCPPrompt[]> {
	try {
		const response = await makeMcpRequest(serverUrl, "prompts/list", {}, options)

		if (!response.result) {
			return []
		}

		const prompts = Array.isArray(response.result.prompts)
			? response.result.prompts
			: []

		return prompts.map((prompt: any) => ({
			name: prompt.name,
			description: prompt.description,
			arguments: prompt.arguments,
			metadata: prompt.metadata || {},
		}))
	} catch (error) {
		console.warn(`Failed to discover prompts via HTTP for ${serverUrl}:`, error)
		return []
	}
}

/**
 * Makes a JSON-RPC 2.0 request to an MCP server
 */
async function makeMcpRequest(
	serverUrl: string,
	method: string,
	params: Record<string, unknown>,
	options: { apiKey?: string; bearerToken?: string }
): Promise<any> {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	}

	// Add authentication if provided
	if (options.bearerToken) {
		headers.Authorization = `Bearer ${options.bearerToken}`
	} else if (options.apiKey) {
		headers["X-API-Key"] = options.apiKey
		// Some servers also accept API key in Authorization header
		headers.Authorization = `Bearer ${options.apiKey}`
	}

	const request = {
		jsonrpc: "2.0",
		id: Date.now(),
		method,
		params,
	}

	const response = await fetch(serverUrl, {
		method: "POST",
		headers,
		body: JSON.stringify(request),
		signal: AbortSignal.timeout(15000), // 15 second timeout
	})

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}: ${response.statusText}`)
	}

	return await response.json()
}

/**
 * Batch discover capabilities for multiple servers
 */
export async function discoverMultipleServers(
	servers: Array<{
		qualifiedName: string
		url: string
		sessionId?: string
		apiKey?: string
		bearerToken?: string
	}>
): Promise<MCPServerCapabilities[]> {
	const discoveries = await Promise.allSettled(
		servers.map((server) =>
			discoverServerCapabilities(server.url, server.qualifiedName, {
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
