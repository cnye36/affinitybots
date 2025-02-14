import { z } from "zod";
import { ToolConfig } from "@/types";
import { BiSearchAlt } from "react-icons/bi";
import { FaWikipediaW, FaTwitter } from "react-icons/fa";
import { SiNotion, SiGoogle, SiWolframlanguage } from "react-icons/si";

// Tool requirement schemas
const tavilyConfigSchema = z.object({
  maxResults: z.number().optional().default(3),
});

const wolframAlphaConfigSchema = z.object({});

// No config needed for Wikipedia
const wikipediaConfigSchema = z.object({});

// Define available tools and their metadata
export const TOOLS_CONFIG = {
  web_search: {
    name: "Web Search",
    description: "Search the web for current information using Tavily's API",
    icon: BiSearchAlt,
    configSchema: tavilyConfigSchema,
    defaultConfig: {
      maxResults: 3,
    },
    requiredCredentials: ["api_key"],
    optionalCredentials: [],
  },
  wikipedia: {
    name: "Wikipedia",
    description: "Query Wikipedia for factual information and definitions",
    icon: FaWikipediaW,
    configSchema: wikipediaConfigSchema,
    defaultConfig: {},
    requiredCredentials: [],
    optionalCredentials: [],
  },
  wolfram_alpha: {
    name: "Wolfram Alpha",
    description: "Perform complex calculations and queries using Wolfram Alpha",
    icon: SiWolframlanguage,
    configSchema: wolframAlphaConfigSchema,
    defaultConfig: {},
    requiredCredentials: ["api_key"],
    optionalCredentials: [],
  },
  notion: {
    name: "Notion",
    description: "Create, update, and search Notion pages and databases",
    icon: SiNotion,
    configSchema: z.object({}),
    defaultConfig: {},
    requiredCredentials: ["api_key"],
    optionalCredentials: ["workspace_id", "database_id"],
  },
  twitter: {
    name: "Twitter",
    description: "Post tweets, create threads, and interact with Twitter",
    icon: FaTwitter,
    configSchema: z.object({}),
    defaultConfig: {},
    requiredCredentials: [
      "api_key",
      "api_secret",
      "access_token",
      "access_token_secret",
    ],
    optionalCredentials: [],
  },
  google: {
    name: "Google",
    description: "Interact with Google Calendar, Docs, Sheets, and Drive",
    icon: SiGoogle,
    configSchema: z.object({}),
    defaultConfig: {},
    requiredCredentials: ["client_id", "client_secret", "refresh_token"],
    optionalCredentials: [],
  },
} as const;

// Helper to get default configuration for a tool
export function getDefaultToolConfig(toolId: ToolID): ToolConfig {
  const tool = TOOLS_CONFIG[toolId];
  if (!tool) throw new Error(`Unknown tool: ${toolId}`);

  return {
    isEnabled: toolId === "web_search",
    config: tool.defaultConfig,
    credentials: {},
  };
}

export { TOOLS_CONFIG as AVAILABLE_TOOLS };

export type ToolID = keyof typeof TOOLS_CONFIG;
