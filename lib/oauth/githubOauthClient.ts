import { URL } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  OAuthClientInformation,
  OAuthClientInformationFull,
  OAuthClientMetadata,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import {
  CallToolRequest,
  ListToolsRequest,
  CallToolResultSchema,
  ListToolsResultSchema,
  ListToolsResult,
  CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import {
  OAuthClientProvider,
  UnauthorizedError,
} from "@modelcontextprotocol/sdk/client/auth.js";

class GitHubOAuthClientProvider implements OAuthClientProvider {
  private _clientInformation?: OAuthClientInformationFull;
  private _tokens?: OAuthTokens;
  private _tokenExpiresAt?: string;
  private _codeVerifier?: string;

  constructor(
    private readonly _redirectUrl: string | URL,
    private readonly _onRedirect?: (url: URL) => void
  ) {
    // Validate that GitHub MCP OAuth credentials are configured
    // Note: These are separate from GITHUB_CLIENT_ID (used for sign-in auth)
    const clientId = process.env.GITHUB_MCP_CLIENT_ID;
    const clientSecret = process.env.GITHUB_MCP_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error(
        "GitHub MCP OAuth credentials not configured. Please set GITHUB_MCP_CLIENT_ID and GITHUB_MCP_CLIENT_SECRET environment variables."
      );
    }

    // Log the client_id being used (first 10 chars for security)
    console.log(`[GitHubOAuth] Using MCP client_id: ${clientId.substring(0, 10)}... (length: ${clientId.length})`);
    console.log(`[GitHubOAuth] Redirect URI: ${this._redirectUrl.toString()}`);

    // Use pre-configured GitHub MCP OAuth app credentials
    this._clientInformation = {
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uris: [this._redirectUrl.toString()],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "client_secret_post",
      scope: "repo read:org read:user",
    };
  }

  get redirectUrl(): string | URL {
    return this._redirectUrl;
  }

  get clientMetadata(): OAuthClientMetadata {
    return {
      client_name: "AffinityBots GitHub MCP Client",
      redirect_uris: [this._redirectUrl.toString()],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "client_secret_post",
      scope: "repo read:org read:user",
    };
  }

  clientInformation(): OAuthClientInformation | undefined {
    // Always return our pre-configured client information
    // This ensures the SDK uses our GitHub OAuth app credentials, not dynamically registered ones
    return this._clientInformation;
  }

  saveClientInformation(clientInformation: OAuthClientInformationFull): void {
    // Ignore dynamically registered client information from the MCP server
    // We use pre-configured GitHub OAuth app credentials from environment variables
    // This prevents the SDK from using a UUID client_id that doesn't exist in GitHub
    console.log("GitHub OAuth client information already configured - ignoring server-provided client_id:", clientInformation.client_id);
    // Ensure we keep our pre-configured MCP client_id
    if (this._clientInformation) {
      this._clientInformation.client_id = process.env.GITHUB_MCP_CLIENT_ID!;
      this._clientInformation.client_secret = process.env.GITHUB_MCP_CLIENT_SECRET!;
    }
  }

  tokens(): OAuthTokens | undefined {
    return this._tokens;
  }

  saveTokens(tokens: OAuthTokens): void {
    this._tokens = tokens;
    if (typeof tokens.expires_in === "number") {
      this._tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    } else {
      this._tokenExpiresAt = undefined;
    }
  }

  redirectToAuthorization(authorizationUrl: URL): void {
    // Fix the redirect_uri parameter to use the full URL
    // Also ensure we use our pre-configured client_id, not a dynamically registered one
    const url = new URL(authorizationUrl);
    const redirectUri = this._redirectUrl.toString();
    url.searchParams.set('redirect_uri', redirectUri);
    
    // Override client_id with our pre-configured MCP one if it's different
    const configuredClientId = process.env.GITHUB_MCP_CLIENT_ID;
    if (configuredClientId && url.searchParams.get('client_id') !== configuredClientId) {
      const oldClientId = url.searchParams.get('client_id');
      console.warn(`[GitHubOAuth] Replacing client_id in authorization URL: ${oldClientId?.substring(0, 10)}... -> ${configuredClientId.substring(0, 10)}...`);
      url.searchParams.set('client_id', configuredClientId);
    }
    
    if (this._onRedirect) {
      this._onRedirect(url);
    } else {
      console.log(`[GitHubOAuth] Redirect to: ${url.toString()}`);
    }
  }

  saveCodeVerifier(codeVerifier: string): void {
    this._codeVerifier = codeVerifier;
  }

  codeVerifier(): string {
    if (!this._codeVerifier) {
      throw new Error("No code verifier saved");
    }
    return this._codeVerifier;
  }

  tokensExpireAt(): string | undefined {
    return this._tokenExpiresAt;
  }

  restoreTokens(tokens: OAuthTokens, expiresAt?: string): void {
    this._tokens = tokens;
    this._tokenExpiresAt = expiresAt;
  }
}

