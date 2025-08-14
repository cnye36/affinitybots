import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { MCPOAuthClient } from "@/lib/oauth-client";
import { sessionStore } from "@/lib/session-store";
import { getAvailableMcpServers } from "../agent/getAvailableMcpServers";

export interface MCPServerInfo {
  qualified_name: string;
  url: string;
  oauth_token?: string;
  session_id?: string;
  expires_at?: string;
  config?: Record<string, unknown>;
  is_enabled: boolean;
}

export interface MCPClientConfig {
  userId: string;
  enabledServers: string[];
  forceRefresh?: boolean;
}

export interface MCPClientResult {
  client: MultiServerMCPClient | null;
  tools: any[];
  oauthClients: Map<string, MCPOAuthClient>;
  sessions: Map<string, string>; // serverName -> sessionId
}

// Cache for MCP clients and tools to avoid recreating them on every call
const mcpClientCache = new Map<string, { result: MCPClientResult; timestamp: number }>();
const oauthClientCache = new Map<string, MCPOAuthClient>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes for HTTP sessions

export class MCPClientManager {
  private static instance: MCPClientManager;
  
  static getInstance(): MCPClientManager {
    if (!MCPClientManager.instance) {
      MCPClientManager.instance = new MCPClientManager();
    }
    return MCPClientManager.instance;
  }

  private constructor() {}

  /**
   * Creates or retrieves MCP clients for the given user and servers
   */
  async createMcpClientAndTools(config: MCPClientConfig): Promise<MCPClientResult> {
    const { userId, enabledServers, forceRefresh = false } = config;
    const cacheKey = `${userId}:${enabledServers.sort().join(",")}`;
    
    // Check cache first (unless forcing refresh)
    if (!forceRefresh && mcpClientCache.has(cacheKey)) {
      const cachedEntry = mcpClientCache.get(cacheKey)!;
      const cacheAge = Date.now() - cachedEntry.timestamp;
      
      // Check if cache is still fresh (within time limit)
      if (cacheAge < CACHE_DURATION_MS) {
        // Validate both OAuth and HTTP sessions are still active
        const oauthValid = await this.validateOAuthSessions(cachedEntry.result.oauthClients);
        const httpValid = await this.validateHttpSessions(cachedEntry.result.client);
        
        if (oauthValid && httpValid) {
          console.log(`Using cached MCP client for ${userId} (cache age: ${Math.round(cacheAge / 1000)}s)`);
          return cachedEntry.result;
        } else {
          console.log(`Sessions expired (OAuth: ${oauthValid}, HTTP: ${httpValid}), refreshing MCP client for ${userId}`);
        }
      } else {
        console.log(`Cache expired for ${userId} (age: ${Math.round(cacheAge / 1000)}s), refreshing`);
      }
      
      mcpClientCache.delete(cacheKey);
    }

    try {
      const allServers = await getAvailableMcpServers(userId);
      console.log(`MCPClientManager: Creating client for userId=${userId}, enabledServers=${JSON.stringify(enabledServers)}`);
      console.log(`Available servers from database:`, Object.keys(allServers));
      
      // If no servers are explicitly enabled, fall back to all available servers
      let serversToLoad = enabledServers;
      if (enabledServers.length === 0) {
        serversToLoad = Object.keys(allServers);
        console.log(`No servers explicitly enabled, falling back to all available: ${serversToLoad.join(", ")}`);
      }
      
      const mcpServers: Record<string, any> = {};
      const oauthClients = new Map<string, MCPOAuthClient>();
      const sessions = new Map<string, string>();

      // Build server configuration, handling both OAuth and API key methods
      for (const qualifiedName of serversToLoad) {
        if (!allServers[qualifiedName]) {
          console.warn(`Server ${qualifiedName} not found in available servers`);
          continue;
        }

        const serverConfig = allServers[qualifiedName];
        console.log(`Processing server: ${qualifiedName} with URL: ${serverConfig.url}`);
        
        let finalUrl = serverConfig.url;
        
        // Check if this server uses OAuth
        if (this.isOAuthServer(serverConfig)) {
          const oauthResult = await this.handleOAuthServer(qualifiedName, serverConfig);
          if (oauthResult) {
            // For OAuth servers, we'll use our OAuth client wrapper
            finalUrl = oauthResult.url;
            if (oauthResult.client) {
              oauthClients.set(qualifiedName, oauthResult.client);
            }
            if (oauthResult.sessionId) {
              sessions.set(qualifiedName, oauthResult.sessionId);
            }
          } else {
            console.warn(`Failed to set up OAuth for server ${qualifiedName}, skipping`);
            continue;
          }
        } else {
          // Handle API key-based servers (existing logic)
          finalUrl = this.buildApiKeyUrl(qualifiedName, serverConfig);
        }
        
        mcpServers[qualifiedName] = {
          url: finalUrl,
          automaticSSEFallback: false
        };
        
        console.log(`✅ Added server ${qualifiedName} to mcpServers`);
      }

      if (Object.keys(mcpServers).length === 0) {
        return { client: null, tools: [], oauthClients, sessions };
      }

      // Create MultiServerMCPClient
      console.log(`Creating MultiServerMCPClient with servers:`, Object.keys(mcpServers));
      
      const client = new MultiServerMCPClient({
        mcpServers,
        useStandardContentBlocks: true,
        throwOnLoadError: false,
        prefixToolNameWithServerName: false,
        additionalToolNamePrefix: "",
      });

      // Get all tools from all servers
      console.log(`Getting tools from MCP client...`);
      const tools = await client.getTools();
      console.log(`MCP client returned ${tools.length} tools`);
      
      const result: MCPClientResult = { client, tools, oauthClients, sessions };
      mcpClientCache.set(cacheKey, { result, timestamp: Date.now() });
      
      console.log(`Loaded ${tools.length} tools from ${Object.keys(mcpServers).length} MCP servers`);
      if (tools.length > 0) {
        console.log(`Tool names: ${tools.map(t => t.name).join(", ")}`);
      }
      
      return result;
    } catch (error) {
      console.error("Error creating MCP client and tools:", error);
      return { client: null, tools: [], oauthClients: new Map(), sessions: new Map() };
    }
  }

