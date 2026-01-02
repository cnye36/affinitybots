/**
 * Static MCP Server Capabilities
 *
 * Pre-defined capabilities for well-known MCP servers.
 * This allows users to preview what tools are available BEFORE connecting.
 *
 * These are updated periodically based on official server documentation.
 */

import type { MCPTool, MCPResource, MCPPrompt } from "./mcpDiscovery"

interface StaticServerCapabilities {
	qualifiedName: string
	tools: MCPTool[]
	resources?: MCPResource[]
	prompts?: MCPPrompt[]
	lastUpdated: string
}

export const STATIC_MCP_CAPABILITIES: Record<string, StaticServerCapabilities> = {
	"sentry": {
		qualifiedName: "sentry",
		lastUpdated: "2026-01-01",
		tools: [
			{
				name: "search_issues",
				description: "Search for issues in Sentry projects",
				inputSchema: {
					type: "object",
					properties: {
						query: { type: "string", description: "Search query string" },
						project: { type: "string", description: "Project ID or slug" },
						status: { type: "string", enum: ["resolved", "unresolved", "ignored"], description: "Issue status filter" },
					},
					required: ["query"],
				},
			},
			{
				name: "get_issue_details",
				description: "Get detailed information about a specific issue",
				inputSchema: {
					type: "object",
					properties: {
						issue_id: { type: "string", description: "Issue ID" },
					},
					required: ["issue_id"],
				},
			},
			{
				name: "create_dsn",
				description: "Create a new Data Source Name (DSN) for a project",
				inputSchema: {
					type: "object",
					properties: {
						project: { type: "string", description: "Project ID or slug" },
						name: { type: "string", description: "Name for the DSN" },
					},
					required: ["project"],
				},
			},
			{
				name: "list_projects",
				description: "List all projects in the organization",
				inputSchema: {
					type: "object",
					properties: {},
				},
			},
			{
				name: "query_metrics",
				description: "Query performance metrics and statistics",
				inputSchema: {
					type: "object",
					properties: {
						project: { type: "string", description: "Project ID" },
						metric: { type: "string", description: "Metric name to query" },
						interval: { type: "string", description: "Time interval (e.g., 1h, 1d)" },
					},
					required: ["project", "metric"],
				},
			},
			{
				name: "get_organization_info",
				description: "Get information about the organization",
				inputSchema: {
					type: "object",
					properties: {},
				},
			},
			{
				name: "list_teams",
				description: "List all teams in the organization",
				inputSchema: {
					type: "object",
					properties: {},
				},
			},
			{
				name: "search_events",
				description: "Search for specific events",
				inputSchema: {
					type: "object",
					properties: {
						query: { type: "string", description: "Event search query" },
						project: { type: "string", description: "Project ID" },
					},
					required: ["query"],
				},
			},
			{
				name: "get_release_info",
				description: "Get information about a specific release",
				inputSchema: {
					type: "object",
					properties: {
						version: { type: "string", description: "Release version" },
						project: { type: "string", description: "Project ID" },
					},
					required: ["version"],
				},
			},
			{
				name: "create_issue_comment",
				description: "Add a comment to an issue",
				inputSchema: {
					type: "object",
					properties: {
						issue_id: { type: "string", description: "Issue ID" },
						comment: { type: "string", description: "Comment text" },
					},
					required: ["issue_id", "comment"],
				},
			},
			{
				name: "resolve_issue",
				description: "Mark an issue as resolved",
				inputSchema: {
					type: "object",
					properties: {
						issue_id: { type: "string", description: "Issue ID" },
					},
					required: ["issue_id"],
				},
			},
			{
				name: "assign_issue",
				description: "Assign an issue to a team member",
				inputSchema: {
					type: "object",
					properties: {
						issue_id: { type: "string", description: "Issue ID" },
						assignee: { type: "string", description: "User email or ID" },
					},
					required: ["issue_id", "assignee"],
				},
			},
			{
				name: "get_error_trends",
				description: "Get error trend data over time",
				inputSchema: {
					type: "object",
					properties: {
						project: { type: "string", description: "Project ID" },
						interval: { type: "string", description: "Time interval" },
					},
					required: ["project"],
				},
			},
			{
				name: "query_discover",
				description: "Use Discover API for custom queries",
				inputSchema: {
					type: "object",
					properties: {
						query: { type: "string", description: "Discover query" },
						project: { type: "string", description: "Project ID" },
					},
					required: ["query"],
				},
			},
			{
				name: "seer_autofix",
				description: "Use Seer AI to automatically generate fix suggestions for issues",
				inputSchema: {
					type: "object",
					properties: {
						issue_id: { type: "string", description: "Issue ID to analyze" },
					},
					required: ["issue_id"],
				},
			},
			{
				name: "get_stack_trace",
				description: "Get the stack trace for an error",
				inputSchema: {
					type: "object",
					properties: {
						event_id: { type: "string", description: "Event ID" },
					},
					required: ["event_id"],
				},
			},
		],
	},

	"zapier": {
		qualifiedName: "zapier",
		lastUpdated: "2026-01-01",
		tools: [
			{
				name: "list_zaps",
				description: "List all Zapier automations (Zaps)",
				inputSchema: {
					type: "object",
					properties: {
						status: { type: "string", enum: ["on", "off", "draft"], description: "Filter by status" },
					},
				},
			},
			{
				name: "trigger_zap",
				description: "Manually trigger a Zap",
				inputSchema: {
					type: "object",
					properties: {
						zap_id: { type: "string", description: "The Zap ID to trigger" },
						data: { type: "object", description: "Data to pass to the Zap" },
					},
					required: ["zap_id"],
				},
			},
			{
				name: "create_zap",
				description: "Create a new Zap automation",
				inputSchema: {
					type: "object",
					properties: {
						trigger: {
							type: "object",
							description: "Trigger configuration",
							properties: {
								app: { type: "string", description: "App name (e.g., 'gmail', 'slack')" },
								event: { type: "string", description: "Trigger event" },
							},
							required: ["app", "event"],
						},
						actions: {
							type: "array",
							description: "List of actions to perform",
							items: {
								type: "object",
								properties: {
									app: { type: "string" },
									action: { type: "string" },
									params: { type: "object" },
								},
							},
						},
					},
					required: ["trigger", "actions"],
				},
			},
			{
				name: "get_zap_history",
				description: "Get execution history for a Zap",
				inputSchema: {
					type: "object",
					properties: {
						zap_id: { type: "string", description: "Zap ID" },
						limit: { type: "number", description: "Number of results" },
					},
					required: ["zap_id"],
				},
			},
			{
				name: "pause_zap",
				description: "Pause a running Zap",
				inputSchema: {
					type: "object",
					properties: {
						zap_id: { type: "string", description: "Zap ID" },
					},
					required: ["zap_id"],
				},
			},
			{
				name: "resume_zap",
				description: "Resume a paused Zap",
				inputSchema: {
					type: "object",
					properties: {
						zap_id: { type: "string", description: "Zap ID" },
					},
					required: ["zap_id"],
				},
			},
			{
				name: "test_zap",
				description: "Test a Zap configuration",
				inputSchema: {
					type: "object",
					properties: {
						zap_id: { type: "string", description: "Zap ID" },
					},
					required: ["zap_id"],
				},
			},
			{
				name: "search_apps",
				description: "Search for available Zapier apps",
				inputSchema: {
					type: "object",
					properties: {
						query: { type: "string", description: "Search query" },
					},
					required: ["query"],
				},
			},
		],
	},

	"firecrawl": {
		qualifiedName: "firecrawl",
		lastUpdated: "2026-01-01",
		tools: [
			{
				name: "scrape_url",
				description: "Scrape content from a single URL",
				inputSchema: {
					type: "object",
					properties: {
						url: { type: "string", description: "URL to scrape" },
						formats: {
							type: "array",
							items: { type: "string", enum: ["markdown", "html", "rawHtml", "links", "screenshot"] },
							description: "Output formats",
						},
					},
					required: ["url"],
				},
			},
			{
				name: "crawl_website",
				description: "Crawl an entire website",
				inputSchema: {
					type: "object",
					properties: {
						url: { type: "string", description: "Starting URL" },
						max_depth: { type: "number", description: "Maximum crawl depth" },
						limit: { type: "number", description: "Maximum pages to crawl" },
					},
					required: ["url"],
				},
			},
			{
				name: "extract_structured_data",
				description: "Extract structured data from HTML",
				inputSchema: {
					type: "object",
					properties: {
						url: { type: "string", description: "URL to extract from" },
						schema: { type: "object", description: "JSON schema for extraction" },
					},
					required: ["url", "schema"],
				},
			},
			{
				name: "convert_to_markdown",
				description: "Convert web content to markdown format",
				inputSchema: {
					type: "object",
					properties: {
						url: { type: "string", description: "URL to convert" },
					},
					required: ["url"],
				},
			},
			{
				name: "batch_scrape",
				description: "Scrape multiple URLs in one request",
				inputSchema: {
					type: "object",
					properties: {
						urls: { type: "array", items: { type: "string" }, description: "List of URLs" },
					},
					required: ["urls"],
				},
			},
		],
		resources: [
			{
				uri: "scraped://{id}",
				name: "Scraped Content",
				description: "Access previously scraped content by ID",
				mimeType: "text/markdown",
			},
			{
				uri: "crawls://{id}/results",
				name: "Crawl Results",
				description: "Access results from a website crawl",
				mimeType: "application/json",
			},
		],
	},

	"brave-search": {
		qualifiedName: "brave-search",
		lastUpdated: "2026-01-01",
		tools: [
			{
				name: "web_search",
				description: "Search the web using Brave Search",
				inputSchema: {
					type: "object",
					properties: {
						query: { type: "string", description: "Search query" },
						count: { type: "number", description: "Number of results (default 10)" },
						offset: { type: "number", description: "Result offset for pagination" },
					},
					required: ["query"],
				},
			},
			{
				name: "image_search",
				description: "Search for images",
				inputSchema: {
					type: "object",
					properties: {
						query: { type: "string", description: "Image search query" },
					},
					required: ["query"],
				},
			},
			{
				name: "news_search",
				description: "Search for news articles",
				inputSchema: {
					type: "object",
					properties: {
						query: { type: "string", description: "News search query" },
					},
					required: ["query"],
				},
			},
			{
				name: "local_search",
				description: "Search for local businesses and places",
				inputSchema: {
					type: "object",
					properties: {
						query: { type: "string", description: "Local search query" },
						location: { type: "string", description: "Location (e.g., 'New York, NY')" },
					},
					required: ["query"],
				},
			},
		],
	},

	"browserbase": {
		qualifiedName: "browserbase",
		lastUpdated: "2026-01-01",
		tools: [
			{
				name: "navigate",
				description: "Navigate to a URL in a cloud browser",
				inputSchema: {
					type: "object",
					properties: {
						url: { type: "string", description: "URL to navigate to" },
					},
					required: ["url"],
				},
			},
			{
				name: "screenshot",
				description: "Take a screenshot of the current page",
				inputSchema: {
					type: "object",
					properties: {
						full_page: { type: "boolean", description: "Capture full page" },
					},
				},
			},
			{
				name: "click",
				description: "Click an element on the page",
				inputSchema: {
					type: "object",
					properties: {
						selector: { type: "string", description: "CSS selector" },
					},
					required: ["selector"],
				},
			},
			{
				name: "fill_form",
				description: "Fill out a form field",
				inputSchema: {
					type: "object",
					properties: {
						selector: { type: "string", description: "CSS selector" },
						value: { type: "string", description: "Value to fill" },
					},
					required: ["selector", "value"],
				},
			},
			{
				name: "extract_text",
				description: "Extract text content from the page",
				inputSchema: {
					type: "object",
					properties: {
						selector: { type: "string", description: "Optional CSS selector" },
					},
				},
			},
		],
	},

	"prisma-postgres": {
		qualifiedName: "prisma-postgres",
		lastUpdated: "2026-01-01",
		tools: [
			{
				name: "create_backup",
				description: "Create a backup of a Prisma Postgres database",
				inputSchema: {
					type: "object",
					properties: {
						database_id: { type: "string", description: "Database ID" },
						name: { type: "string", description: "Backup name" },
					},
					required: ["database_id"],
				},
			},
			{
				name: "create_connection_string",
				description: "Generate a connection string for a database",
				inputSchema: {
					type: "object",
					properties: {
						database_id: { type: "string", description: "Database ID" },
					},
					required: ["database_id"],
				},
			},
			{
				name: "restore_database",
				description: "Restore a database from a backup",
				inputSchema: {
					type: "object",
					properties: {
						backup_id: { type: "string", description: "Backup ID" },
						target_database: { type: "string", description: "Target database name" },
					},
					required: ["backup_id"],
				},
			},
		],
	},
}

/**
 * Get static capabilities for a server
 */
export function getStaticCapabilities(qualifiedName: string): StaticServerCapabilities | null {
	return STATIC_MCP_CAPABILITIES[qualifiedName] || null
}

/**
 * Check if a server has static capabilities defined
 */
export function hasStaticCapabilities(qualifiedName: string): boolean {
	return qualifiedName in STATIC_MCP_CAPABILITIES
}
