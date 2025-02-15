// Tool related types
export type ToolID =
  | "web_search"
  | "wikipedia"
  | "wolfram_alpha"
  | "notion"
  | "twitter"
  | "google";

export interface ToolConfig {
  isEnabled: boolean;
  config: Record<string, unknown>;
  credentials: Record<string, string>;
}

// Simplified ToolsConfig
export type ToolsConfig = Record<ToolID, ToolConfig>;

// Integration Tool Types
export type IntegrationType = "notion" | "twitter" | "google";

export interface IntegrationToolConfig {
  enabled: boolean;
  credentials: {
    api_key?: string;
    api_secret?: string;
    access_token?: string;
    access_token_secret?: string;
    oauth_token?: string;
    client_id?: string;
    client_secret?: string;
    refresh_token?: string;
    workspace_id?: string; // For Notion
    database_id?: string; // For Notion
  };
  settings: Record<string, unknown>;
}

export interface IntegrationTools {
  notion?: IntegrationToolConfig;
  twitter?: IntegrationToolConfig;
  google?: IntegrationToolConfig;
}

export interface ToolCall {
  tool_call_id: string;
  tool_id: string;
  arguments: string;
}

// Available actions for each integration
export interface NotionActions {
  createPage: (params: {
    title: string;
    content: string;
    parent?: { database_id?: string; page_id?: string };
  }) => Promise<unknown>;
  updatePage: (params: {
    page_id: string;
    properties: Record<string, unknown>;
  }) => Promise<unknown>;
  addToDatabase: (params: {
    database_id: string;
    properties: Record<string, unknown>;
  }) => Promise<unknown>;
  search: (params: {
    query: string;
    filter?: Record<string, unknown>;
  }) => Promise<unknown>;
}

export interface TwitterActions {
  postTweet: (params: { text: string; reply_to?: string }) => Promise<unknown>;
  createThread: (params: { tweets: string[] }) => Promise<unknown>;
  sendDirectMessage: (params: {
    recipient_id: string;
    text: string;
  }) => Promise<unknown>;
  likeTweet: (params: { tweet_id: string }) => Promise<unknown>;
  retweet: (params: { tweet_id: string }) => Promise<unknown>;
}

export interface GoogleActions {
  createCalendarEvent: (params: {
    summary: string;
    description?: string;
    start: string;
    end: string;
  }) => Promise<unknown>;
  updateCalendarEvent: (params: {
    event_id: string;
    updates: Record<string, unknown>;
  }) => Promise<unknown>;
  createDoc: (params: { title: string; content: string }) => Promise<unknown>;
  updateSheet: (params: {
    spreadsheet_id: string;
    range: string;
    values: unknown[][];
  }) => Promise<unknown>;
  uploadFile: (params: {
    name: string;
    content: string | Buffer;
    mimeType: string;
    parents?: string[];
  }) => Promise<unknown>;
}
