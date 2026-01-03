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
	serverName: string
	tools: MCPTool[]
	resources?: MCPResource[]
	prompts?: MCPPrompt[]
	lastUpdated: string
}

export const STATIC_MCP_CAPABILITIES: Record<string, StaticServerCapabilities> = {
	"sentry": {
		serverName: "sentry",
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
		serverName: "zapier",
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
		serverName: "firecrawl",
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
		serverName: "brave-search",
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
		serverName: "browserbase",
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
		serverName: "prisma-postgres",
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

	"notion": {
		serverName: "notion",
		lastUpdated: "2026-01-02",
		tools: [
			{
				name: "search_pages",
				description: "Search for pages in your Notion workspace",
				inputSchema: {
					type: "object",
					properties: {
						query: { type: "string", description: "Search query string" },
						filter: { type: "object", description: "Optional filter criteria" },
					},
					required: ["query"],
				},
			},
			{
				name: "create_page",
				description: "Create a new page in Notion",
				inputSchema: {
					type: "object",
					properties: {
						parent_id: { type: "string", description: "Parent page or database ID" },
						title: { type: "string", description: "Page title" },
						properties: { type: "object", description: "Page properties" },
					},
					required: ["parent_id", "title"],
				},
			},
			{
				name: "update_page",
				description: "Update an existing page in Notion",
				inputSchema: {
					type: "object",
					properties: {
						page_id: { type: "string", description: "Page ID to update" },
						properties: { type: "object", description: "Properties to update" },
					},
					required: ["page_id"],
				},
			},
			{
				name: "get_page",
				description: "Retrieve a specific page by ID",
				inputSchema: {
					type: "object",
					properties: {
						page_id: { type: "string", description: "Page ID" },
					},
					required: ["page_id"],
				},
			},
			{
				name: "query_database",
				description: "Query a Notion database",
				inputSchema: {
					type: "object",
					properties: {
						database_id: { type: "string", description: "Database ID" },
						filter: { type: "object", description: "Query filter" },
						sorts: { type: "array", description: "Sort criteria" },
					},
					required: ["database_id"],
				},
			},
			{
				name: "create_database_page",
				description: "Create a new page in a database",
				inputSchema: {
					type: "object",
					properties: {
						database_id: { type: "string", description: "Database ID" },
						properties: { type: "object", description: "Page properties matching database schema" },
					},
					required: ["database_id", "properties"],
				},
			},
			{
				name: "append_block",
				description: "Append blocks to a page",
				inputSchema: {
					type: "object",
					properties: {
						page_id: { type: "string", description: "Page ID" },
						children: { type: "array", description: "Array of block objects to append" },
					},
					required: ["page_id", "children"],
				},
			},
			{
				name: "archive_page",
				description: "Archive a page in Notion",
				inputSchema: {
					type: "object",
					properties: {
						page_id: { type: "string", description: "Page ID to archive" },
					},
					required: ["page_id"],
				},
			},
			{
				name: "list_databases",
				description: "List all databases in the workspace",
				inputSchema: {
					type: "object",
					properties: {},
				},
			},
			{
				name: "get_database",
				description: "Retrieve database schema and information",
				inputSchema: {
					type: "object",
					properties: {
						database_id: { type: "string", description: "Database ID" },
					},
					required: ["database_id"],
				},
			},
		],
		resources: [
			{
				uri: "notion://page/{page_id}",
				name: "Notion Page",
				description: "Access content from a Notion page",
				mimeType: "application/json",
			},
			{
				uri: "notion://database/{database_id}",
				name: "Notion Database",
				description: "Access data from a Notion database",
				mimeType: "application/json",
			},
		],
	},

	"github": {
		serverName: "github",
		lastUpdated: "2026-01-02",
		tools: [
			{
				name: "list_repositories",
				description: "List repositories for the authenticated user or organization",
				inputSchema: {
					type: "object",
					properties: {
						owner: { type: "string", description: "Owner (user or org)" },
						type: { type: "string", enum: ["all", "owner", "member"], description: "Repository type filter" },
					},
				},
			},
			{
				name: "get_repository",
				description: "Get details about a specific repository",
				inputSchema: {
					type: "object",
					properties: {
						owner: { type: "string", description: "Repository owner" },
						repo: { type: "string", description: "Repository name" },
					},
					required: ["owner", "repo"],
				},
			},
			{
				name: "search_repositories",
				description: "Search for repositories",
				inputSchema: {
					type: "object",
					properties: {
						query: { type: "string", description: "Search query" },
						sort: { type: "string", enum: ["stars", "forks", "updated"], description: "Sort order" },
					},
					required: ["query"],
				},
			},
			{
				name: "list_issues",
				description: "List issues in a repository",
				inputSchema: {
					type: "object",
					properties: {
						owner: { type: "string", description: "Repository owner" },
						repo: { type: "string", description: "Repository name" },
						state: { type: "string", enum: ["open", "closed", "all"], description: "Issue state" },
					},
					required: ["owner", "repo"],
				},
			},
			{
				name: "get_issue",
				description: "Get a specific issue",
				inputSchema: {
					type: "object",
					properties: {
						owner: { type: "string", description: "Repository owner" },
						repo: { type: "string", description: "Repository name" },
						issue_number: { type: "number", description: "Issue number" },
					},
					required: ["owner", "repo", "issue_number"],
				},
			},
			{
				name: "create_issue",
				description: "Create a new issue",
				inputSchema: {
					type: "object",
					properties: {
						owner: { type: "string", description: "Repository owner" },
						repo: { type: "string", description: "Repository name" },
						title: { type: "string", description: "Issue title" },
						body: { type: "string", description: "Issue body" },
					},
					required: ["owner", "repo", "title"],
				},
			},
			{
				name: "list_pull_requests",
				description: "List pull requests in a repository",
				inputSchema: {
					type: "object",
					properties: {
						owner: { type: "string", description: "Repository owner" },
						repo: { type: "string", description: "Repository name" },
						state: { type: "string", enum: ["open", "closed", "all"], description: "PR state" },
					},
					required: ["owner", "repo"],
				},
			},
			{
				name: "get_pull_request",
				description: "Get a specific pull request",
				inputSchema: {
					type: "object",
					properties: {
						owner: { type: "string", description: "Repository owner" },
						repo: { type: "string", description: "Repository name" },
						pull_number: { type: "number", description: "Pull request number" },
					},
					required: ["owner", "repo", "pull_number"],
				},
			},
			{
				name: "create_pull_request",
				description: "Create a new pull request",
				inputSchema: {
					type: "object",
					properties: {
						owner: { type: "string", description: "Repository owner" },
						repo: { type: "string", description: "Repository name" },
						title: { type: "string", description: "PR title" },
						head: { type: "string", description: "Source branch" },
						base: { type: "string", description: "Target branch" },
						body: { type: "string", description: "PR description" },
					},
					required: ["owner", "repo", "title", "head", "base"],
				},
			},
			{
				name: "get_file_contents",
				description: "Get contents of a file in a repository",
				inputSchema: {
					type: "object",
					properties: {
						owner: { type: "string", description: "Repository owner" },
						repo: { type: "string", description: "Repository name" },
						path: { type: "string", description: "File path" },
						ref: { type: "string", description: "Branch or commit SHA" },
					},
					required: ["owner", "repo", "path"],
				},
			},
			{
				name: "search_code",
				description: "Search code across repositories",
				inputSchema: {
					type: "object",
					properties: {
						query: { type: "string", description: "Code search query" },
						repo: { type: "string", description: "Limit search to repository" },
					},
					required: ["query"],
				},
			},
		],
		resources: [
			{
				uri: "github://repository/{owner}/{repo}",
				name: "GitHub Repository",
				description: "Access repository information and contents",
				mimeType: "application/json",
			},
			{
				uri: "github://issue/{owner}/{repo}/{number}",
				name: "GitHub Issue",
				description: "Access issue details and comments",
				mimeType: "application/json",
			},
		],
	},

	"hubspot": {
		serverName: "hubspot",
		lastUpdated: "2026-01-02",
		tools: [
			{
				name: "search_contacts",
				description: "Search for contacts in HubSpot CRM",
				inputSchema: {
					type: "object",
					properties: {
						query: { type: "string", description: "Search query" },
						properties: { type: "array", items: { type: "string" }, description: "Properties to return" },
					},
					required: ["query"],
				},
			},
			{
				name: "get_contact",
				description: "Get a specific contact by ID",
				inputSchema: {
					type: "object",
					properties: {
						contact_id: { type: "string", description: "Contact ID" },
						properties: { type: "array", items: { type: "string" }, description: "Properties to return" },
					},
					required: ["contact_id"],
				},
			},
			{
				name: "create_contact",
				description: "Create a new contact",
				inputSchema: {
					type: "object",
					properties: {
						email: { type: "string", description: "Contact email" },
						firstname: { type: "string", description: "First name" },
						lastname: { type: "string", description: "Last name" },
						properties: { type: "object", description: "Additional properties" },
					},
					required: ["email"],
				},
			},
			{
				name: "update_contact",
				description: "Update an existing contact",
				inputSchema: {
					type: "object",
					properties: {
						contact_id: { type: "string", description: "Contact ID" },
						properties: { type: "object", description: "Properties to update" },
					},
					required: ["contact_id", "properties"],
				},
			},
			{
				name: "search_companies",
				description: "Search for companies in HubSpot CRM",
				inputSchema: {
					type: "object",
					properties: {
						query: { type: "string", description: "Search query" },
						properties: { type: "array", items: { type: "string" }, description: "Properties to return" },
					},
					required: ["query"],
				},
			},
			{
				name: "get_company",
				description: "Get a specific company by ID",
				inputSchema: {
					type: "object",
					properties: {
						company_id: { type: "string", description: "Company ID" },
						properties: { type: "array", items: { type: "string" }, description: "Properties to return" },
					},
					required: ["company_id"],
				},
			},
			{
				name: "create_company",
				description: "Create a new company",
				inputSchema: {
					type: "object",
					properties: {
						name: { type: "string", description: "Company name" },
						properties: { type: "object", description: "Additional properties" },
					},
					required: ["name"],
				},
			},
			{
				name: "search_deals",
				description: "Search for deals in HubSpot CRM",
				inputSchema: {
					type: "object",
					properties: {
						query: { type: "string", description: "Search query" },
						properties: { type: "array", items: { type: "string" }, description: "Properties to return" },
					},
					required: ["query"],
				},
			},
			{
				name: "get_deal",
				description: "Get a specific deal by ID",
				inputSchema: {
					type: "object",
					properties: {
						deal_id: { type: "string", description: "Deal ID" },
						properties: { type: "array", items: { type: "string" }, description: "Properties to return" },
					},
					required: ["deal_id"],
				},
			},
			{
				name: "create_deal",
				description: "Create a new deal",
				inputSchema: {
					type: "object",
					properties: {
						dealname: { type: "string", description: "Deal name" },
						amount: { type: "number", description: "Deal amount" },
						properties: { type: "object", description: "Additional properties" },
					},
					required: ["dealname"],
				},
			},
		],
		resources: [
			{
				uri: "hubspot://contact/{contact_id}",
				name: "HubSpot Contact",
				description: "Access contact information from HubSpot CRM",
				mimeType: "application/json",
			},
			{
				uri: "hubspot://company/{company_id}",
				name: "HubSpot Company",
				description: "Access company information from HubSpot CRM",
				mimeType: "application/json",
			},
		],
	},

	"supabase": {
		serverName: "supabase",
		lastUpdated: "2026-01-02",
		tools: [
			{
				name: "list_projects",
				description: "List all Supabase projects",
				inputSchema: {
					type: "object",
					properties: {},
				},
			},
			{
				name: "get_project",
				description: "Get details about a specific project",
				inputSchema: {
					type: "object",
					properties: {
						project_id: { type: "string", description: "Project ID" },
					},
					required: ["project_id"],
				},
			},
			{
				name: "list_tables",
				description: "List tables in a project database",
				inputSchema: {
					type: "object",
					properties: {
						project_id: { type: "string", description: "Project ID" },
					},
					required: ["project_id"],
				},
			},
			{
				name: "get_table_schema",
				description: "Get schema for a specific table",
				inputSchema: {
					type: "object",
					properties: {
						project_id: { type: "string", description: "Project ID" },
						table_name: { type: "string", description: "Table name" },
					},
					required: ["project_id", "table_name"],
				},
			},
			{
				name: "query_database",
				description: "Execute a SQL query on a project database",
				inputSchema: {
					type: "object",
					properties: {
						project_id: { type: "string", description: "Project ID" },
						query: { type: "string", description: "SQL query to execute" },
					},
					required: ["project_id", "query"],
				},
			},
			{
				name: "create_table",
				description: "Create a new table in a project database",
				inputSchema: {
					type: "object",
					properties: {
						project_id: { type: "string", description: "Project ID" },
						table_name: { type: "string", description: "Table name" },
						schema: { type: "object", description: "Table schema definition" },
					},
					required: ["project_id", "table_name", "schema"],
				},
			},
			{
				name: "create_migration",
				description: "Create a database migration",
				inputSchema: {
					type: "object",
					properties: {
						project_id: { type: "string", description: "Project ID" },
						name: { type: "string", description: "Migration name" },
						sql: { type: "string", description: "SQL for the migration" },
					},
					required: ["project_id", "name", "sql"],
				},
			},
			{
				name: "get_migrations",
				description: "List database migrations for a project",
				inputSchema: {
					type: "object",
					properties: {
						project_id: { type: "string", description: "Project ID" },
					},
					required: ["project_id"],
				},
			},
			{
				name: "get_logs",
				description: "Get project logs for debugging",
				inputSchema: {
					type: "object",
					properties: {
						project_id: { type: "string", description: "Project ID" },
						level: { type: "string", enum: ["info", "warn", "error"], description: "Log level filter" },
					},
					required: ["project_id"],
				},
			},
		],
		resources: [
			{
				uri: "supabase://project/{project_id}",
				name: "Supabase Project",
				description: "Access project information and configuration",
				mimeType: "application/json",
			},
			{
				uri: "supabase://table/{project_id}/{table_name}",
				name: "Supabase Table",
				description: "Access table schema and data",
				mimeType: "application/json",
			},
		],
	},
	"google-drive": {
		serverName: "google-drive",
		lastUpdated: "2026-01-02",
		tools: [
			{
				name: "list_files",
				description: "List files and folders in Google Drive",
				inputSchema: {
					type: "object",
					properties: {
						query: { type: "string", description: "Search query to filter files (e.g., 'name contains \"report\"')" },
						pageSize: { type: "number", description: "Maximum number of files to return" },
						pageToken: { type: "string", description: "Token for pagination" },
					},
				},
			},
			{
				name: "get_file",
				description: "Get metadata and content of a file by ID",
				inputSchema: {
					type: "object",
					properties: {
						fileId: { type: "string", description: "The ID of the file to retrieve" },
						fields: { type: "string", description: "Specific fields to include in the response" },
					},
					required: ["fileId"],
				},
			},
			{
				name: "create_file",
				description: "Create a new file in Google Drive",
				inputSchema: {
					type: "object",
					properties: {
						name: { type: "string", description: "Name of the file" },
						mimeType: { type: "string", description: "MIME type of the file (e.g., 'application/vnd.google-apps.document')" },
						content: { type: "string", description: "Content of the file to upload" },
						parents: { type: "array", items: { type: "string" }, description: "Parent folder IDs" },
					},
					required: ["name"],
				},
			},
			{
				name: "update_file",
				description: "Update file metadata and/or content",
				inputSchema: {
					type: "object",
					properties: {
						fileId: { type: "string", description: "The ID of the file to update" },
						name: { type: "string", description: "New name for the file" },
						content: { type: "string", description: "New content for the file" },
					},
					required: ["fileId"],
				},
			},
			{
				name: "delete_file",
				description: "Delete a file by ID",
				inputSchema: {
					type: "object",
					properties: {
						fileId: { type: "string", description: "The ID of the file to delete" },
					},
					required: ["fileId"],
				},
			},
			{
				name: "share_file",
				description: "Share a file with specific users or make it public",
				inputSchema: {
					type: "object",
					properties: {
						fileId: { type: "string", description: "The ID of the file to share" },
						emailAddress: { type: "string", description: "Email address of the user to share with" },
						role: { type: "string", enum: ["reader", "writer", "commenter"], description: "Permission level" },
						type: { type: "string", enum: ["user", "group", "domain", "anyone"], description: "Type of permission" },
					},
					required: ["fileId"],
				},
			},
			{
				name: "list_permissions",
				description: "List permissions for a file",
				inputSchema: {
					type: "object",
					properties: {
						fileId: { type: "string", description: "The ID of the file" },
					},
					required: ["fileId"],
				},
			},
		],
		resources: [
			{ uri: "gdrive://file/{file_id}", name: "Google Drive File", description: "Access a file in Google Drive", mimeType: "application/json" },
			{ uri: "gdrive://folder/{folder_id}", name: "Google Drive Folder", description: "Access a folder in Google Drive", mimeType: "application/json" },
		],
	},
	"gmail": {
		serverName: "gmail",
		lastUpdated: "2026-01-02",
		tools: [
			{
				name: "list_messages",
				description: "List messages in the user's mailbox",
				inputSchema: {
					type: "object",
					properties: {
						query: { type: "string", description: "Search query to filter messages (e.g., 'from:example@gmail.com')" },
						maxResults: { type: "number", description: "Maximum number of messages to return" },
						pageToken: { type: "string", description: "Token for pagination" },
					},
				},
			},
			{
				name: "get_message",
				description: "Get a specific message by ID",
				inputSchema: {
					type: "object",
					properties: {
						messageId: { type: "string", description: "The ID of the message to retrieve" },
						format: { type: "string", enum: ["full", "metadata", "minimal", "raw"], description: "Format of the message to return" },
					},
					required: ["messageId"],
				},
			},
			{
				name: "send_message",
				description: "Send an email message",
				inputSchema: {
					type: "object",
					properties: {
						to: { type: "string", description: "Recipient email address" },
						subject: { type: "string", description: "Email subject" },
						body: { type: "string", description: "Email body content" },
						threadId: { type: "string", description: "Thread ID to reply to" },
					},
					required: ["to", "subject", "body"],
				},
			},
			{
				name: "create_draft",
				description: "Create a draft message",
				inputSchema: {
					type: "object",
					properties: {
						to: { type: "string", description: "Recipient email address" },
						subject: { type: "string", description: "Email subject" },
						body: { type: "string", description: "Draft body content" },
					},
					required: ["to", "subject", "body"],
				},
			},
			{
				name: "list_threads",
				description: "List email threads (conversations)",
				inputSchema: {
					type: "object",
					properties: {
						query: { type: "string", description: "Search query to filter threads" },
						maxResults: { type: "number", description: "Maximum number of threads to return" },
					},
				},
			},
			{
				name: "get_thread",
				description: "Get a specific thread by ID",
				inputSchema: {
					type: "object",
					properties: {
						threadId: { type: "string", description: "The ID of the thread to retrieve" },
					},
					required: ["threadId"],
				},
			},
			{
				name: "list_labels",
				description: "List all labels in the user's mailbox",
				inputSchema: {
					type: "object",
					properties: {},
				},
			},
			{
				name: "modify_message",
				description: "Modify labels on a message (e.g., mark as read, archive, trash)",
				inputSchema: {
					type: "object",
					properties: {
						messageId: { type: "string", description: "The ID of the message to modify" },
						addLabelIds: { type: "array", items: { type: "string" }, description: "Label IDs to add" },
						removeLabelIds: { type: "array", items: { type: "string" }, description: "Label IDs to remove" },
					},
					required: ["messageId"],
				},
			},
		],
		resources: [
			{ uri: "gmail://message/{message_id}", name: "Gmail Message", description: "Access a Gmail message", mimeType: "application/json" },
			{ uri: "gmail://thread/{thread_id}", name: "Gmail Thread", description: "Access a Gmail conversation thread", mimeType: "application/json" },
		],
	},
	"snowflake": {
		serverName: "snowflake",
		lastUpdated: "2026-01-02",
		tools: [
			{
				name: "query_structured_data",
				description: "Query structured data using Cortex Analyst with semantic views",
				inputSchema: {
					type: "object",
					properties: {
						query: { type: "string", description: "Natural language query about the data" },
						semanticView: { type: "string", description: "Semantic view to use for the query" },
					},
					required: ["query"],
				},
			},
			{
				name: "search_unstructured_data",
				description: "Search and retrieve information from unstructured text data using Cortex Search",
				inputSchema: {
					type: "object",
					properties: {
						query: { type: "string", description: "Search query for unstructured data" },
						collection: { type: "string", description: "Collection name to search in" },
						limit: { type: "number", description: "Maximum number of results to return" },
					},
					required: ["query"],
				},
			},
			{
				name: "execute_sql",
				description: "Execute SQL queries on Snowflake databases",
				inputSchema: {
					type: "object",
					properties: {
						sql: { type: "string", description: "SQL query to execute" },
						database: { type: "string", description: "Database name" },
						schema: { type: "string", description: "Schema name" },
					},
					required: ["sql"],
				},
			},
			{
				name: "orchestrate_agent",
				description: "Orchestrate Cortex Agent to query both structured and unstructured data",
				inputSchema: {
					type: "object",
					properties: {
						task: { type: "string", description: "Task description for the agent" },
						context: { type: "object", description: "Additional context for the agent" },
					},
					required: ["task"],
				},
			},
		],
		resources: [
			{ uri: "snowflake://database/{database_name}", name: "Snowflake Database", description: "Access a Snowflake database", mimeType: "application/json" },
			{ uri: "snowflake://table/{database_name}/{schema_name}/{table_name}", name: "Snowflake Table", description: "Access a Snowflake table", mimeType: "application/json" },
		],
	},
	"dbt-labs": {
		serverName: "dbt-labs",
		lastUpdated: "2026-01-02",
		tools: [
			{
				name: "run",
				description: "Execute dbt run command to compile and run models",
				inputSchema: {
					type: "object",
					properties: {
						select: { type: "string", description: "Select specific models to run (dbt selection syntax)" },
						exclude: { type: "string", description: "Exclude specific models from run" },
						fullRefresh: { type: "boolean", description: "Perform full refresh of incremental models" },
					},
				},
			},
			{
				name: "test",
				description: "Execute dbt test command to run data tests",
				inputSchema: {
					type: "object",
					properties: {
						select: { type: "string", description: "Select specific models to test" },
					},
				},
			},
			{
				name: "compile",
				description: "Compile dbt models without executing them",
				inputSchema: {
					type: "object",
					properties: {
						select: { type: "string", description: "Select specific models to compile" },
					},
				},
			},
			{
				name: "build",
				description: "Run models and tests together",
				inputSchema: {
					type: "object",
					properties: {
						select: { type: "string", description: "Select specific models to build" },
					},
				},
			},
			{
				name: "query_semantic_layer",
				description: "Query dbt Semantic Layer metrics and dimensions",
				inputSchema: {
					type: "object",
					properties: {
						metric: { type: "string", description: "Metric name to query" },
						dimensions: { type: "array", items: { type: "string" }, description: "Dimensions to group by" },
						filters: { type: "object", description: "Filters to apply to the query" },
					},
					required: ["metric"],
				},
			},
			{
				name: "discover_models",
				description: "Discover dbt models, their lineage, and dependencies",
				inputSchema: {
					type: "object",
					properties: {
						select: { type: "string", description: "Select specific models to discover" },
					},
				},
			},
			{
				name: "execute_sql",
				description: "Execute SQL statements in dbt",
				inputSchema: {
					type: "object",
					properties: {
						sql: { type: "string", description: "SQL statement to execute" },
					},
					required: ["sql"],
				},
			},
			{
				name: "text_to_sql",
				description: "Generate SQL from natural language requests",
				inputSchema: {
					type: "object",
					properties: {
						text: { type: "string", description: "Natural language description of the SQL query needed" },
						context: { type: "object", description: "Additional context for SQL generation" },
					},
					required: ["text"],
				},
			},
			{
				name: "list_jobs",
				description: "List dbt Cloud jobs",
				inputSchema: {
					type: "object",
					properties: {
						environmentId: { type: "string", description: "Filter jobs by environment ID" },
					},
				},
			},
			{
				name: "trigger_job",
				description: "Trigger a dbt Cloud job",
				inputSchema: {
					type: "object",
					properties: {
						jobId: { type: "string", description: "Job ID to trigger" },
						cause: { type: "string", description: "Reason for triggering the job" },
					},
					required: ["jobId"],
				},
			},
		],
		resources: [
			{ uri: "dbt://model/{model_name}", name: "dbt Model", description: "Access a dbt model definition and metadata", mimeType: "application/json" },
			{ uri: "dbt://metric/{metric_name}", name: "dbt Metric", description: "Access a dbt Semantic Layer metric", mimeType: "application/json" },
		],
	},
	"dynatrace": {
		serverName: "dynatrace",
		lastUpdated: "2026-01-02",
		tools: [
			{
				name: "list_problems",
				description: "Retrieve all active problems within Dynatrace",
				inputSchema: {
					type: "object",
					properties: {
						additionalFilter: { type: "string", description: "DQL filter to refine the problem list" },
						maxProblemsToDisplay: { type: "number", description: "Maximum number of problems to display" },
					},
				},
			},
			{
				name: "list_vulnerabilities",
				description: "List all non-muted vulnerabilities detected by Dynatrace",
				inputSchema: {
					type: "object",
					properties: {
						additionalFilter: { type: "string", description: "DQL filter to narrow down vulnerabilities" },
						maxVulnerabilitiesToDisplay: { type: "number", description: "Maximum number of vulnerabilities to display" },
						riskScore: { type: "number", description: "Minimum risk score of vulnerabilities to list (default: 8.0)" },
					},
				},
			},
			{
				name: "execute_dql",
				description: "Execute Dynatrace Query Language (DQL) statements to retrieve logs, metrics, spans, and events",
				inputSchema: {
					type: "object",
					properties: {
						dqlStatement: { type: "string", description: "The DQL query to execute" },
					},
					required: ["dqlStatement"],
				},
			},
			{
				name: "verify_dql",
				description: "Validate the syntax and structure of a DQL statement",
				inputSchema: {
					type: "object",
					properties: {
						dqlStatement: { type: "string", description: "The DQL query to verify" },
					},
					required: ["dqlStatement"],
				},
			},
			{
				name: "get_entity_details",
				description: "Fetch detailed information about a monitored entity",
				inputSchema: {
					type: "object",
					properties: {
						entityId: { type: "string", description: "The unique identifier of the entity" },
					},
					required: ["entityId"],
				},
			},
			{
				name: "get_ownership",
				description: "Get detailed ownership information for one or multiple entities",
				inputSchema: {
					type: "object",
					properties: {
						entityIds: { type: "string", description: "Comma-separated list of entity IDs" },
					},
					required: ["entityIds"],
				},
			},
			{
				name: "generate_dql_from_natural_language",
				description: "Convert natural language queries into DQL statements using Davis CoPilot AI",
				inputSchema: {
					type: "object",
					properties: {
						text: { type: "string", description: "The natural language query" },
					},
					required: ["text"],
				},
			},
			{
				name: "explain_dql_in_natural_language",
				description: "Provide plain English explanations of complex DQL statements",
				inputSchema: {
					type: "object",
					properties: {
						dql: { type: "string", description: "The DQL statement to explain" },
					},
					required: ["dql"],
				},
			},
		],
		resources: [
			{ uri: "dynatrace://problem/{problem_id}", name: "Dynatrace Problem", description: "Access a Dynatrace problem", mimeType: "application/json" },
			{ uri: "dynatrace://entity/{entity_id}", name: "Dynatrace Entity", description: "Access a Dynatrace monitored entity", mimeType: "application/json" },
		],
	},
	"aws-knowledge": {
		serverName: "aws-knowledge",
		lastUpdated: "2026-01-02",
		tools: [
			{
				name: "search_documentation",
				description: "Search across all AWS documentation",
				inputSchema: {
					type: "object",
					properties: {
						query: { type: "string", description: "Search query for AWS documentation" },
						service: { type: "string", description: "Filter by AWS service name" },
						maxResults: { type: "number", description: "Maximum number of results to return" },
					},
					required: ["query"],
				},
			},
			{
				name: "read_documentation",
				description: "Retrieve and convert AWS documentation pages to markdown",
				inputSchema: {
					type: "object",
					properties: {
						url: { type: "string", description: "URL of the AWS documentation page" },
					},
					required: ["url"],
				},
			},
			{
				name: "recommend",
				description: "Get content recommendations for AWS documentation pages",
				inputSchema: {
					type: "object",
					properties: {
						url: { type: "string", description: "URL of the AWS documentation page" },
						maxResults: { type: "number", description: "Maximum number of recommendations to return" },
					},
					required: ["url"],
				},
			},
			{
				name: "list_regions",
				description: "Retrieve a list of all AWS regions with their identifiers and names",
				inputSchema: {
					type: "object",
					properties: {},
				},
			},
			{
				name: "get_regional_availability",
				description: "Retrieve AWS regional availability information for SDK service APIs and CloudFormation resources",
				inputSchema: {
					type: "object",
					properties: {
						service: { type: "string", description: "AWS service name" },
						resourceType: { type: "string", description: "CloudFormation resource type (optional)" },
					},
					required: ["service"],
				},
			},
		],
		resources: [
			{ uri: "aws://docs/{service}/{page}", name: "AWS Documentation Page", description: "Access an AWS documentation page", mimeType: "text/markdown" },
			{ uri: "aws://api/{service}", name: "AWS API Reference", description: "Access AWS API reference documentation", mimeType: "application/json" },
		],
	},
}

/**
 * Get static capabilities for a server
 */
export function getStaticCapabilities(serverName: string): StaticServerCapabilities | null {
	return STATIC_MCP_CAPABILITIES[serverName] || null
}

/**
 * Check if a server has static capabilities defined
 */
export function hasStaticCapabilities(serverName: string): boolean {
	return serverName in STATIC_MCP_CAPABILITIES
}
