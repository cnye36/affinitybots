import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { MCPOAuthClient } from "@/lib/oauth/oauthClient";
import { GitHubOAuthClient } from "@/lib/oauth/githubOauthClient";
import { GoogleDriveMCPClient, createGoogleDriveClient } from "./googleDriveMcpClient";
import { GmailMCPClient, createGmailClient } from "./gmailMcpClient";
import { sessionStore } from "@/lib/oauth/sessionStore";
import { getAvailableMcpServers } from "../agent/getAvailableMcpServers";
import { OAuthTokens } from "@modelcontextprotocol/sdk/shared/auth.js";
import { DynamicStructuredTool } from "@langchain/core/tools";

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
  oauthClients: Map<string, MCPOAuthClient | GitHubOAuthClient | GoogleDriveMCPClient | GmailMCPClient>;
  sessions: Map<string, string>; // serverName -> sessionId
}

// Cache for MCP clients and tools to avoid recreating them on every call
const mcpClientCache = new Map<string, { result: MCPClientResult; timestamp: number }>();
const oauthClientCache = new Map<string, MCPOAuthClient | GitHubOAuthClient | GoogleDriveMCPClient>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes for HTTP sessions

const FALLBACK_TOOL_SCHEMA: Readonly<Record<string, unknown>> = Object.freeze({
	type: "object",
	properties: {},
	additionalProperties: true,
});

interface NormalizedTool {
	displayName: string;
	remoteName: string;
	description: string;
	schema: Record<string, unknown>;
}

