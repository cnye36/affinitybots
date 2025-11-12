import { getValidGoogleTokens, GoogleOAuthTokens } from "@/lib/oauth/googleOAuthClient"

export interface GmailMCPExecuteRequest {
  tool: string
  arguments?: Record<string, any>
  tokens: {
    access_token: string
    refresh_token?: string
    expiry_date?: number
  }
}

export interface GmailMCPExecuteResponse {
  success: boolean
  result?: any
  content?: Array<{ type: string; text: string }>
  error?: string
}

/**
 * Client for the custom Gmail MCP server that expects tokens per request
 * This server runs separately and doesn't follow the standard MCP OAuth flow
 * Uses the same pattern as GoogleDriveMCPClient
 */
export class GmailMCPClient {
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
      throw new Error("No tokens configured for Gmail MCP client. Please reconnect your Google account.")
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
        console.log("Gmail tokens refreshed successfully")
      }

      return validTokens
    } catch (error) {
      console.error("Failed to get valid Google tokens for Gmail:", error)
      throw new Error("Gmail authentication failed. Please reconnect your Google account.")
    }
  }

  /**
   * Execute a tool on the Gmail MCP server
   */
  async executeTool(toolName: string, toolArgs?: Record<string, any>): Promise<any> {
    console.log(`GmailMCPClient: Executing tool ${toolName} on ${this.serverUrl}`)
    
    const tokens = await this.getValidTokens()

    const requestBody: GmailMCPExecuteRequest = {
      tool: toolName,
      arguments: toolArgs || {},
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
      },
    }

    try {
      console.log(`GmailMCPClient: Making request to ${this.serverUrl}/mcp/execute`)
      const response = await fetch(`${this.serverUrl}/mcp/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.access_token}`,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      })

      console.log(`GmailMCPClient: Response status ${response.status}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error(`GmailMCPClient: Server error ${response.status}:`, errorData)
        throw new Error(errorData.error || `Gmail MCP server error (${response.status})`)
      }

      const result: GmailMCPExecuteResponse = await response.json()

      // Handle both old format (success/result) and new format (content array)
      if (result.content && Array.isArray(result.content)) {
        console.log(`GmailMCPClient: Tool ${toolName} executed successfully (MCP format)`)
        // Parse the text content from MCP response
        const textContent = result.content.find((c: any) => c.type === 'text')
        return textContent ? JSON.parse(textContent.text) : result.content
      }

      if (result.success === false || result.error) {
        console.error(`GmailMCPClient: Tool execution failed:`, result.error)
        throw new Error(result.error || "Gmail tool execution failed")
      }

      console.log(`GmailMCPClient: Tool ${toolName} executed successfully`)
      return result.result || result
    } catch (error) {
      console.error(`Error executing Gmail tool ${toolName}:`, error)
      throw error
    }
  }

  /**
   * List available tools from the Gmail MCP server
   */
  async listTools(): Promise<Array<{ name: string; description?: string; inputSchema?: any }>> {
    try {
      const tokens = this.tokens ? await this.getValidTokens() : null
      const response = await fetch(`${this.serverUrl}/mcp/tools`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(tokens ? { Authorization: `Bearer ${tokens.access_token}` } : {}),
        },
      })

      if (!response.ok) {
        console.warn("Failed to list tools from Gmail MCP server")
        return []
      }

      const data = await response.json()
      return data.tools || []
    } catch (error) {
      console.error("Error listing Gmail tools:", error)
      return []
    }
  }

  /**
   * Check if the MCP server is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      console.log(`GmailMCPClient: Health check for ${this.serverUrl}`)
      const tokens = this.tokens ? await this.getValidTokens() : null
      const response = await fetch(`${this.serverUrl}/health`, {
        method: "GET",
        headers: {
          ...(tokens ? { Authorization: `Bearer ${tokens.access_token}` } : {}),
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      
      const isHealthy = response.ok
      console.log(`GmailMCPClient: Health check ${isHealthy ? 'passed' : 'failed'} (${response.status})`)
      return isHealthy
    } catch (error) {
      console.error("Gmail MCP server health check failed:", error)
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
 * Create a GmailMCPClient from stored server configuration
 */
export async function createGmailClient(
  userId: string,
  serverConfig: {
    url: string
    oauth_token?: string
    refresh_token?: string | null
    expires_at?: string | null
  }
): Promise<GmailMCPClient> {
  const client = new GmailMCPClient(serverConfig.url, userId)

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

