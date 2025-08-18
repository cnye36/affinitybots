import {
  Client,
} from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  OAuthClientProvider,
  UnauthorizedError,
} from "@modelcontextprotocol/sdk/client/auth.js";

class NotionOAuthClientProvider implements OAuthClientProvider {
  private _redirectUrl: URL;
  private _onRedirect?: (url: URL) => void;
  private _codeVerifier?: string;
  private _tokens?: any;

  constructor(redirectUrl: string, onRedirect?: (url: URL) => void) {
    this._redirectUrl = new URL(redirectUrl);
    this._onRedirect = onRedirect;
  }

  get redirectUrl(): URL {
    return this._redirectUrl;
  }

  get clientMetadata() {
    return {
      redirect_uris: [this._redirectUrl.toString()],
      scope: "read write",
    };
  }

  get clientInformation() {
    return async () => ({
      client_id: process.env.NOTION_CLIENT_ID!,
      client_secret: process.env.NOTION_CLIENT_SECRET,
    });
  }

  get tokens() {
    return () => this._tokens;
  }

  saveTokens(tokens: any): void {
    this._tokens = tokens;
  }

  async getAuthProvider(): Promise<{
    clientId: string;
    clientSecret: string;
    authorizationUrl: string;
    tokenUrl: string;
    scopes: string[];
  }> {
    const clientId = process.env.NOTION_CLIENT_ID;
    const clientSecret = process.env.NOTION_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        "Notion OAuth credentials not configured. Please set NOTION_CLIENT_ID and NOTION_CLIENT_SECRET environment variables."
      );
    }

    return {
      clientId,
      clientSecret,
      authorizationUrl: "https://api.notion.com/v1/oauth/authorize?client_id=250d872b-594c-8080-8ca4-003713de92c5&response_type=code&owner=user&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fmcp%2Fauth%2Fcallback",
      tokenUrl: "https://mcp.notion.com/mcp/token",
      scopes: ["read", "write"],
    };
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
    // Return empty string if not available (confidential clients may not require PKCE)
    return this._codeVerifier || "";
  }
}

export class NotionOAuthClient {
  private client: Client | null = null;
  private oauthProvider: NotionOAuthClientProvider | null = null;
  private sessionId: string | null = null;

  constructor(
    private serverUrl: string,
    private callbackUrl: string,
    private onRedirect: (url: string) => void
  ) {}

  async connect(): Promise<void> {
    // Validate that we have the required environment variables
    if (!process.env.NOTION_CLIENT_ID || !process.env.NOTION_CLIENT_SECRET) {
      throw new Error(
        "Notion OAuth credentials not configured. Please set NOTION_CLIENT_ID and NOTION_CLIENT_SECRET environment variables."
      );
    }

    this.oauthProvider = new NotionOAuthClientProvider(
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
        name: "agenthub-notion-mcp-client",
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
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw new Error("OAuth authorization required");
      } else {
        throw error;
      }
    }
  }

  async finishAuth(authCode: string): Promise<void> {
    // If reconstructed, initialize the pieces needed to finish auth
    if (!this.oauthProvider) {
      this.oauthProvider = new NotionOAuthClientProvider(
        this.callbackUrl,
        () => {}
      );
    }
    if (!this.client) {
      this.client = new Client(
        { name: "agenthub-notion-mcp-client", version: "1.0.0" },
        { capabilities: {} }
      );
    }

    const baseUrl = new URL(this.serverUrl);
    const transport = new StreamableHTTPClientTransport(baseUrl, {
      authProvider: this.oauthProvider,
    });

    await transport.finishAuth(authCode);
    await this.client.connect(transport);
  }

  async listTools(): Promise<any> {
    if (!this.client) {
      throw new Error("Not connected to server");
    }
    return await this.client.listTools();
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
  }
}