export class GitHubOAuthClient {
  private client: Client | null = null;
  private oauthProvider: GitHubOAuthClientProvider | null = null;
  private sessionId: string | null = null;
  private connected = false;
  private cachedTokens?: OAuthTokens;
  private cachedTokenExpiresAt?: string;

  constructor(
    private serverUrl: string,
    private callbackUrl: string,
    private onRedirect: (url: string) => void
  ) {}

  /**
   * Initialize the OAuth provider and client without connecting
   * Used during rehydration when we already have an auth code
   * IMPORTANT: If cached tokens exist, they will be restored to the provider
   */
  private initialize(): void {
    // Validate that we have the required MCP OAuth environment variables
    if (!process.env.GITHUB_MCP_CLIENT_ID || !process.env.GITHUB_MCP_CLIENT_SECRET) {
      throw new Error(
        "GitHub MCP OAuth credentials not configured. Please set GITHUB_MCP_CLIENT_ID and GITHUB_MCP_CLIENT_SECRET environment variables."
      );
    }

    this.oauthProvider = new GitHubOAuthClientProvider(
      this.callbackUrl,
      (redirectUrl: URL) => {
        // Add sessionId to the state parameter if we have one
        if (this.sessionId) {
          redirectUrl.searchParams.set('state', this.sessionId);
        }
        this.onRedirect(redirectUrl.toString());
      }
    );

    // Restore pending code verifier if we have one (from restoreProviderState)
    const pendingCodeVerifier = (this as any)._pendingCodeVerifier;
    if (pendingCodeVerifier) {
      this.oauthProvider.saveCodeVerifier(pendingCodeVerifier);
      delete (this as any)._pendingCodeVerifier;
    }

    // CRITICAL: Restore tokens if we have cached tokens (from previous session)
    // This ensures the oauthProvider has the access token for authenticated requests
    if (this.cachedTokens) {
      console.log("[GitHubOAuth] Restoring cached tokens to oauthProvider during initialize");
      this.oauthProvider.restoreTokens(this.cachedTokens, this.cachedTokenExpiresAt);
    }

    this.client = new Client(
      {
        name: "AffinityBots-github-mcp-client",
        version: "1.0.0",
      },
      { capabilities: {} }
    );
  }

  async connect(): Promise<void> {
    // Initialize if not already initialized
    if (!this.client || !this.oauthProvider) {
      this.initialize();
    }

    await this.attemptConnection();
  }

  private async attemptConnection(): Promise<void> {
    if (!this.client || !this.oauthProvider) {
      throw new Error("Client not initialized");
    }

    const baseUrl = new URL(this.serverUrl);
    const transport = new StreamableHTTPClientTransport(baseUrl, {
      authProvider: this.oauthProvider,
    });

    try {
      await this.client.connect(transport);
      this.connected = true;
      this.cacheTokensFromProvider();
    } catch (error) {
      this.connected = false;
      if (error instanceof UnauthorizedError) {
        throw new Error("OAuth authorization required");
      } else {
        throw error;
      }
    }
  }

  async finishAuth(authCode: string): Promise<void> {
    // Initialize if not already initialized (e.g., during rehydration)
    // IMPORTANT: If we're rehydrating, the code verifier should already be restored via restoreProviderState()
    // before initialize() is called. The initialize() method will pick it up from _pendingCodeVerifier.
    if (!this.client || !this.oauthProvider) {
      console.log("[GitHubOAuth] Client not initialized, initializing before finishAuth");
      this.initialize();
    }

    // TypeScript guard: ensure oauthProvider and client are not null after initialization
    if (!this.oauthProvider || !this.client) {
      throw new Error("OAuth provider or client failed to initialize");
    }

    // Verify code verifier exists (required for PKCE flow)
    try {
      this.oauthProvider.codeVerifier();
      console.log("[GitHubOAuth] Code verifier verified, proceeding with finishAuth");
    } catch (error) {
      console.error("[GitHubOAuth] Code verifier missing:", error);
      throw new Error("Code verifier not found. OAuth session may have expired. Please restart the OAuth flow.");
    }

    const baseUrl = new URL(this.serverUrl);
    const transport = new StreamableHTTPClientTransport(baseUrl, {
      authProvider: this.oauthProvider,
    });

    await transport.finishAuth(authCode);
    await this.client.connect(transport);
    this.connected = true;
    this.cacheTokensFromProvider();
  }