function pickFirstString(...values: unknown[]): string | undefined {
	for (const value of values) {
		if (typeof value === "string") {
			const trimmed = value.trim();
			if (trimmed.length > 0) {
				return trimmed;
			}
		}
	}
	return undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeToolSchema(candidate: unknown): Record<string, unknown> {
	if (isPlainObject(candidate)) {
		return candidate as Record<string, unknown>;
	}
	return { ...FALLBACK_TOOL_SCHEMA };
}

function normalizeToolMetadata(rawTool: unknown, serverName: string): NormalizedTool | null {
	if (!isPlainObject(rawTool)) {
		console.warn(`Skipping tool from ${serverName}: tool definition is not an object`, rawTool);
		return null;
	}

	const toolRecord = rawTool as Record<string, unknown>;
	const metadata = isPlainObject(toolRecord.metadata) ? (toolRecord.metadata as Record<string, unknown>) : undefined;

	const remoteName = pickFirstString(
		toolRecord.name,
		toolRecord.tool,
		toolRecord.id,
		toolRecord.command,
		toolRecord.identifier,
		toolRecord.key,
		toolRecord.action,
		toolRecord.slug,
		metadata?.name,
		metadata?.id
	);

	if (!remoteName) {
		console.warn(`Skipping tool from ${serverName}: missing identifier`, rawTool);
		return null;
	}

	const displayName =
		pickFirstString(
			toolRecord.displayName,
			toolRecord.title,
			toolRecord.label,
			metadata?.displayName,
			metadata?.title,
			toolRecord.name,
			toolRecord.tool,
			toolRecord.id
		) || remoteName;

	const description =
		pickFirstString(
			toolRecord.description,
			toolRecord.summary,
			toolRecord.details,
			toolRecord.help,
			metadata?.description
		) || "";

	const schemaCandidate =
		metadata?.parameters ??
		toolRecord.parameters ??
		toolRecord.inputSchema ??
		toolRecord.schema ??
		toolRecord.arguments ??
		metadata?.schema;

	return {
		displayName,
		remoteName,
		description,
		schema: normalizeToolSchema(schemaCandidate),
	};
}

function unwrapToolCallResult(result: unknown): unknown {
	if (!result || typeof result !== "object") {
		return result;
	}

	const withContent = result as { content?: unknown };
	const content = withContent.content;
	if (typeof content === "string") {
		return content;
	}

	if (Array.isArray(content)) {
		const textEntry = content.find((entry) => typeof entry?.text === "string");
		if (textEntry && typeof textEntry.text === "string") {
			return textEntry.text;
		}
		return content;
	}

	return content ?? result;
}

function createDynamicToolInstance(
	normalized: NormalizedTool,
	executor: (args: Record<string, unknown>) => Promise<unknown>
): DynamicStructuredTool<any, any, any, string> {
	const schema = normalizeToolSchema(normalized.schema);
	const tool = new DynamicStructuredTool<any, any, any, string>({
		name: normalized.displayName,
		description: normalized.description || normalized.displayName,
		schema: schema as any,
		func: async (input: Record<string, unknown>) => {
			const args = isPlainObject(input)
				? (input as Record<string, unknown>)
				: input == null
					? {}
					: { value: input };
			const result = await executor(args);
			if (typeof result === "string") {
				return result;
			}
			try {
				return JSON.stringify(result);
			} catch (error) {
				console.warn(`Failed to stringify tool result for ${normalized.displayName}`, error);
				return String(result);
			}
		},
	});

	(tool as any).__remoteName = normalized.remoteName;
	return tool;
}

// Clear cache function for debugging
export function clearMcpCache() {
  mcpClientCache.clear();
  oauthClientCache.clear();
  console.log("MCP cache cleared");
}

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
      
      // Only load servers that are explicitly enabled - do NOT fall back to all available
      let serversToLoad: string[] = [];
      // Normalize and resolve requested server names against available servers
      if (enabledServers.length > 0) {
        const simplify = (name: string) => name.toLowerCase().replace(/^@/, "").replace(/[^a-z0-9]/g, "");
        const availableBySimple = new Map<string, string>();
        for (const key of Object.keys(allServers)) {
          availableBySimple.set(simplify(key), key);
        }
        const resolved: string[] = [];
        const missing: string[] = [];
        for (const req of enabledServers) {
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
        serversToLoad = resolved;
      } else {
        console.log(`No servers explicitly enabled, loading no MCP servers (empty list)`);
      }
      
      const mcpServers: Record<string, any> = {};
      const oauthClients = new Map<string, MCPOAuthClient | GitHubOAuthClient | GoogleDriveMCPClient | GmailMCPClient>();
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
          const oauthResult = await this.handleOAuthServer(qualifiedName, serverConfig, userId);
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
  private async handleOAuthServer(qualifiedName: string, serverConfig: any, userId: string): Promise<{
    url: string;
    client?: MCPOAuthClient | GitHubOAuthClient | GoogleDriveMCPClient | GmailMCPClient;
    sessionId?: string;
  } | null> {
    try {
      // Check if this is a Google service that needs custom client handling
      const isGoogleDriveServer =
        qualifiedName === 'google-drive' ||
        serverConfig.config?.provider === 'google-drive';
      
      const isGmailServer =
        qualifiedName === 'gmail' ||
        serverConfig.config?.provider === 'gmail';
      
      // Skip sessionStore lookup for Google services - they use custom clients
      const isGoogleService = isGoogleDriveServer || isGmailServer;

      if (serverConfig.session_id && !isGoogleService) {
        const existingClient = await sessionStore.getClient(serverConfig.session_id);
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
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/mcp/auth/callback`;

      const providerState = serverConfig.config?.providerState;
      const storedTokenType = serverConfig.config?.tokenMetadata?.token_type || 'Bearer';
      const storedScope = serverConfig.config?.tokenMetadata?.scope;
      const hasStoredToken =
        typeof serverConfig.oauth_token === 'string' &&
        serverConfig.oauth_token !== '' &&
        serverConfig.oauth_token !== 'present';

      const expiresAt: string | undefined = serverConfig.expires_at || serverConfig.config?.tokenMetadata?.expires_at;

      // Check if token is expired
      let isTokenExpired = false;
      if (expiresAt) {
        const expiryDate = new Date(expiresAt);
        const bufferMs = 5 * 60 * 1000; // 5 minute buffer
        isTokenExpired = expiryDate.getTime() - bufferMs <= Date.now();

        if (isTokenExpired) {
          console.log(`OAuth token for ${qualifiedName} is expired (expired at ${expiresAt})`);
        }
      }

      // Only use token if it's not expired OR if we have a refresh token to get new one
      const tokens: OAuthTokens | null = hasStoredToken && !isTokenExpired
        ? {
            access_token: serverConfig.oauth_token,
            token_type: storedTokenType,
            scope: storedScope,
            refresh_token: serverConfig.refresh_token || undefined,
          }
        : null;

      console.log(`🔍 Google Drive Debug - qualifiedName: ${qualifiedName}, isGoogleDriveServer: ${isGoogleDriveServer}, hasStoredToken: ${hasStoredToken}`);
      console.log(`🔍 Google Drive Debug - serverConfig.oauth_token: ${serverConfig.oauth_token ? 'PRESENT' : 'MISSING'}`);

      // Handle Google Drive servers with custom client FIRST
      if (isGoogleDriveServer) {
        console.log(`🔍 Google Drive Debug - Attempting to create client regardless of token status`);
        console.log(`Creating Google Drive MCP client for ${qualifiedName}`);
        try {
          const googleClient = await createGoogleDriveClient(userId, serverConfig);
          
          // Test health check
          const isHealthy = await googleClient.healthCheck();
          if (!isHealthy) {
            console.warn(`Google Drive MCP server health check failed at ${serverConfig.url}`);
          }
          
          return {
            url: serverConfig.url,
            client: googleClient as any,
            sessionId: serverConfig.session_id,
          };
        } catch (error) {
          console.error(`Failed to create Google Drive client:`, error);
          return null;
        }
      }

      // Handle Gmail servers with custom client (same pattern as Drive)
      
      if (isGmailServer) {
        console.log(`🔍 Gmail Debug - qualifiedName: ${qualifiedName}, hasStoredToken: ${hasStoredToken}`);
        console.log(`🔍 Gmail Debug - serverConfig.oauth_token: ${serverConfig.oauth_token ? 'PRESENT' : 'MISSING'}`);
        console.log(`Creating Gmail MCP client for ${qualifiedName}`);
        try {
          const gmailClient = await createGmailClient(userId, serverConfig);
          
          // Test health check
          const isHealthy = await gmailClient.healthCheck();
          if (!isHealthy) {
            console.warn(`Gmail MCP server health check failed at ${serverConfig.url}`);
          }
          
          return {
            url: serverConfig.url,
            client: gmailClient as any,
            sessionId: serverConfig.session_id,
          };
        } catch (error) {
          console.error(`Failed to create Gmail client:`, error);
          return null;
        }
      }

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

    // Servers without URLs cannot be used
    console.error(`❌ Server ${qualifiedName} has no URL configured`);
    throw new Error(`Server ${qualifiedName} requires a URL to be configured`);
  }


  /**
   * Validates that OAuth sessions are still active
   */
  private async validateOAuthSessions(oauthClients: Map<string, MCPOAuthClient | GitHubOAuthClient | GoogleDriveMCPClient | GmailMCPClient>): Promise<boolean> {
    try {
      // For each OAuth client, try to list tools to verify it's still active
      for (const [serverName, client] of oauthClients) {
        try {
          // Google Drive clients use healthCheck instead of listTools
          if (client instanceof GoogleDriveMCPClient) {
            const isHealthy = await client.healthCheck();
            if (!isHealthy) {
              console.warn(`Google Drive MCP server for ${serverName} is unhealthy`);
              return false;
            }
          } else {
            await client.listTools();
          }
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
   * Validates that HTTP MCP sessions are still active
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
  async createOAuthClient(serverUrl: string, callbackUrl: string, userId?: string, serverName?: string): Promise<{
    client: MCPOAuthClient | GitHubOAuthClient;
    sessionId: string;
    requiresAuth?: boolean;
    authUrl?: string;
    providerState?: any;
    state?: string;
  }> {
    const sessionId = sessionStore.generateSessionId();
    let authUrl: string | null = null;
    let stateParam: string | undefined;

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
          authUrl = redirectUrl;
        }
      );
    }

    try {
      await client.connect();
      // If we get here, connection succeeded without OAuth
      await sessionStore.setClient(sessionId, client);
      return { client, sessionId };
    } catch (error: any) {
      if (error.message === "OAuth authorization required" && authUrl) {
        // Generate cryptographically secure state parameter for CSRF protection
        const crypto = await import('crypto');
        stateParam = crypto.randomBytes(32).toString('hex');

        // Store state mapping for validation on callback
        if (userId && serverName) {
          await sessionStore.setOAuthState(stateParam, {
            sessionId,
            userId,
            serverName,
            serverUrl,
            expiresAt: Date.now() + 5 * 60 * 1000, // 5 minute expiration
          });

          // Append state parameter to auth URL
          try {
            const url = new URL(authUrl);
            url.searchParams.set('state', stateParam);
            authUrl = url.toString();
          } catch (urlError) {
            console.error('Failed to append state parameter to OAuth URL:', urlError);
          }
        } else {
          console.warn('⚠️  OAuth state parameter not stored - userId or serverName missing (CSRF protection disabled)');
          // Fallback to using sessionId as state (less secure but maintains compatibility)
          try {
            const url = new URL(authUrl);
            url.searchParams.set('state', sessionId);
            authUrl = url.toString();
          } catch {
            // Keep original authUrl
          }
        }

        // Store client for later use
        console.log(`Storing OAuth client in session store for sessionId: ${sessionId}`);
        await sessionStore.setClient(sessionId, client);

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
          providerState,
          state: stateParam
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
    const client = await sessionStore.getClient(sessionId);
    if (!client) {
      throw new Error("No active OAuth session found");
    }

    await client.finishAuth(authCode);
  }

  /**
   * Disconnects a specific OAuth session
   */
  async disconnectOAuth(sessionId: string): Promise<void> {
    await sessionStore.removeClient(sessionId);
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
  getCachedOAuthClients(): Map<string, MCPOAuthClient | GitHubOAuthClient | GoogleDriveMCPClient | GmailMCPClient> {
    const allClients = new Map<string, MCPOAuthClient | GitHubOAuthClient | GoogleDriveMCPClient | GmailMCPClient>();
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
  private async getToolsFromOAuthClient(oauthClient: MCPOAuthClient | GitHubOAuthClient | GoogleDriveMCPClient | GmailMCPClient, serverName: string): Promise<any[]> {
    try {
      // Ensure the OAuth client is connected
      if (!oauthClient) {
        console.warn(`No OAuth client available for ${serverName}`);
        return [];
      }

		const buildLangChainTools = (
			rawTools: unknown[],
			executorFactory: (meta: NormalizedTool) => (args: Record<string, unknown>) => Promise<unknown>
		): DynamicStructuredTool<any, any, any, string>[] => {
			const structuredTools: DynamicStructuredTool<any, any, any, string>[] = [];
			rawTools.forEach((rawTool, index) => {
				const normalized = normalizeToolMetadata(rawTool, serverName);
				if (!normalized) {
					console.warn(`Skipping tool ${index + 1} from ${serverName} due to incomplete metadata.`);
					return;
				}
				const executor = executorFactory(normalized);
				structuredTools.push(createDynamicToolInstance(normalized, executor));
			});
			return structuredTools;
		};

		if (oauthClient instanceof GoogleDriveMCPClient) {
			console.log(`Getting tools from Google Drive MCP client for ${serverName}`);
			const googleTools = await oauthClient.listTools();
			return buildLangChainTools(googleTools, (meta) => async (args) => {
				const result = await oauthClient.executeTool(meta.remoteName, args);
				return unwrapToolCallResult(result);
			});
		}

		if (oauthClient instanceof GmailMCPClient) {
			console.log(`Getting tools from Gmail MCP client for ${serverName}`);
			const gmailTools = await oauthClient.listTools();
			return buildLangChainTools(gmailTools, (meta) => async (args) => {
				const result = await oauthClient.executeTool(meta.remoteName, args);
				return unwrapToolCallResult(result);
			});
		}

		if ("isConnected" in oauthClient && typeof (oauthClient as any).isConnected === "function") {
			if (!(oauthClient as any).isConnected()) {
				console.warn(`OAuth client for ${serverName} is not connected; skipping tool discovery.`);
				return [];
			}
		}

		const toolsResult = await oauthClient.listTools();
		const rawTools = Array.isArray((toolsResult as any)?.tools)
			? (toolsResult as any).tools
			: Array.isArray(toolsResult)
				? (toolsResult as unknown[])
				: [];

		return buildLangChainTools(rawTools, (meta) => async (args) => {
			const result = await oauthClient.callTool(meta.remoteName, args);
			return unwrapToolCallResult(result);
		});
    } catch (error) {
      console.error(`Error getting tools from OAuth client for ${serverName}:`, error);
      return [];
    }
  }
}

// Export singleton instance
export const mcpClientManager = MCPClientManager.getInstance();
