import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { MCPOAuthClient } from "@/lib/oauth/oauthClient";
import { GitHubOAuthClient } from "@/lib/oauth/githubOauthClient";
import { sessionStore } from "@/lib/oauth/sessionStore";
import { getAvailableMcpServers } from "../agent/getAvailableMcpServers";
import { OAuthTokens } from "@modelcontextprotocol/sdk/shared/auth.js";

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
  oauthClients: Map<string, MCPOAuthClient | GitHubOAuthClient>;
  sessions: Map<string, string>; // serverName -> sessionId
}

// Cache for MCP clients and tools to avoid recreating them on every call
const mcpClientCache = new Map<string, { result: MCPClientResult; timestamp: number }>();
const oauthClientCache = new Map<string, MCPOAuthClient | GitHubOAuthClient>();
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
        // Avoid sticky empty-tool cache when servers are enabled
        const hasEnabledServers = enabledServers.length > 0;
        const isEmptyTools = cachedEntry.result.tools.length === 0;

        if (oauthValid && httpValid && !(hasEnabledServers && isEmptyTools)) {
          console.log(`Using cached MCP client for ${userId} (cache age: ${Math.round(cacheAge / 1000)}s)`);
          return cachedEntry.result;
        } else {
          console.log(`Refreshing MCP client for ${userId} (oauthValid=${oauthValid}, httpValid=${httpValid}, hasEnabled=${hasEnabledServers}, emptyTools=${isEmptyTools})`);
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
      // Normalize and resolve requested server names against available servers
      if (serversToLoad.length > 0) {
        const simplify = (name: string) => name.toLowerCase().replace(/^@/, "").replace(/[^a-z0-9]/g, "");
        const availableBySimple = new Map<string, string>();
        for (const key of Object.keys(allServers)) {
          availableBySimple.set(simplify(key), key);
        }
        const resolved: string[] = [];
        const missing: string[] = [];
        for (const req of serversToLoad) {
          if (allServers[req]) {
            resolved.push(req);
            continue;
          }
          const simple = simplify(req);
          const mapped = availableBySimple.get(simple);
          if (mapped) {
            console.log(`Resolved requested server \"${req}\" -> \"${mapped}\"`);
            resolved.push(mapped);
          } else {
            missing.push(req);
          }
        }
        if (missing.length > 0) {
          console.warn(`Requested servers not found: ${missing.join(", ")}. Available: ${Object.keys(allServers).join(", ")}`);
        }
        if (resolved.length > 0) {
          serversToLoad = resolved;
        } else {
          console.warn(`No enabled servers could be resolved; falling back to all available servers.`);
          serversToLoad = Object.keys(allServers);
        }
      }
      if (enabledServers.length === 0) {
        serversToLoad = Object.keys(allServers);
        console.log(`No servers explicitly enabled, falling back to all available: ${serversToLoad.join(", ")}`);
      }
      
      const mcpServers: Record<string, any> = {};
      const oauthClients = new Map<string, MCPOAuthClient | GitHubOAuthClient>();
      const sessions = new Map<string, string>();
      let allTools: any[] = [];

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
              
              // Try to get tools directly from the OAuth client
              try {
                console.log(`Getting tools from OAuth client for ${qualifiedName}...`);
                const oauthTools = await this.getToolsFromOAuthClient(oauthResult.client, qualifiedName);
                allTools.push(...oauthTools);
                console.log(`Got ${oauthTools.length} tools from OAuth client for ${qualifiedName}`);
              } catch (error) {
                console.warn(`Failed to get tools from OAuth client for ${qualifiedName}:`, error);
              }
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
        
        // Only add to mcpServers if it's not an OAuth server (since we handle OAuth servers separately)
        if (!this.isOAuthServer(serverConfig)) {
          mcpServers[qualifiedName] = {
            url: finalUrl,
            // Allow adapter to fall back to SSE on intermediary/network glitches (eg. CF 5xx)
            automaticSSEFallback: true,
            // pass through optional headers (e.g., Authorization Bearer)
            headers: (serverConfig as any).headers
          };
          console.log(`✅ Added server ${qualifiedName} to mcpServers with headers:`, (serverConfig as any).headers);
        }
      }

      // Create MultiServerMCPClient only for non-OAuth servers
      let client: MultiServerMCPClient | null = null;
      if (Object.keys(mcpServers).length > 0) {
        console.log(`Creating MultiServerMCPClient with servers:`, Object.keys(mcpServers));
        
        // Retry client creation and tool discovery on transient upstream errors (eg. 502 Bad Gateway)
        let mcpTools: any[] = [];
        const maxAttempts = 3;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            client = new MultiServerMCPClient({
              mcpServers,
              useStandardContentBlocks: true,
              throwOnLoadError: false,
              prefixToolNameWithServerName: false,
              additionalToolNamePrefix: "",
            });

            // Get all tools from non-OAuth servers
            console.log(`Getting tools from MCP client (attempt ${attempt}/${maxAttempts})...`);
            mcpTools = await client.getTools();
            break;
          } catch (err: any) {
            const msg = String(err?.message || err);
            const isTransient = /\b(502|503|504|ECONNRESET|ETIMEDOUT|Transport is closed|Bad gateway)\b/i.test(msg);
            console.warn(`MCP client creation/getTools attempt ${attempt}/${maxAttempts} failed${isTransient ? ' (transient)' : ''}:`, msg);
            if (attempt === maxAttempts || !isTransient) {
              throw err;
            }
            // Clear client on failure so we retry from scratch
            client = null;
            await new Promise(r => setTimeout(r, 1000 * attempt));
          }
        }
        allTools.push(...mcpTools);
        console.log(`MCP client returned ${mcpTools.length} tools`);
      }
      
      const result: MCPClientResult = { client, tools: allTools, oauthClients, sessions };
      mcpClientCache.set(cacheKey, { result, timestamp: Date.now() });
      
      console.log(`Loaded ${allTools.length} total tools from ${Object.keys(mcpServers).length} MCP servers + ${oauthClients.size} OAuth servers`);
      if (allTools.length > 0) {
        console.log(`Tool names: ${allTools.map(t => t.name).join(", ")}`);
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
    // Treat bearer-token servers as NON-OAuth (we inject headers directly)
    if (serverConfig.config?.auth_type === 'bearer') {
      return false;
    }
    
    // Check for bearer_token in config - these use standard OAuth, not MCP DCR
    if (serverConfig.config?.bearer_token) {
      return false;
    }
    
    // Check explicit auth_type in config first
    if (serverConfig.config?.auth_type === 'oauth') {
      return true;
    }
    
    // Check if OAuth token/session exists in database (MCP DCR OAuth)
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
    client?: MCPOAuthClient | GitHubOAuthClient;
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

      const callbackUrl =
        serverConfig.config?.callbackUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mcp/auth/callback`;

      const providerState = serverConfig.config?.providerState;
      const storedTokenType = serverConfig.config?.tokenMetadata?.token_type || 'Bearer';
      const storedScope = serverConfig.config?.tokenMetadata?.scope;
      const hasStoredToken =
        typeof serverConfig.oauth_token === 'string' &&
        serverConfig.oauth_token !== '' &&
        serverConfig.oauth_token !== 'present';

      const tokens: OAuthTokens | null = hasStoredToken
        ? {
            access_token: serverConfig.oauth_token,
            token_type: storedTokenType,
            scope: storedScope,
            refresh_token: serverConfig.refresh_token || undefined,
          }
        : null;

      const expiresAt: string | undefined = serverConfig.expires_at || serverConfig.config?.tokenMetadata?.expires_at;

      const isGitHubServer =
        qualifiedName === 'github' ||
        serverConfig.url?.includes('githubcopilot.com') ||
        serverConfig.url?.includes('github.com');

      if (isGitHubServer && tokens) {
        console.log(`Rehydrating GitHub OAuth client for ${qualifiedName}`);
        const githubClient = new GitHubOAuthClient(
          serverConfig.url,
          callbackUrl,
          (redirectUrl: string) => {
            console.log(`GitHub OAuth redirect: ${redirectUrl}`);
          }
        );

        if (serverConfig.session_id) {
          githubClient.setSessionId?.(serverConfig.session_id);
        }

        try {
          await githubClient.connectWithStoredSession({ tokens, expiresAt });
          if (serverConfig.session_id) {
            sessionStore.setClient(serverConfig.session_id, githubClient);
          }
          return {
            url: serverConfig.url,
            client: githubClient,
            sessionId: serverConfig.session_id,
          };
        } catch (error) {
          console.warn(`Failed to reconnect GitHub OAuth session for ${qualifiedName}:`, error);
        }
      }

      if (tokens) {
        console.log(`Rehydrating OAuth client for ${qualifiedName}`);
        const oauthClient = new MCPOAuthClient(
          serverConfig.url,
          callbackUrl,
          (redirectUrl: string) => {
            console.log(`OAuth redirect for ${qualifiedName}: ${redirectUrl}`);
          }
        );

        try {
          await oauthClient.connectWithStoredSession({
            tokens,
            expiresAt,
            providerState,
          });

          if (serverConfig.session_id) {
            sessionStore.setClient(serverConfig.session_id, oauthClient);
          }

          return {
            url: serverConfig.url,
            client: oauthClient,
            sessionId: serverConfig.session_id,
          };
        } catch (error) {
          console.warn(`Failed to reconnect OAuth session for ${qualifiedName}:`, error);
        }
      }

      console.warn(
        `OAuth server ${qualifiedName} is enabled but no reusable session tokens were found; agent may need to reauthorize.`
      );

      return {
        url: serverConfig.url,
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
      // Extract profile ID from config (set by user in UI). Required; never default to a shared profile.
      const profileId = serverConfig.config?.smitheryProfileId || serverConfig.config?.profileId;
      if (!profileId) {
        throw new Error(`Smithery server ${qualifiedName} is missing a per-user profileId in config`);
      }
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
  private async validateOAuthSessions(oauthClients: Map<string, MCPOAuthClient | GitHubOAuthClient>): Promise<boolean> {
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
    // If there is no HTTP client, we may still have OAuth-only tools available.
    // Treat this as valid rather than forcing a refresh.
    if (!client) return true;
    
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
    client: MCPOAuthClient | GitHubOAuthClient;
    sessionId: string;
    requiresAuth?: boolean;
    authUrl?: string;
    providerState?: any;
  }> {
    const sessionId = sessionStore.generateSessionId();
    let authUrl: string | null = null;

    // Use GitHub-specific OAuth client for GitHub MCP server
    const isGitHubServer = serverUrl.includes('githubcopilot.com') || serverUrl.includes('github.com');
    
    let client: MCPOAuthClient | GitHubOAuthClient;
    
    if (isGitHubServer) {
      client = new GitHubOAuthClient(
        serverUrl,
        callbackUrl,
        (redirectUrl: string) => {
          authUrl = redirectUrl;
        }
      );
      // Store the session ID in the GitHub client for the OAuth flow
      if (client instanceof GitHubOAuthClient && typeof client.setSessionId === "function") {
        client.setSessionId(sessionId);
      } else {
        (client as any).sessionId = sessionId;
      }
    } else {
      client = new MCPOAuthClient(
        serverUrl,
        callbackUrl,
        (redirectUrl: string) => {
          // Ensure our sessionId is propagated via the OAuth state param
          try {
            const url = new URL(redirectUrl);
            url.searchParams.set('state', sessionId);
            authUrl = url.toString();
          } catch {
            authUrl = redirectUrl;
          }
        }
      );
    }

    try {
      await client.connect();
      // If we get here, connection succeeded without OAuth
      sessionStore.setClient(sessionId, client);
      return { client, sessionId };
    } catch (error: any) {
      if (error.message === "OAuth authorization required" && authUrl) {
        // Store client for later use
        console.log(`Storing OAuth client in session store for sessionId: ${sessionId}`);
        sessionStore.setClient(sessionId, client);
        // Capture provider state for rehydration on callback
        let providerState: any = undefined;
        if (client instanceof MCPOAuthClient) {
          providerState = client.getProviderState();
        }
        return {
          client,
          sessionId,
          requiresAuth: true,
          authUrl,
          providerState
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
  getCachedOAuthClients(): Map<string, MCPOAuthClient | GitHubOAuthClient> {
    const allClients = new Map<string, MCPOAuthClient | GitHubOAuthClient>();
    for (const cachedEntry of mcpClientCache.values()) {
      for (const [name, client] of cachedEntry.result.oauthClients) {
        allClients.set(name, client);
      }
    }
    return allClients;
  }

  /**
   * Gets tools from an OAuth client
   */
  private async getToolsFromOAuthClient(oauthClient: MCPOAuthClient | GitHubOAuthClient, serverName: string): Promise<any[]> {
    try {
      // Ensure the OAuth client is connected
      if (!oauthClient) {
        console.warn(`No OAuth client available for ${serverName}`);
        return [];
      }

      if ("isConnected" in oauthClient && typeof (oauthClient as any).isConnected === "function") {
        if (!(oauthClient as any).isConnected()) {
          console.warn(`OAuth client for ${serverName} is not connected; skipping tool discovery.`);
          return [];
        }
      }

      // Try to list tools from the OAuth client
      const toolsResult = await oauthClient.listTools();
      
      // Convert the tools to the format expected by LangChain
      const tools = toolsResult.tools.map((tool: any) => ({
        name: tool.name,
        description: tool.description,
        schema: tool.inputSchema,
        invoke: async (args: any) => {
          const result = await oauthClient.callTool(tool.name, args);
          return result.content;
        }
      }));
      
      return tools;
    } catch (error) {
      console.error(`Error getting tools from OAuth client for ${serverName}:`, error);
      return [];
    }
  }
}

// Export singleton instance
export const mcpClientManager = MCPClientManager.getInstance();