  /**
   * Check if tokens need refresh and refresh if necessary
   */
  async refreshTokensIfNeeded(): Promise<void> {
    if (!this.cachedTokens || !this.cachedTokenExpiresAt) {
      return; // No tokens to refresh
    }

    const expiryDate = new Date(this.cachedTokenExpiresAt);
    const now = new Date();
    const bufferMs = 5 * 60 * 1000; // Refresh 5 minutes before expiry

    if (expiryDate.getTime() - bufferMs > now.getTime()) {
      return; // Token still valid
    }

    if (!this.cachedTokens.refresh_token) {
      throw new Error("Token expired and no refresh token available");
    }

    console.log("GitHub OAuth tokens expired or expiring soon, refreshing...");

    // The MCP SDK's StreamableHTTPClientTransport should handle token refresh
    // We need to reconnect to trigger the refresh
    if (!this.client || !this.oauthProvider) {
      throw new Error("Client not initialized");
    }

    try {
      const baseUrl = new URL(this.serverUrl);
      const transport = new StreamableHTTPClientTransport(baseUrl, {
        authProvider: this.oauthProvider,
      });

      // Disconnect and reconnect to trigger token refresh
      this.client.close();
      await this.client.connect(transport);
      this.connected = true;
      this.cacheTokensFromProvider();

      console.log("GitHub OAuth tokens refreshed successfully");
    } catch (error) {
      console.error("GitHub token refresh failed:", error);
      throw new Error("Failed to refresh GitHub OAuth token");
    }
  }

  async listTools(): Promise<ListToolsResult> {
    // Initialize if not already initialized (e.g., when retrieved from sessionStore)
    if (!this.client || !this.oauthProvider) {
      console.log("[GitHubOAuth] Client not initialized in listTools, initializing...");

      // Log token availability for debugging
      console.log("[GitHubOAuth] Token status before initialization:", {
        hasCachedTokens: !!this.cachedTokens,
        cachedTokenPreview: this.cachedTokens?.access_token ? `${this.cachedTokens.access_token.substring(0, 20)}...` : 'none',
        sessionId: this.sessionId
      });

      this.initialize();

      // After initialization, verify tokens are available
      if (this.oauthProvider && !this.oauthProvider.tokens()) {
        console.error("[GitHubOAuth] Tokens still not available after initialization!");
        console.error("[GitHubOAuth] Debug info:", {
          hasCachedTokens: !!this.cachedTokens,
          hasOAuthProvider: !!this.oauthProvider,
          hasClient: !!this.client,
          sessionId: this.sessionId
        });
        throw new Error("OAuth tokens not available. Please reconnect your GitHub account.");
      }
    }

    // TypeScript guard: ensure oauthProvider and client are not null after initialization
    if (!this.oauthProvider || !this.client) {
      throw new Error("OAuth provider or client failed to initialize");
    }

    // Refresh tokens if needed before making request
    await this.refreshTokensIfNeeded();

    // For HTTP-based MCP servers, we need to ensure we have a transport connection
    // Reconnect if not connected (connections are stateless for HTTP)
    if (!this.connected) {
      console.log("[GitHubOAuth] Client not connected, reconnecting for listTools");
      const baseUrl = new URL(this.serverUrl);
      const transport = new StreamableHTTPClientTransport(baseUrl, {
        authProvider: this.oauthProvider,
      });
      // Close existing connection if any
      try {
        this.client.close();
      } catch (e) {
        // Ignore close errors
      }
      await this.client.connect(transport);
      this.connected = true;
    }

    const request: ListToolsRequest = {
      method: "tools/list",
      params: {},
    };

    return await this.client.request(request, ListToolsResultSchema);
  }