  /**
   * Checks if a server uses OAuth authentication
   * First checks server config, then falls back to URL pattern detection
   */
  private isOAuthServer(serverConfig: any): boolean {
    // Check explicit auth_type in config first
    if (serverConfig.config?.auth_type === 'oauth') {
      return true;
    }
    
    // Check if OAuth token/session exists in database
    if (serverConfig.oauth_token || serverConfig.session_id) {
      return true;
    }
    
    // Fall back to URL pattern detection for legacy support
    const url = serverConfig.url;
    if (url) {
      return url.includes('/oauth/') || url.includes('oauth=true') || url.includes('auth_type=oauth');
    }
    
    return false;
  }

  /**
   * Handles OAuth server setup and authentication
   */
  private async handleOAuthServer(qualifiedName: string, serverConfig: any): Promise<{
    url: string;
    client?: MCPOAuthClient;
    sessionId?: string;
  } | null> {
    try {
      // Check if we have an existing OAuth session
      if (serverConfig.session_id) {
        const existingClient = sessionStore.getClient(serverConfig.session_id);
        if (existingClient) {
          console.log(`Using existing OAuth session for ${qualifiedName}`);
          return {
            url: serverConfig.url,
            client: existingClient,
            sessionId: serverConfig.session_id
          };
        }
      }

      // For OAuth servers, we need to use the session-based approach
      // In a production environment, you'd initiate OAuth flow here
      // For now, we'll assume OAuth sessions are managed externally
      console.log(`OAuth server ${qualifiedName} requires external OAuth setup`);
      
      return {
        url: serverConfig.url // Use the URL as-is, assuming OAuth token is embedded
      };
    } catch (error) {
      console.error(`Error handling OAuth server ${qualifiedName}:`, error);
      return null;
    }
  }

  /**
   * Builds URL for non-OAuth servers
   */
  private buildApiKeyUrl(qualifiedName: string, serverConfig: any): string {
    // If server has a URL configured, use it
    if (serverConfig.url) {
      return serverConfig.url;
    }

    // Check if this is a Smithery server and we have an API key
    const apiKey = process.env.SMITHERY_API_KEY;
    if (apiKey && this.isSmitheryServer(qualifiedName, serverConfig)) {
      // Extract profile ID from config (set by user in UI)
      const profileId = serverConfig.config?.smitheryProfileId || serverConfig.config?.profileId || "eligible-bug-FblvFg";
      const fallbackUrl = `https://server.smithery.ai/${qualifiedName}/mcp?api_key=${apiKey}&profile=${profileId}`;
      console.log(`🏗️  Built Smithery API key URL: ${fallbackUrl.replace(apiKey, 'HIDDEN_API_KEY')}`);
      return fallbackUrl;
    }

    // For non-Smithery servers without URLs, this is an error
    console.error(`❌ Server ${qualifiedName} has no URL configured and is not a Smithery server`);
    throw new Error(`Server ${qualifiedName} requires a URL to be configured`);
  }

