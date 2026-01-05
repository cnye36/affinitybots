export interface OfficialMcpServerMeta {
  serverName: string;
  displayName: string;
  description?: string;
  logoUrl?: string; // Fallback for backward compatibility
  logoUrlLight?: string;
  logoUrlDark?: string;
  url: string; // HTTP MCP endpoint
  docsUrl?: string;
  authType: 'oauth' | 'pat' | 'api_key';
  requiresSetup?: boolean;
  disabled?: boolean; // if true, hide Connect and show "coming soon"
}

// Curated list of official MCP servers maintained by source vendors.
// Start with GitHub; more can be appended as we add first‑party options.
export const OFFICIAL_MCP_SERVERS: OfficialMcpServerMeta[] = [
  {
    serverName: "github",
    displayName: "GitHub",
    description:
      "Official GitHub MCP server. Connect to browse repos, issues, pull requests, and more using your GitHub account via OAuth.",
    // Public GitHub mark (light bg recommended) - using a more reliable URL
    logoUrl:
      "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
    // GitHub remote MCP endpoint (per GitHub docs)
    url: "https://api.githubcopilot.com/mcp/",
    docsUrl: "https://github.com/github/github-mcp-server",
    authType: "oauth",
    requiresSetup: true,
  },
  {
    serverName: "hubspot",
    displayName: "HubSpot",
    description:
      "Official HubSpot MCP server. Connect your HubSpot account via OAuth to access CRM data and actions.",
    logoUrl:
      "https://legal.hubspot.com/hubfs/guidelines_the-sprocket.svg",
    // URL can be overridden at runtime using NEXT_PUBLIC_HUBSPOT_MCP_URL
    url: "https://mcp.hubspot.com",
    docsUrl: "https://developers.hubspot.com/docs",
    authType: "oauth",
    requiresSetup: true,
  },
  {
    serverName: "notion",
    displayName: "Notion",
    description:
      "Official Notion MCP server. Connect to access your Notion workspaces, pages, databases, and more using your Notion account via OAuth.",
    logoUrl: "https://www.notion.so/images/favicon.ico",
    // Confirmed endpoint for Notion MCP
    url: "https://mcp.notion.com/mcp",
    docsUrl: "https://developers.notion.com/docs",
    authType: "oauth",
    requiresSetup: true,
  },
  {
    serverName: "google-drive",
    displayName: "Google Drive",
    description:
      "Access and manage your Google Drive files, folders, and permissions. Search files, create documents, upload content, and organize your Drive using your Google account via OAuth.",
    logoUrl: "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png",
    url: process.env.GOOGLE_DRIVE_MCP_URL || "http://localhost:3002",
    docsUrl: "https://developers.google.com/drive",
    authType: "oauth",
    requiresSetup: true,
  },
  {
    serverName: "gmail",
    displayName: "Gmail",
    description:
      "Access and manage your Gmail emails, contacts, and permissions. Search emails, create drafts, send messages, and organize your inbox using your Google account via OAuth.",
    logoUrl: "https://ssl.gstatic.com/ui/v1/icons/mail/images/favicon5.ico",
    url: process.env.GMAIL_MCP_URL || "http://localhost:3003",
    docsUrl: "https://developers.google.com/gmail",
    authType: "oauth",
    requiresSetup: true,
  },
  {
    serverName: "google-calendar",
    displayName: "Google Calendar",
    description:
      "Access and manage your Google Calendar events, schedules, and permissions. Create events, check availability, update meetings, and organize your calendar using your Google account via OAuth.",
    logoUrl: "https://ssl.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_31_2x.png",
    url: process.env.GOOGLE_CALENDAR_MCP_URL || "http://google-calendar-mcp:3004",
    docsUrl: "https://developers.google.com/calendar",
    authType: "oauth",
    requiresSetup: true,
  },
  {
    serverName: "google-docs",
    displayName: "Google Docs",
    description:
      "Access and manage your Google Docs documents. Create, read, edit documents, and organize your Docs using your Google account via OAuth.",
    logoUrl: "https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico",
    url: process.env.GOOGLE_DOCS_MCP_URL || "http://google-docs-mcp:3005",
    docsUrl: "https://developers.google.com/docs",
    authType: "oauth",
    requiresSetup: true,
  },
  {
    serverName: "google-sheets",
    displayName: "Google Sheets",
    description:
      "Access and manage your Google Sheets spreadsheets. Create, read, edit spreadsheets, manipulate data, and organize your Sheets using your Google account via OAuth.",
    logoUrl: "https://ssl.gstatic.com/docs/spreadsheets/favicon3.ico",
    url: process.env.GOOGLE_SHEETS_MCP_URL || "http://google-sheets-mcp:3006",
    docsUrl: "https://developers.google.com/sheets",
    authType: "oauth",
    requiresSetup: true,
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
  },
  {
    serverName: "zapier",
    displayName: "Zapier",
    description:
      "Official Zapier MCP server. Connect to 8,000+ apps and 30,000+ actions through a single integration. Automate workflows across your favorite tools including Gmail, Slack, Google Sheets, and thousands more. OAuth or API key authentication.",
    logoUrl: "/integration-icons/zapier-icon.jpeg",
    url: process.env.ZAPIER_MCP_URL || "https://mcp.zapier.com",
    docsUrl: "https://zapier.com/mcp",
    authType: "oauth",
    requiresSetup: true,
  },
  {
    serverName: "figma",
    displayName: "Figma",
    description:
      "Official Figma MCP server. Connect to Figma to retrieve design files and components. Requires Figma Dev account.",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg",
    url: "https://mcp.figma.com/mcp",
    docsUrl: "https://developers.figma.com/docs/figma-mcp-server/",
    authType: "oauth",
    requiresSetup: true,
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
  },

];

export function findOfficialServer(serverName: string): OfficialMcpServerMeta | undefined {
  return OFFICIAL_MCP_SERVERS.find((s) => s.serverName === serverName);
}