  async callTool(
    toolName: string,
    toolArgs: Record<string, unknown>
  ): Promise<CallToolResult> {
    // Initialize if not already initialized (e.g., when retrieved from sessionStore)
    if (!this.client || !this.oauthProvider) {
      console.log("[GitHubOAuth] Client not initialized in callTool, initializing...");
      this.initialize();
    }

    // TypeScript guard: ensure oauthProvider and client are not null after initialization
    if (!this.oauthProvider || !this.client) {
      throw new Error("OAuth provider or client failed to initialize");
    }

    // Refresh tokens if needed before making request
    await this.refreshTokensIfNeeded();

    // For HTTP-based MCP servers, we need to ensure we have a transport connection
    // Reconnect if not connected (connections are stateless for HTTP)
    if (!this.connected) {
      console.log("[GitHubOAuth] Client not connected, reconnecting for callTool");
      const baseUrl = new URL(this.serverUrl);
      const transport = new StreamableHTTPClientTransport(baseUrl, {
        authProvider: this.oauthProvider,
      });
      // Close existing connection if any
      if (this.client) {
        try {
          this.client.close();
        } catch (e) {
          // Ignore close errors
        }
      }
      await this.client.connect(transport);
      this.connected = true;
    }

    const request: CallToolRequest = {
      method: "tools/call",
      params: {
        name: toolName,
        arguments: toolArgs,
      },
    };

    return await this.client.request(request, CallToolResultSchema);
  }

  disconnect(): void {
    this.client = null;
    this.oauthProvider = null;
    this.connected = false;
    this.cachedTokens = undefined;
    this.cachedTokenExpiresAt = undefined;
  }

  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  getTokens(): OAuthTokens | undefined {
    if (!this.cachedTokens && this.oauthProvider) {
      this.cacheTokensFromProvider();
    }
    return this.cachedTokens;
  }

  getTokenExpiry(): string | undefined {
    if (!this.cachedTokenExpiresAt && this.oauthProvider) {
      this.cachedTokenExpiresAt = this.oauthProvider.tokensExpireAt();
    }
    return this.cachedTokenExpiresAt;
  }

  /**
   * Get provider state for rehydration (includes code verifier)
   */
  getProviderState(): { codeVerifier?: string } | undefined {
    if (!this.oauthProvider) {
      return undefined;
    }
    // Access the private code verifier through the provider
    const codeVerifier = (this.oauthProvider as any)._codeVerifier;
    if (!codeVerifier) {
      return undefined;
    }
    return { codeVerifier };
  }

  /**
   * Restore provider state (code verifier) for rehydration
   */
  restoreProviderState(state: { codeVerifier?: string }): void {
    if (!this.oauthProvider && state.codeVerifier) {
      // If provider doesn't exist yet, we'll set it during initialize()
      // Store it temporarily
      (this as any)._pendingCodeVerifier = state.codeVerifier;
    } else if (this.oauthProvider && state.codeVerifier) {
      this.oauthProvider.saveCodeVerifier(state.codeVerifier);
    }
  }

  async connectWithStoredSession(options: {
    tokens: OAuthTokens;
    expiresAt?: string;
  }): Promise<void> {
    if (!process.env.GITHUB_MCP_CLIENT_ID || !process.env.GITHUB_MCP_CLIENT_SECRET) {
      throw new Error(
        "GitHub MCP OAuth credentials not configured. Please set GITHUB_MCP_CLIENT_ID and GITHUB_MCP_CLIENT_SECRET environment variables."
      );
    }

    this.oauthProvider = new GitHubOAuthClientProvider(
      this.callbackUrl,
      () => {}
    );

    this.oauthProvider.restoreTokens(options.tokens, options.expiresAt);

    this.client = new Client(
      {
        name: "AffinityBots-github-mcp-client",
        version: "1.0.0",
      },
      { capabilities: {} }
    );

    this.cachedTokens = options.tokens;
    this.cachedTokenExpiresAt = options.expiresAt;
    await this.attemptConnection();
  }

  isConnected(): boolean {
    return this.connected;
  }

  private cacheTokensFromProvider(): void {
    if (!this.oauthProvider) return;
    const tokens = this.oauthProvider.tokens();
    if (tokens) {
      this.cachedTokens = tokens;
      this.cachedTokenExpiresAt = this.oauthProvider.tokensExpireAt();
    }
  }
}