  /**
   * Checks if a server is a Smithery-hosted server
   */
  private isSmitheryServer(qualifiedName: string, serverConfig: any): boolean {
    // Check if explicitly marked as Smithery server
    if (serverConfig.config?.provider === 'smithery') {
      return true;
    }
    
    // Check if URL is a Smithery URL
    if (serverConfig.url?.includes('server.smithery.ai')) {
      return true;
    }
    
    // For legacy support, assume servers without URLs but with Smithery config are Smithery servers
    if (!serverConfig.url && (serverConfig.config?.smitheryProfileId || serverConfig.config?.profileId)) {
      return true;
    }
    
    return false;
  }

  /**
   * Validates that OAuth sessions are still active
   */
  private async validateOAuthSessions(oauthClients: Map<string, MCPOAuthClient>): Promise<boolean> {
    try {
      // For each OAuth client, try to list tools to verify it's still active
      for (const [serverName, client] of oauthClients) {
        try {
          await client.listTools();
        } catch (error) {
          console.warn(`OAuth session for ${serverName} is no longer valid:`, error);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error("Error validating OAuth sessions:", error);
      return false;
    }
  }

  /**
   * Validates that HTTP MCP sessions are still active (for Smithery servers)
   */
  private async validateHttpSessions(client: MultiServerMCPClient | null): Promise<boolean> {
    if (!client) return false;
    
    try {
      // Try to get tools to verify connection is still active
      const tools = await client.getTools();
      return tools.length > 0;
    } catch (error: any) {
      // Check for specific session expiration errors
      if (error.message?.includes('Session not found') || 
          error.message?.includes('expired') ||
          error.message?.includes('Transport is closed')) {
        console.warn('HTTP MCP session expired or transport closed');
        return false;
      }
      console.error("Error validating HTTP MCP sessions:", error);
      return false;
    }
  }

  /**
   * Creates an OAuth client for a specific server
   */
  async createOAuthClient(serverUrl: string, callbackUrl: string): Promise<{
    client: MCPOAuthClient;
    sessionId: string;
    requiresAuth?: boolean;
    authUrl?: string;
  }> {
    const sessionId = sessionStore.generateSessionId();
    let authUrl: string | null = null;

    const client = new MCPOAuthClient(
      serverUrl,
      callbackUrl,
      (redirectUrl: string) => {
        authUrl = redirectUrl;
      }
    );

    try {
      await client.connect();
      // If we get here, connection succeeded without OAuth
      sessionStore.setClient(sessionId, client);
      return { client, sessionId };
    } catch (error: any) {
      if (error.message === "OAuth authorization required" && authUrl) {
        // Store client for later use
        sessionStore.setClient(sessionId, client);
        return {
          client,
          sessionId,
          requiresAuth: true,
          authUrl
        };
      } else {
        throw error;
      }
    }
  }

  /**
   * Finishes OAuth authentication for a client
   */
  async finishOAuth(sessionId: string, authCode: string): Promise<void> {
    const client = sessionStore.getClient(sessionId);
    if (!client) {
      throw new Error("No active OAuth session found");
    }

    await client.finishAuth(authCode);
  }

  /**
   * Disconnects a specific OAuth session
   */
  async disconnectOAuth(sessionId: string): Promise<void> {
    sessionStore.removeClient(sessionId);
  }

  /**
   * Clears the MCP client cache (useful for testing or force refresh)
   */
  clearCache(): void {
    mcpClientCache.clear();
    oauthClientCache.clear();
  }

  /**
   * Gets cached OAuth clients for debugging
   */
  getCachedOAuthClients(): Map<string, MCPOAuthClient> {
    const allClients = new Map<string, MCPOAuthClient>();
    for (const cachedEntry of mcpClientCache.values()) {
      for (const [name, client] of cachedEntry.result.oauthClients) {
        allClients.set(name, client);
      }
    }
    return allClients;
  }
}

// Export singleton instance
export const mcpClientManager = MCPClientManager.getInstance();