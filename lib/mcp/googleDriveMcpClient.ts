import { getValidGoogleTokens, GoogleOAuthTokens } from "@/lib/oauth/googleOAuthClient"

export interface GoogleDriveMCPExecuteRequest {
  tool: string
  arguments?: Record<string, any>
  tokens: {
    access_token: string
    refresh_token?: string
    expiry_date?: number
  }
}

export interface GoogleDriveMCPExecuteResponse {
  success: boolean
  result?: any
  error?: string
}

/**
 * Client for the custom Google Drive MCP server that expects tokens per request
 * This server runs separately and doesn't follow the standard MCP OAuth flow
 */
export class GoogleDriveMCPClient {
  private serverUrl: string
  private userId: string
  private tokens: GoogleOAuthTokens | null = null

  constructor(serverUrl: string, userId: string) {
    this.serverUrl = serverUrl
    this.userId = userId
  }

  /**
   * Set tokens for this client
   */
  setTokens(tokens: GoogleOAuthTokens): void {
    this.tokens = tokens
  }

  /**
   * Get valid tokens, refreshing if necessary
   */
  private async getValidTokens(): Promise<GoogleOAuthTokens> {
    if (!this.tokens) {
      throw new Error("No tokens configured for Google Drive MCP client. Please reconnect your Google account.")
    }

    try {
      // Check if tokens need refresh
      const validTokens = await getValidGoogleTokens(
        this.tokens.access_token,
        this.tokens.refresh_token,
        this.tokens.expiry_date
      )

      // Update cached tokens if they were refreshed
      if (validTokens.access_token !== this.tokens.access_token) {
        this.tokens = validTokens
        console.log("Google Drive tokens refreshed successfully")
      }

      return validTokens
    } catch (error) {
      console.error("Failed to get valid Google tokens:", error)
      throw new Error("Google Drive authentication failed. Please reconnect your account.")
    }
  }

  /**
   * Execute a tool on the Google Drive MCP server
   */
  async executeTool(toolName: string, toolArgs?: Record<string, any>): Promise<any> {
    console.log(`GoogleDriveMCPClient: Executing tool ${toolName} on ${this.serverUrl}`)
    
    const tokens = await this.getValidTokens()

    const requestBody: GoogleDriveMCPExecuteRequest = {
      tool: toolName,
      arguments: toolArgs || {},
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
      },
    }

    try {
      console.log(`GoogleDriveMCPClient: Making request to ${this.serverUrl}/mcp/execute`)
      const response = await fetch(`${this.serverUrl}/mcp/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // New header-based auth for servers expecting Bearer tokens
          Authorization: `Bearer ${tokens.access_token}`,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      })

      console.log(`GoogleDriveMCPClient: Response status ${response.status}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error(`GoogleDriveMCPClient: Server error ${response.status}:`, errorData)
        throw new Error(errorData.error || `MCP server error (${response.status})`)
      }

      const result: GoogleDriveMCPExecuteResponse = await response.json()

      if (!result.success) {
        console.error(`GoogleDriveMCPClient: Tool execution failed:`, result.error)
        throw new Error(result.error || "Tool execution failed")
      }

      console.log(`GoogleDriveMCPClient: Tool ${toolName} executed successfully`)
      return result.result
    } catch (error) {
      console.error(`Error executing Google Drive tool ${toolName}:`, error)
      throw error
    }
  }

  /**
   * List available tools from the Google Drive MCP server
   * Note: This requires a separate endpoint on the MCP server
   */
  async listTools(): Promise<Array<{ name: string; description?: string; inputSchema?: any }>> {
    try {
      // Include Authorization header if tokens are available
      const tokens = this.tokens ? await this.getValidTokens() : null
      const response = await fetch(`${this.serverUrl}/mcp/tools`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(tokens ? { Authorization: `Bearer ${tokens.access_token}` } : {}),
        },
      })

      if (!response.ok) {
        console.warn("Failed to list tools from Google Drive MCP server")
        return []
      }

      const data = await response.json()
      return data.tools || []
    } catch (error) {
      console.error("Error listing Google Drive tools:", error)
      return []
    }
  }

  /**
   * Check if the MCP server is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      console.log(`GoogleDriveMCPClient: Health check for ${this.serverUrl}`)
      // Some deployments may require auth for health; include if available
      const tokens = this.tokens ? await this.getValidTokens() : null
      const response = await fetch(`${this.serverUrl}/health`, {
        method: "GET",
        headers: {
          ...(tokens ? { Authorization: `Bearer ${tokens.access_token}` } : {}),
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      
      const isHealthy = response.ok
      console.log(`GoogleDriveMCPClient: Health check ${isHealthy ? 'passed' : 'failed'} (${response.status})`)
      return isHealthy
    } catch (error) {
      console.error("Google Drive MCP server health check failed:", error)
      return false
    }
  }

  /**
   * Get the updated tokens (in case they were refreshed)
   */
  getTokens(): GoogleOAuthTokens | null {
    return this.tokens
  }
}

/**
 * Create a GoogleDriveMCPClient from stored server configuration
 */
export async function createGoogleDriveClient(
  userId: string,
  serverConfig: {
    url: string
    oauth_token?: string
    refresh_token?: string | null
    expires_at?: string | null
  }
): Promise<GoogleDriveMCPClient> {
  const client = new GoogleDriveMCPClient(serverConfig.url, userId)

  if (serverConfig.oauth_token) {
    const expiryDate = serverConfig.expires_at 
      ? new Date(serverConfig.expires_at).getTime() 
      : undefined

    client.setTokens({
      access_token: serverConfig.oauth_token,
      refresh_token: serverConfig.refresh_token || undefined,
      expiry_date: expiryDate,
    })
  }

  return client
}

