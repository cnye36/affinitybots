export interface ConfigField {
  key: string; // e.g., "domain", "projectId", "organizationId"
  label: string; // e.g., "Domain", "Project ID", "Organization ID"
  placeholder?: string; // e.g., "your-store.myshopify.com"
  type?: 'text' | 'url' | 'number'; // input type, defaults to 'text'
  required?: boolean; // whether field is required, defaults to false
  description?: string; // help text for the field
}

export type ServerCategory =
  | "development"
  | "productivity"
  | "project-management"
  | "database"
  | "design"
  | "automation"
  | "web-scraping"
  | "search"
  | "monitoring"
  | "ecommerce"
  | "seo"
  | "finance"
  | "communication"
  | "social-media";

export interface OfficialMcpServerMeta {
  serverName: string;
  displayName: string;
  description?: string;
  logoUrl?: string; // Fallback for backward compatibility
  logoUrlLight?: string;
  logoUrlDark?: string;
  url: string; // HTTP MCP endpoint (may contain placeholders like {YOUR_DOMAIN})
  docsUrl?: string;
  authType: 'oauth' | 'pat' | 'api_key' | 'none'; // 'none' = no auth required, only config fields
  requiresSetup?: boolean;
  disabled?: boolean; // if true, hide Connect and show "coming soon"
  configFields?: ConfigField[]; // Additional configuration fields beyond API key
  apiKeyHeaderName?: string; // Custom header name for API key (default: "X-API-Key")
  category: ServerCategory; // Category for filtering and organizing servers
}

// Curated list of official MCP servers maintained by source vendors.
// Servers are automatically sorted alphabetically by displayName.

