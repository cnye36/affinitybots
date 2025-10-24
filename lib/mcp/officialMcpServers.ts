export interface OfficialMcpServerMeta {
  qualifiedName: string;
  displayName: string;
  description?: string;
  logoUrl?: string;
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
    qualifiedName: "github",
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
    qualifiedName: "hubspot",
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
    qualifiedName: "notion",
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
    qualifiedName: "google-drive",
    displayName: "Google Drive",
    description:
      "Access and manage your Google Drive files, folders, and permissions. Search files, create documents, upload content, and organize your Drive using your Google account via OAuth.",
    logoUrl: "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png",
    url: process.env.GOOGLE_DRIVE_MCP_URL || "http://localhost:3002",
    docsUrl: "https://developers.google.com/drive",
    authType: "oauth",
    requiresSetup: true,
  },
];

export function findOfficialServer(qualifiedName: string): OfficialMcpServerMeta | undefined {
  return OFFICIAL_MCP_SERVERS.find((s) => s.qualifiedName === qualifiedName);
}


