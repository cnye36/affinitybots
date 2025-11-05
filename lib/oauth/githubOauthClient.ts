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
    // Use pre-configured GitHub OAuth app credentials
    this._clientInformation = {
      client_id: process.env.GITHUB_CLIENT_ID!,
      client_secret: process.env.GITHUB_CLIENT_SECRET!,
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
    return this._clientInformation;
  }

  saveClientInformation(clientInformation: OAuthClientInformationFull): void {
    // We already have the client information, so we can ignore this
    console.log("GitHub OAuth client information already configured");
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
    const url = new URL(authorizationUrl);
    const redirectUri = this._redirectUrl.toString();
    url.searchParams.set('redirect_uri', redirectUri);
    
    if (this._onRedirect) {
      this._onRedirect(url);
    } else {
      console.log(`Redirect to: ${url.toString()}`);
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

  async connect(): Promise<void> {
    // Validate that we have the required environment variables
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      throw new Error(
        "GitHub OAuth credentials not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables."
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

    this.client = new Client(
      {
        name: "AffinityBots-github-mcp-client",
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
      throw new Error("Client not initialized. Call connect() first.");
    }

    console.log("GitHubOAuthClient: Finishing OAuth with auth code");

    const baseUrl = new URL(this.serverUrl);
    const transport = new StreamableHTTPClientTransport(baseUrl, {
      authProvider: this.oauthProvider,
    });

    try {
      console.log("GitHubOAuthClient: Exchanging auth code for tokens");
      await transport.finishAuth(authCode);

      console.log("GitHubOAuthClient: Connecting to MCP server");
      await this.client.connect(transport);

      this.connected = true;
      this.cacheTokensFromProvider();

      console.log("GitHubOAuthClient: Successfully completed OAuth flow");
    } catch (error) {
      console.error("GitHubOAuthClient: Error finishing OAuth:", error);
      this.connected = false;
      throw error;
    }
  }

  async listTools(): Promise<ListToolsResult> {
    if (!this.client) {
      throw new Error("Not connected to server");
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
    if (!this.client) {
      throw new Error("Not connected to server");
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

  async connectWithStoredSession(options: {
    tokens: OAuthTokens;
    expiresAt?: string;
  }): Promise<void> {
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      throw new Error(
        "GitHub OAuth credentials not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables."
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
