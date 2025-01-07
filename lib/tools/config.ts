import { Search, Globe } from "lucide-react";
import { IconType } from "react-icons";
import { FaTwitter, FaSlack } from "react-icons/fa";
import { SiNotion } from "react-icons/si";

export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  icon: IconType;
  category: "data" | "content" | "automation" | "analysis";
  isCore?: boolean;
  requiresAuth?: boolean;
  authType?: "oauth" | "api_key" | "custom";
  oauthConfig?: {
    provider: string;
    scopes: string[];
    redirectUri?: string;
  };
  requiredEnvVars?: string[];
  configOptions?: {
    name: string;
    type: "text" | "number" | "boolean";
    required?: boolean;
    default?: string | number | boolean;
    description?: string;
    isSecret?: boolean;
  }[];
}

export const AVAILABLE_TOOLS: ToolConfig[] = [
  {
    id: "web_search",
    name: "Search Web",
    description:
      "Search and retrieve information from the internet using Tavily API",
    icon: Search,
    category: "data",
    isCore: true,
    requiresAuth: true,
    authType: "api_key",
    requiredEnvVars: ["TAVILY_API_KEY"],
    configOptions: [
      {
        name: "maxResults",
        type: "number",
        required: false,
        default: 3,
        description: "Maximum number of search results to return",
      },
    ],
  },
  {
    id: "web_scraper",
    name: "Scrape Webpage",
    description: "Extract content and data from any webpage",
    icon: Globe,
    category: "data",
    configOptions: [
      {
        name: "selector",
        type: "text",
        required: false,
        default: "body",
        description: "CSS selector to target specific content",
      },
      {
        name: "headers",
        type: "text",
        required: false,
        description: "Custom headers for the request (JSON format)",
      },
    ],
  },
  {
    id: "notion",
    name: "Notion Integration",
    description: "Interact with Notion workspaces and databases",
    icon: SiNotion,
    category: "automation",
    requiresAuth: true,
    authType: "oauth",
    oauthConfig: {
      provider: "notion",
      scopes: [
        "read_content",
        "write_content",
        "read_databases",
        "write_databases",
      ],
      redirectUri: "/api/oauth/notion/callback",
    },
    configOptions: [
      {
        name: "workspace",
        type: "text",
        required: true,
        description: "Notion workspace to connect to",
      },
    ],
  },
  {
    id: "slack",
    name: "Slack Integration",
    description: "Send messages and interact with Slack channels",
    icon: FaSlack,
    category: "automation",
    requiresAuth: true,
    authType: "oauth",
    oauthConfig: {
      provider: "slack",
      scopes: ["chat:write", "channels:read", "channels:join"],
      redirectUri: "/api/oauth/slack/callback",
    },
    configOptions: [
      {
        name: "defaultChannel",
        type: "text",
        required: false,
        description: "Default channel to post messages to",
      },
    ],
  },
  {
    id: "notion_add_row",
    name: "Add Row to Notion Database",
    description: "Add a new row to a specified Notion database",
    icon: SiNotion,
    category: "automation",
    requiresAuth: true,
    requiredEnvVars: ["NOTION_API_KEY", "NOTION_DATABASE_ID"],
    configOptions: [
      {
        name: "databaseId",
        type: "text",
        required: true,
        description: "The ID of the Notion database to use",
      },
      {
        name: "authToken",
        type: "text",
        required: true,
        description: "Authentication token for Notion API",
      },
    ],
  },
  {
    id: "notion_update_row",
    name: "Update Row in Notion Database",
    description: "Update an existing row in a Notion database",
    icon: SiNotion,
    category: "automation",
    requiresAuth: true,
    requiredEnvVars: ["NOTION_API_KEY", "NOTION_DATABASE_ID"],
    configOptions: [
      {
        name: "databaseId",
        type: "text",
        required: true,
        description: "The ID of the Notion database to use",
      },
      {
        name: "rowId",
        type: "text",
        required: true,
        description: "The ID of the row to update",
      },
      {
        name: "authToken",
        type: "text",
        required: true,
        description: "Authentication token for Notion API",
      },
    ],
  },
  {
    id: "twitter_post",
    name: "Post Tweet",
    description: "Create and post a tweet on Twitter",
    icon: FaTwitter,
    category: "content",
    requiresAuth: true,
    requiredEnvVars: ["TWITTER_API_KEY", "TWITTER_API_SECRET"],
    configOptions: [
      {
        name: "apiKey",
        type: "text",
        required: true,
        description: "Twitter API Key",
      },
      {
        name: "apiSecret",
        type: "text",
        required: true,
        description: "Twitter API Secret",
      },
      {
        name: "accessToken",
        type: "text",
        required: false,
        description: "Twitter Access Token",
      },
      {
        name: "accessSecret",
        type: "text",
        required: false,
        description: "Twitter Access Secret",
      },
    ],
  },
];