const _OFFICIAL_MCP_SERVERS_RAW: OfficialMcpServerMeta[] = [
  {
    serverName: "github",
    displayName: "GitHub",
    description:
      "Official GitHub MCP server. Connect to browse repos, issues, pull requests, and more using your GitHub account via OAuth.",
    // Public GitHub mark (light bg recommended) - using a more reliable URL
    logoUrlLight:
      "/integration-icons/github-mark.png",
    logoUrlDark:
      "/integration-icons/github-mark-white.png",
    // GitHub remote MCP endpoint (per GitHub docs)
    url: "https://api.githubcopilot.com/mcp/",
    docsUrl: "https://github.com/github/github-mcp-server",
    authType: "oauth",
    requiresSetup: true,
    category: "development",
  },
  {
    serverName: "hubspot",
    displayName: "HubSpot",
    description:
      "Official HubSpot MCP server. Connect your HubSpot account via OAuth to access CRM data and actions.",
    logoUrl:
      "/integration-icons/hubspot-icon.png",
    url: "https://mcp.hubspot.com",
    docsUrl: "https://developers.hubspot.com/docs",
    authType: "oauth",
    requiresSetup: false,
    category: "project-management",
  },
  {
    serverName: "notion",
    displayName: "Notion",
    description:
      "Official Notion MCP server. Connect to access your Notion workspaces, pages, databases, and more using your Notion account via OAuth.",
    logoUrl: "/integration-icons/notion-logo-no-background.png",
    // Confirmed endpoint for Notion MCP
    url: "https://mcp.notion.com/mcp",
    docsUrl: "https://developers.notion.com/docs",
    authType: "oauth",
    requiresSetup: true,
    category: "productivity",
  },
  {
    serverName: "google-drive",
    displayName: "Google Drive",
    description:
      "Access and manage your Google Drive files, folders, and permissions. Search files, create documents, upload content, and organize your Drive using your Google account via OAuth.",
    logoUrl: "/integration-icons/google-drive-icon.png",
    url: process.env.GOOGLE_DRIVE_MCP_URL || "http://localhost:3002/mcp",
    docsUrl: "https://developers.google.com/drive",
    authType: "oauth",
    requiresSetup: true,
    category: "productivity",
  },
  {
    serverName: "gmail",
    displayName: "Gmail",
    description:
      "Access and manage your Gmail emails, contacts, and permissions. Search emails, create drafts, send messages, and organize your inbox using your Google account via OAuth.",
    logoUrl: "/integration-icons/gmail-icon.png",
    url: process.env.GMAIL_MCP_URL || "http://localhost:3003/mcp",
    docsUrl: "https://developers.google.com/gmail",
    authType: "oauth",
    requiresSetup: true,
    category: "productivity",
  },
  // {
  //   serverName: "google-calendar",
  //   displayName: "Google Calendar",
  //   description:
  //     "Access and manage your Google Calendar events, schedules, and permissions. Create events, check availability, update meetings, and organize your calendar using your Google account via OAuth.",
  //   logoUrl: "/integration-icons/google-calendar-logo.png",
  //   url: process.env.GOOGLE_CALENDAR_MCP_URL || "http://google-calendar-mcp:3004",
  //   docsUrl: "https://developers.google.com/calendar",
  //   authType: "oauth",
  //   requiresSetup: true,
  // },
  // {
  //   serverName: "google-docs",
  //   displayName: "Google Docs",
  //   description:
  //     "Access and manage your Google Docs documents. Create, read, edit documents, and organize your Docs using your Google account via OAuth.",
  //   logoUrl: "/integration-icons/google-docs-logo.png",
  //   url: process.env.GOOGLE_DOCS_MCP_URL || "http://google-docs-mcp:3005",
  //   docsUrl: "https://developers.google.com/docs",
  //   authType: "oauth",
  //   requiresSetup: true,
  // },
  // {
  //   serverName: "google-sheets",
  //   displayName: "Google Sheets",
  //   description:
  //     "Access and manage your Google Sheets spreadsheets. Create, read, edit spreadsheets, manipulate data, and organize your Sheets using your Google account via OAuth.",
  //   logoUrl: "/integration-icons/google-sheets.png",
  //   url: process.env.GOOGLE_SHEETS_MCP_URL || "http://google-sheets-mcp:3006",
  //   docsUrl: "https://developers.google.com/sheets",
  //   authType: "oauth",
  //   requiresSetup: true,
  // },
  {
    serverName: "google-maps",
    displayName: "Google Maps",
    description:
      "Access and manage your Google Maps data. Search for places, get directions, and explore maps using your Google Maps API key.",
    logoUrl: "/integration-icons/google-maps-icon.png",
    url: "https://mapstools.googleapis.com/mcp",
    docsUrl: "https://developers.google.com/maps/ai/grounding-lite",
    authType: "api_key",
    apiKeyHeaderName: "X-Goog-Api-Key", // Google Maps requires this specific header
    requiresSetup: true,
    category: "search",
  },
  {
    serverName: "google-big-query",
    displayName: "Google Big Query",
    description:
      "Access and manage your Google Big Query data. Query and analyze your data using your Google Big Query API key.",
    logoUrl: "/integration-icons/google-big-query-icon.png",
    url: "bigquery.googleapis.com/mcp",
    docsUrl: "https://docs.cloud.google.com/bigquery/docs/use-bigquery-mcp",
    authType: "oauth",
    requiresSetup: true,
    category: "database",
  },
  {
    serverName: "supabase",
    displayName: "Supabase",
    description:
      "Official Supabase MCP server. Connect to your Supabase projects to manage databases, tables, migrations, and configurations. Design schemas, query data, and debug - all through natural language commands via OAuth.",
    logoUrl: "/integration-icons/supabase-icon-dark.png",
    url: "https://mcp.supabase.com/mcp",
    docsUrl: "https://supabase.com/docs/guides/getting-started/mcp",
    authType: "oauth",
    requiresSetup: true,
    category: "database",
  },
  {
    serverName: "canva",
    displayName: "Canva",
    description:
      "Official Canva MCP server. Connect to Canva to create and manage designs, templates, and assets.",
    logoUrl: "/integration-icons/canva-logo.png",
    url: "https://mcp.canva.com/mcp",
    docsUrl: "https://www.canva.com/help/mcp-agent-setup/",
    authType: "oauth",
    requiresSetup: true,
    category: "design",
  },
  {
    serverName: "slack",
    displayName: "Slack",
    description:
      "Official MCP Slack server. Send messages, manage channels, search conversations, upload files, and interact with your Slack workspace. Requires Slack bot token for authentication.",
    logoUrl: "/integration-icons/slack-icon.png",
    url: process.env.SLACK_MCP_URL || "http://localhost:3007",
    docsUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/slack",
    authType: "api_key",
    apiKeyHeaderName: "SLACK_BOT_TOKEN",
    requiresSetup: true,
    category: "communication",
  },
  {
    serverName: "context7",
    displayName: "Context7",
    description:
      "Connects to Context7.com's documentation database to provide up-to-date library and framework documentation with intelligent project ranking and customizable token limits.",
    logoUrl: "/integration-icons/context7-icon-green.png",
    url: "https://mcp.context7.com/mcp",
    docsUrl: "https://context7.com/docs/overview",
    authType: "api_key",
    requiresSetup: true,
    category: "development",
  },
  {
    serverName: "sentry",
    displayName: "Sentry",
    description:
      "Official Sentry MCP server. Access error tracking and performance monitoring data. Search issues, query projects, create DSNs, and use Seer AI to automatically fix issues. OAuth authentication with 16+ tool calls for comprehensive error management.",
    logoUrlDark: "/integration-icons/sentry-icon-dark.png",
    logoUrlLight: "/integration-icons/sentry-icon-light.png",
    url: "https://mcp.sentry.dev/mcp",
    docsUrl: "https://docs.sentry.io/product/sentry-mcp/",
    authType: "oauth",
    requiresSetup: true,
    category: "monitoring",
  },
  {
    serverName: "zapier",
    displayName: "Zapier",
    description:
      "Official Zapier MCP server. Connect to 8,000+ apps and 30,000+ actions through a single integration. Automate workflows across your favorite tools including Gmail, Slack, Google Sheets, and thousands more. OAuth or API key authentication.",
    logoUrl: "/integration-icons/zapier-icon.jpeg",
    url: "https://mcp.zapier.com/mcp",
    docsUrl: "https://zapier.com/mcp",
    authType: "oauth",
    requiresSetup: true,
    category: "automation",
  },
  {
    serverName: "make",
    displayName: "Make",
    description:
      "Official Make MCP server. Connect to Make to create and manage workflows across your favorite tools.",
    logoUrl: "/integration-icons/make-icon.png",
    url: "https://mcp.make.com",
    docsUrl: "https://developers.make.com/mcp-server",
    authType: "oauth",
    requiresSetup: true,
    category: "automation",
  },
  {
    serverName: "figma",
    displayName: "Figma Dev Mode",
    description:
      "Official Figma MCP server. Connect to Figma to retrieve design files and components. Requires Figma Dev account.",
    logoUrl: "/integration-icons/figma-icon.png",
    url: "https://mcp.figma.com/mcp",
    docsUrl: "https://developers.figma.com/docs/figma-mcp-server/",
    authType: "oauth",
    requiresSetup: true,
    category: "design",
  },
  {
    serverName: "linear",
    displayName: "Linear",
    description:
      "Integrates with Linear to enable direct access to issues, projects, and data for automating tasks and managing resources without context switching.",
    logoUrlLight: "/integration-icons/linear-symbol-light.png",
    logoUrlDark: "/integration-icons/linear-symbol-dark.png",
    url: "https://mcp.linear.app/mcp",
    docsUrl: "https://linear.app/docs/mcp",
    authType: "oauth",
    requiresSetup: true,
    category: "project-management",
  },
  {
    serverName: "firecrawl",
    displayName: "FireCrawl",
    description:
      "Official FireCrawl MCP server by Mendable. Advanced web scraping and crawling capabilities with structured data extraction. Transform any website into clean, AI-ready markdown or structured data. Requires FireCrawl API key.",
    logoUrl: "https://www.firecrawl.dev/favicon.ico",
    url: process.env.FIRECRAWL_MCP_URL || "https://mcp.firecrawl.dev",
    docsUrl: "https://docs.firecrawl.dev/mcp-server",
    authType: "api_key",
    requiresSetup: true,
    category: "web-scraping",
  },
  {
    serverName: "jira-confluence",
    displayName: "Jira & Confluence",
    description:
      "Official Jira & Confluence MCP server. Connect to Jira & Confluence to manage your projects and documents.",
    // Use local icon file for better quality (download Atlassian icon and add to /public/integration-icons/)
    // Alternative: "https://www.atlassian.com/favicon.ico" (small favicon, not ideal for display)
    logoUrl: "/integration-icons/Atlassian-icon.png",
    url: "https://mcp.atlassian.com/v1/mcp",
    docsUrl: "https://developer.atlassian.com/cloud/jira/platform/mcp-server/",
    authType: "oauth",
    requiresSetup: true,
    category: "project-management",
  },
  {
    serverName: "apify",
    displayName: "Apify Actors",
    description:
      "Official Apify MCP server. Connect to Apify to manage your web scraping and automation tasks.",
    logoUrl: "/integration-icons/apify-symbol-colors.png",
    url: "https://actors-mcp-server.apify.actor/sse?token={apiKey}&actors={actorNames}",
    docsUrl: "https://docs.apify.com/platform/integrations/mcp",
    authType: "oauth",
    requiresSetup: true,
    category: "web-scraping",
  },
  {
    serverName: "todoist",
    displayName: "Todoist",
    description:
      "Official Todoist MCP server. Connect to Todoist to manage your tasks and projects.",
    logoUrl: "/integration-icons/todoist-icon.png",
    url: "https://ai.todoist.net/mcp",
    docsUrl: "https://developer.todoist.com/api/v1/#tag/Todoist-MCP",
    authType: "oauth",
    requiresSetup: true,
    category: "project-management",
  },
  {
    serverName: "exa",
    displayName: "Exa",
    description:
      "Exa is a search engine built for AI. Connect to Exa' MCP server to retrieve structured search results from the web.",
    logoUrl: "/integration-icons/exa-color.png",
    url: "https://mcp.exa.ai/mcp",
    docsUrl: "https://docs.exa.ai/reference/getting-started",
    authType: "api_key",
    requiresSetup: true,
    category: "search",
  },
  {
    serverName: "browserbase",
    displayName: "Browserbase",
    description:
      "Official Browserbase MCP server. Cloud-based browser automation powered by Stagehand. Remotely control browsers for testing, scraping, and visual analysis without local infrastructure. Requires Browserbase API key.",
    logoUrl: "https://www.browserbase.com/favicon.ico",
    url: process.env.BROWSERBASE_MCP_URL || "https://api.browserbase.com/mcp",
    docsUrl: "https://docs.browserbase.com/integrations/mcp/introduction",
    authType: "api_key",
    requiresSetup: true,
    category: "web-scraping",
  },
  {
    serverName: "ahrefs",
    displayName: "Ahrefs",
    description:
      "Official Hrefs MCP server. Analyze SEO data for any domain. Must have an Ahrefs Lite plan or higher to use this server.",
    logoUrl: "/integration-icons/Ahrefs-Logo-Compact-Blue.png",
    url: "https://api.ahrefs.com/mcp/mcp",
    docsUrl: "https://docs.ahrefs.com/docs/mcp/reference/introduction",
    authType: "oauth",
    requiresSetup: true,
    category: "seo",
  },
  {
    serverName: "semrush",
    displayName: "Semrush",
    description:
      "Official Semrush MCP server. Connect to Semrush to manage your SEO data and analysis.",
    logoUrl: "/integration-icons/semrush-icon.png",
    url: "https://mcp.semrush.com/v1/mcp",
    docsUrl: "https://developer.semrush.com/api/basics/semrush-mcp/",
    authType: "api_key",
    requiresSetup: true,
    category: "seo",
  },
  {
    serverName: "prisma-postgres",
    displayName: "Prisma Postgres",
    description:
      "Official Prisma MCP server. Manage Prisma Postgres databases with AI assistance. Create backups, generate connection strings, and restore databases. Integrates with Prisma Console for enterprise database operations.",
    logoUrl: "https://www.prisma.io/images/favicon-32x32.png",
    url: "https://mcp.prisma.io/mcp",
    docsUrl: "https://www.prisma.io/docs/postgres/integrations/mcp-server",
    authType: "api_key",
    requiresSetup: true,
    category: "database",
  },
  {
    serverName: "snowflake",
    displayName: "Snowflake",
    description:
      "Official Snowflake MCP server. Fully managed remote server providing secure access to Snowflake's data platform. Query structured data with Cortex Analyst, search unstructured data, and orchestrate AI agents with enterprise-grade security.",
    logoUrl: "/integration-icons/Snowflake-icon.png",
    url: process.env.SNOWFLAKE_MCP_URL || "https://mcp.snowflake.com",
    docsUrl: "https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents-mcp",
    authType: "oauth",
    requiresSetup: true,
    category: "database",
  },
  {
    serverName: "postman",
    displayName: "Postman",
    description:
      "Connect to Postman to manage your API requests and responses. This is the Postman Minimal server, refer to documentation on capabilities.",
    logoUrl: "/integration-icons/postman-icon.png",
    url: "https://mcp.postman.com/minimal",
    docsUrl: "https://www.postman.com/postman/postman-public-workspace/collection/681dc649440b35935978b8b7",
    authType: "api_key",
    requiresSetup: true,
    category: "development",
  },
  {
    serverName: "asana",
    displayName: "Asana",
    description:
      "Official Asana MCP server. Connect to Asana to manage your projects and tasks.",
    logoUrl: "https://asana.com/favicon.ico",
    url: "https://mcp.asana.com/sse",
    docsUrl: "https://developers.asana.com/docs/mcp-server",
    authType: "oauth",
    requiresSetup: true,
    category: "project-management",
  },
  {
    serverName: "intercom",
    displayName: "Intercom",
    description:
      "Official Intercom MCP server. Connect to Intercom to manage your customers and conversations.",
    logoUrl: "/integration-icons/intercom-icon.png",
    url: "https://mcp.intercom.com/mcp",
    docsUrl: "https://developers.intercom.com/docs/guides/mcp",
    authType: "oauth",
    requiresSetup: true,
    category: "communication",
  },
  {
    serverName: "dbt-labs",
    displayName: "dbt Labs",
    description:
      "Official dbt Labs MCP server. Connect AI workflows to dbt Cloud for data transformation. Execute CLI commands, access Discovery API, query Semantic Layer, and manage jobs through the Admin API. Remote cloud-hosted server.",
    logoUrl: "/integration-icons/dbt-bit-standalone.png",
    url: process.env.DBT_MCP_URL || "https://mcp.dbt.com",
    docsUrl: "https://docs.getdbt.com/docs/dbt-ai/about-mcp",
    authType: "api_key",
    requiresSetup: true,
    category: "database",
  },
  {
    serverName: "huggingface",
    displayName: "HuggingFace",
    description:
      "Official HuggingFace MCP server. Connect to HuggingFace to manage your models and datasets.",
    logoUrl: "https://huggingface.co/favicon.ico",
    url: "https://huggingface.co/mcp",
    docsUrl: "https://huggingface.co/docs/hub/en/hf-mcp-server",
    authType: "api_key",
    requiresSetup: true,
    category: "development",
  },
  {
    serverName: "dynatrace",
    displayName: "Dynatrace",
    description:
      "Official Dynatrace MCP server. Real-time observability and monitoring data for production environments. Fetch metrics, logs, anomalies, and security events directly into your development workflow. Requires Dynatrace API token.",
    logoUrlDark: "/integration-icons/Dynatrace-icon-dark.png",
    logoUrlLight: "/integration-icons/Dynatrace-icon-light.png",
    url: process.env.DYNATRACE_MCP_URL || "https://mcp.dynatrace.com",
    docsUrl: "https://github.com/dynatrace-oss/dynatrace-mcp",
    authType: "api_key",
    requiresSetup: true,
    category: "monitoring",
  },
  {
    serverName: "aws-knowledge",
    displayName: "AWS Knowledge",
    description:
      "Official AWS MCP server. Fully managed remote server providing up-to-date AWS documentation, API references, code samples, and regional availability information. Search AWS docs and get service recommendations through natural language.",
    logoUrl: "/integration-icons/amazon-icon.png",
    url: "https://knowledge-mcp.global.api.aws",
    docsUrl: "https://awslabs.github.io/mcp/servers/aws-knowledge-mcp-server",
    authType: "api_key",
    requiresSetup: true,
    category: "development",
  },
  {
    serverName: "clickup",
    displayName: "Clickup",
    description:
      "Official Clickup MCP server. Connect to Clickup to manage your tasks and projects.",
    logoUrl: "/integration-icons/clickup-icon.png",
    url: "https://mcp.clickup.com/mcp",
    docsUrl: "https://developer.clickup.com/docs/connect-an-ai-assistant-to-clickups-mcp-server",
    authType: "oauth",
    requiresSetup: true,
    category: "project-management",
  },
  {
    serverName: "brave-search",
    displayName: "Brave Search",
    description:
      "Official Brave Search MCP server. Comprehensive web search with rich result types, image search, news, and local business discovery. Privacy-focused search API with AI-generated descriptions for places. Requires Brave API key.",
    logoUrl: "https://brave.com/static-assets/images/brave-logo-sans-text.svg",
    url: process.env.BRAVE_SEARCH_MCP_URL || "https://mcp.brave.com",
    docsUrl: "https://brave.com/search/api/",
    authType: "api_key",
    requiresSetup: true,
    category: "search",
  },
  {
    serverName: "tavily-search",
    displayName: "Tavily Search",
    description:
      "Official Tavily Search MCP server. Comprehensive web search with rich result types, image search, news, and local business discovery. Privacy-focused search API with AI-generated descriptions for places. Requires Tavily API key.",
    logoUrl: "/integration-icons/tavily-color.svg",
    url: "https://mcp.tavily.com/mcp/?tavilyApiKey={apiKey}",
    docsUrl: "https://docs.tavily.com/documentation/mcp",
    authType: "api_key",
    requiresSetup: true,
    category: "search",
  },
  {
    serverName: "pipeboard",
    displayName: "Pipeboard Meta Ads",
    description:
      "Official Pipeboard MCP server. Connect to Pipeboard to manage Facebook and Instagram ad campaigns performance analysis and optimization.",
    logoUrl: "/integration-icons/pipeboard-icon.png",
    url: "https://mcp.pipeboard.co/meta-ads-mcp",
    docsUrl: "https://pipeboard.co/guides/meta-ads-mcp-server",
    authType: "api_key",
    requiresSetup: true,
    category: "ecommerce",
  },
  {
    serverName: "lunarcrush",
    displayName: "Lunarcrush",
    description:
      "Official Lunarcrush MCP server. Connect to Lunarcrush to manage your crypto market data and analysis.",
    logoUrl: "/integration-icons/lunarcrush-icon.png",
    url: "https://lunarcrush.ai/mcp?key={apiKey}",
    docsUrl: "https://lunarcrush.com/mcpserver",
    authType: "api_key",
    requiresSetup: true,
    category: "finance",
  },
  {
    serverName: "shopify-storefront",
    displayName: "Shopify Storefront",
    description:
      "Official Shopify Storefront MCP server. Connect to Shopify to manage your storefront and products. No authentication required - just provide your store domain.",
    logoUrl: "/integration-icons/shopify-icon.png",
    url: "https://{domain}/api/mcp",
    docsUrl: "https://shopify.dev/docs/apps/build/storefront-mcp/servers/storefront",
    authType: "none",
    requiresSetup: true,
    category: "ecommerce",
    configFields: [
      {
        key: "domain",
        label: "Shopify Domain",
        placeholder: "your-store.myshopify.com",
        type: "text",
        required: true,
        description: "Your Shopify store domain (without https://)",
      },
    ],
  },
  {
    serverName: "monday",
    displayName: "Monday.com",
    description:
      "Integrates with monday.com API to enable direct access to boards, workflows, and data for automating tasks and managing resources without context switching.",
    logoUrl: "/integration-icons/monday.com-icon.png",
    url: "https://mcp.monday.com/mcp",
    docsUrl: "https://monday.com/w/mcp",
    authType: "oauth",
    requiresSetup: true,
    category: "project-management",
  },
  {
    serverName: "supermemory",
    displayName: "Supermemory",
    description:
      "Official Supermemory MCP server. Connect to Supermemory to manage your memory and data. Requires Supermemory API key.",
    logoUrlLight: "/integration-icons/supermemory-icon-light.png",
    logoUrlDark: "/integration-icons/supermemory-icon-dark.png",
    url: "https://mcp.supermemory.ai/mcp",
    docsUrl: "https://supermemory.ai/docs/supermemory-mcp/introduction",
    authType: "api_key",
    requiresSetup: true,
    category: "productivity",
  },
  {
    serverName: "oktopost",
    displayName: "Oktopost",
    description:
      "Official Oktopost MCP server. Connect to Oktopost to manage your social media and content. Requires Account ID, API Token, and Region from Oktopost (My Profile → API).",
    logoUrl: "/integration-icons/oktopost-social-preview-transparent.png",
    url: "https://mcp.oktopost.com",
    docsUrl: "https://help.oktopost.com/en/articles/628-how-to-connect-with-oktopost-s-mcp-server",
    authType: "api_key",
    requiresSetup: true,
    category: "social-media",
    configFields: [
      {
        key: "accountId",
        label: "Account ID",
        placeholder: "Your Oktopost Account ID",
        type: "text",
        required: true,
        description: "Found in Oktopost under My Profile → API",
      },
      {
        key: "apiToken",
        label: "API Token",
        placeholder: "Your Oktopost API Token",
        type: "text",
        required: true,
        description: "Found in Oktopost under My Profile → API",
      },
      {
        key: "region",
        label: "Region",
        placeholder: "us",
        type: "text",
        required: false,
        description: "Your Oktopost region (default: us)",
      },
    ],
  },
  
  {
    serverName: "coinapi-realtime-exchange",
    displayName: "CoinAPI Real-Time Exchange Rates",
    description:
      "Official CoinAPI MCP server. Get real-time exchange rates for 100+ cryptocurrencies and fiat currencies. Requires CoinAPI API key.",
    logoUrl: "/integration-icons/coinapi-icon.svg",
    url: "https://mcp-realtime.exrates.coinapi.io/",
    docsUrl: "https://docs.coinapi.io/general/mcp-servers",
    authType: "api_key",
    requiresSetup: true,
    category: "finance",
  },
  {
    serverName: "coinapi-finfeed-stock",
    displayName: "CoinAPI FinFeed Stock API",
    description:
      "Official CoinAPI MCP server. Get real-time stock data for 100+ stocks. Requires CoinAPI API key.",
    logoUrl: "/integration-icons/coinapi-icon.svg",
    url: "https://mcp-historical.stock.finfeedapi.com/mcp",
    docsUrl: "https://docs.coinapi.io/general/mcp-servers",
    authType: "api_key",
    requiresSetup: true,
    category: "finance",
  },
  {
    serverName: "coinapi-finfeed-forex",
    displayName: "CoinAPI FinFeed Forex API",
    description:
      "Official CoinAPI MCP server. Get real-time forex data for all major currencies. Requires CoinAPI API key.",
    logoUrl: "/integration-icons/coinapi-icon.svg",
    url: "https://mcp-realtime.fx.finfeedapi.com/mcp",
    docsUrl: "https://docs.coinapi.io/general/mcp-servers",
    authType: "api_key",
    requiresSetup: true,
    category: "finance",
  },
  {
    serverName: "coinapi-finfeed-crypto",
    displayName: "CoinAPI Market Data",
    description:
      "Official CoinAPI MCP server. Get real-time market data for all major assets. Requires CoinAPI API key.",
    logoUrl: "/integration-icons/coinapi-icon.svg",
    url: "https://mcp.md.coinapi.io/mcp",
    docsUrl: "https://docs.coinapi.io/general/mcp-servers",
    authType: "api_key",
    requiresSetup: true,
    category: "finance",
  },
  {
    serverName: "alphavantage",
    displayName: "Alpha Vantage",
    description:
      "Official Alpha Vantage MCP server. Get real-time stock data for all major stocks. Requires Alpha Vantage API key.",
    logoUrl: "/integration-icons/alphavantage-icon-transparent.png",
    url: "https://mcp.alphavantage.co/mcp?apikey={apiKey}",
    docsUrl: "https://mcp.alphavantage.co/",
    authType: "api_key",
    requiresSetup: true,
    category: "finance",
  },
  {
    serverName: "playwright",
    displayName: "Playwright",
    description:
      "Official Microsoft Playwright MCP server. Browser automation and testing with Chromium, Firefox, and WebKit. Navigate pages, take screenshots, fill forms, execute JavaScript, and interact with web content programmatically.",
    logoUrl: "/integration-icons/playwright-icon-1.png",
    url: process.env.PLAYWRIGHT_MCP_URL || "http://localhost:3004",
    docsUrl: "https://playwright.dev/",
    authType: "none",
    requiresSetup: false,
    category: "web-scraping",
  },
  // {
  //   serverName: "fetch",
  //   displayName: "Fetch (Web Requests)",
  //   description:
  //     "Official MCP fetch server. Make HTTP requests to external APIs and websites. Fetch JSON data, HTML content, download files, and integrate with REST APIs. Supports GET, POST, PUT, DELETE methods with custom headers and authentication.",
  //   logoUrl: "/integration-icons/fetch-icon.svg",
  //   url: process.env.FETCH_MCP_URL || "http://localhost:3006",
  //   docsUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/fetch",
  //   authType: "none",
  //   requiresSetup: false,
  //   category: "web-scraping",
  // },
  
  {
    serverName: "puppeteer",
    displayName: "Puppeteer",
    description:
      "Official MCP Puppeteer server. Headless browser automation powered by Puppeteer. Take screenshots, generate PDFs, scrape web content, fill forms, and automate browser interactions. Alternative to Playwright with different browser control capabilities.",
    logoUrl: "/integration-icons/puppeteer-icon.svg",
    url: process.env.PUPPETEER_MCP_URL || "http://localhost:3007",
    docsUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer",
    authType: "none",
    requiresSetup: false,
    category: "web-scraping",
  },
  {
    serverName: "pinecone",
    displayName: "Pinecone",
    description:
      "Official Pinecone MCP server. Connect to Pinecone vector databases to create indexes, upsert vectors, query data, and manage your vector store. Requires Pinecone API key.",
    logoUrl: "/integration-icons/pinecone-icon.png",
    url: process.env.PINECONE_MCP_URL || "http://localhost:3008",
    docsUrl: "https://docs.pinecone.io/guides/operations/mcp-server",
    authType: "api_key",
    requiresSetup: true,
    category: "database",
  }

];

// Sort servers alphabetically by displayName (case-insensitive)
export const OFFICIAL_MCP_SERVERS: OfficialMcpServerMeta[] = [..._OFFICIAL_MCP_SERVERS_RAW].sort((a, b) =>
  a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" })
);

export function findOfficialServer(serverName: string): OfficialMcpServerMeta | undefined {
  return OFFICIAL_MCP_SERVERS.find((s) => s.serverName === serverName);
}



