import { URL } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  OAuthClientInformation,
  OAuthClientInformationFull,
  OAuthClientMetadata,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";

// Re-export OAuthTokens for use in other modules
export type { OAuthTokens };
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

class InMemoryOAuthClientProvider implements OAuthClientProvider {
  private _clientInformation?: OAuthClientInformationFull;
  private _tokens?: OAuthTokens;
  private _tokenExpiresAt?: string;
  private _codeVerifier?: string;

  constructor(
    private readonly _redirectUrl: string | URL,
    private readonly _clientMetadata: OAuthClientMetadata,
    onRedirect?: (url: URL) => void
  ) {
    this._onRedirect =
      onRedirect ||
      ((url) => {
        console.log(`Redirect to: ${url.toString()}`);
      });
  }

  private _onRedirect: (url: URL) => void;

  get redirectUrl(): string | URL {
    return this._redirectUrl;
  }

  get clientMetadata(): OAuthClientMetadata {
    return this._clientMetadata;
  }

  clientInformation(): OAuthClientInformation | undefined {
    return this._clientInformation;
  }

  saveClientInformation(clientInformation: OAuthClientInformationFull): void {
    this._clientInformation = clientInformation;
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
    this._onRedirect(authorizationUrl);
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

  // Export minimal state necessary to resume OAuth after redirect
  exportState(): { clientInformation?: OAuthClientInformationFull; codeVerifier?: string } {
    return { clientInformation: this._clientInformation, codeVerifier: this._codeVerifier };
  }

  // Import previously saved state (rehydration)
  importState(state: { clientInformation?: OAuthClientInformationFull; codeVerifier?: string }): void {
    if (state.clientInformation) {
      this._clientInformation = state.clientInformation;
    }
    if (state.codeVerifier) {
      this._codeVerifier = state.codeVerifier;
    }
  }
}

export class MCPOAuthClient {
  private client: Client | null = null;
  private oauthProvider: InMemoryOAuthClientProvider | null = null;
  private connected = false;
  private cachedTokens?: OAuthTokens;
  private cachedTokenExpiresAt?: string;

  constructor(
    private serverUrl: string,
    private callbackUrl: string,
    private onRedirect: (url: string) => void
  ) {}

  /**
   * Returns serializable provider state (client_id and PKCE verifier) for rehydration.
   */
  getProviderState(): { clientInformation?: OAuthClientInformationFull; codeVerifier?: string } | null {
    if (!this.oauthProvider) return null;
    return this.oauthProvider.exportState();
  }

  /**
   * Prepare client/provider using previously saved state without initiating a network connect.
   */
  prepareWithState(state: { clientInformation?: OAuthClientInformationFull; codeVerifier?: string }): void {
    const clientMetadata: OAuthClientMetadata = {
      client_name: "Next.js MCP OAuth Client",
      redirect_uris: [this.callbackUrl],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "client_secret_post",
      scope: "mcp:tools",
    };

    this.oauthProvider = new InMemoryOAuthClientProvider(
      this.callbackUrl,
      clientMetadata,
      () => {}
    );
    this.oauthProvider.importState(state);

    this.client = new Client(
      { name: "nextjs-oauth-client", version: "1.0.0" },
      { capabilities: {} }
    );
  }

  async connect(): Promise<void> {
    const clientMetadata: OAuthClientMetadata = {
      client_name: "Next.js MCP OAuth Client",
      redirect_uris: [this.callbackUrl],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "client_secret_post",
      scope: "mcp:tools",
    };

    this.oauthProvider = new InMemoryOAuthClientProvider(
      this.callbackUrl,
      clientMetadata,
      (redirectUrl: URL) => {
        this.onRedirect(redirectUrl.toString());
      }
    );

    this.client = new Client(
      {
        name: "nextjs-oauth-client",
        version: "1.0.0",
      },
      { capabilities: {} }
    );

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
    if (!this.client || !this.oauthProvider) {
      throw new Error("Client not initialized");
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

    console.log("MCP OAuth tokens expired or expiring soon, refreshing...");

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

      console.log("MCP OAuth tokens refreshed successfully");
    } catch (error) {
      console.error("Token refresh failed:", error);
      throw new Error("Failed to refresh OAuth token");
    }
  }

  async listTools(): Promise<ListToolsResult> {
    if (!this.client) {
      throw new Error("Not connected to server");
    }

    // Refresh tokens if needed before making request
    await this.refreshTokensIfNeeded();

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
    if (!this.client) {
      throw new Error("Not connected to server");
    }

    // Refresh tokens if needed before making request
    await this.refreshTokensIfNeeded();

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

  async connectWithStoredSession(options: {
    tokens: OAuthTokens;
    expiresAt?: string;
    providerState?: { clientInformation?: OAuthClientInformationFull; codeVerifier?: string };
  }): Promise<void> {
    const clientMetadata: OAuthClientMetadata = {
      client_name: "Next.js MCP OAuth Client",
      redirect_uris: [this.callbackUrl],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "client_secret_post",
      scope: "mcp:tools",
    };

    this.oauthProvider = new InMemoryOAuthClientProvider(
      this.callbackUrl,
      clientMetadata,
      () => {}
    );

    if (options.providerState) {
      this.oauthProvider.importState(options.providerState);
    }

    this.oauthProvider.restoreTokens(options.tokens, options.expiresAt);
    this.client = new Client(
      {
        name: "nextjs-oauth-client",
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
