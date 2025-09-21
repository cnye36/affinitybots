import { mcpClientFactory } from './mcpClientFactory';
import { sessionStore } from '@/lib/sessionStore';
import { MCPOAuthClient } from '@/lib/oauthClient';
import { GitHubOAuthClient } from '@/lib/githubOauthClient';
import { mcpSessionManager } from './mcpSessionManager';
import { mcpDiagnostics } from './mcpDiagnostics';
import { AssistantConfiguration } from '@/types/assistant';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { OAuthTokens } from "@modelcontextprotocol/sdk/shared/auth.js";

export interface MCPServerConnectRequest {
  serverUrl: string;
  callbackUrl: string;
  userId: string;
  serverName?: string;
}

export interface MCPServerConnectResponse {
  success: boolean;
  sessionId?: string;
  requiresAuth?: boolean;
  authUrl?: string;
  error?: string;
}

export interface MCPToolCallRequest {
  userId: string;
  agentConfig: AssistantConfiguration;
  toolName: string;
  toolArgs: Record<string, unknown>;
}

export interface MCPToolCallResponse {
  success: boolean;
  result?: any;
  error?: string;
}

export interface MCPDiagnosticRequest {
  userId: string;
  agentConfig: AssistantConfiguration;
  includeAutoFix?: boolean;
}

export interface MCPDiagnosticResponse {
  success: boolean;
  diagnostics?: any;
  autoFix?: any;
  error?: string;
}

/**
 * Web interface for MCP OAuth management - used by Next.js API routes
 */
export class MCPWebInterface {
  private static instance: MCPWebInterface;
  private supabase: SupabaseClient | null = null;

  static getInstance(): MCPWebInterface {
    if (!MCPWebInterface.instance) {
      MCPWebInterface.instance = new MCPWebInterface();
    }
    return MCPWebInterface.instance;
  }

  private constructor() {}

  private getSupabase(): SupabaseClient {
    if (!this.supabase) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) {
        throw new Error('supabaseKey is required.');
      }
      this.supabase = createClient(url, key);
    }
    return this.supabase;
  }

  /**
   * Initiates connection to an MCP server (handles both OAuth and API key flows)
   */
  async connectServer(request: MCPServerConnectRequest): Promise<MCPServerConnectResponse> {
    try {
      const { serverUrl, callbackUrl, userId, serverName } = request;

      console.log(`MCPWebInterface: Connecting to ${serverUrl} for user ${userId}`);

      // Try to connect using the OAuth client
      const result = await mcpClientFactory.initiateOAuth(serverUrl, callbackUrl);

      if (result.requiresAuth && result.authUrl) {
        // OAuth flow required
        console.log(`OAuth required for ${serverUrl}, redirecting to: ${result.authUrl}`);
        
        // Store the server connection attempt in database for later completion
        if (serverName) {
          await this.storeOAuthAttempt(userId, serverName, result.sessionId, serverUrl, callbackUrl, (result as any).providerState);
        }

        return {
          success: false,
          requiresAuth: true,
          authUrl: result.authUrl,
          sessionId: result.sessionId
        };
      } else {
        // Direct connection succeeded
        console.log(`Direct connection succeeded for ${serverUrl}`);
        
        // Store successful connection
        if (serverName) {
          await this.storeSuccessfulConnection(userId, serverName, result.sessionId, serverUrl);
        }

        return {
          success: true,
          sessionId: result.sessionId
        };
      }
    } catch (error) {
      console.error('MCPWebInterface: Connect error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Completes OAuth authentication for a server
  */
  async finishAuth(sessionId: string, authCode: string, userId: string): Promise<MCPServerConnectResponse> {
    try {
      console.log(`MCPWebInterface: Finishing OAuth for session ${sessionId}`);

      const supabase = this.getSupabase();
      let serverRow: { url: string; config: any; qualified_name?: string } | null = null;

      try {
        const { data, error } = await supabase
          .from('user_mcp_servers')
          .select('url, config, qualified_name')
          .eq('user_id', userId)
          .eq('session_id', sessionId)
          .single();
        if (!error && data) {
          serverRow = data;
        } else if (error) {
          console.warn('Failed to load MCP server row during OAuth finish:', error);
        }
      } catch (fetchError) {
        console.warn('Unexpected error loading MCP server row during OAuth finish:', fetchError);
      }

      // Rehydrate OAuth client if serverless/dev hot-reload dropped in-memory session
      if (!sessionStore.getClient(sessionId)) {
        try {
          if (serverRow?.url) {
            const callbackUrl =
              serverRow.config?.callbackUrl ||
              `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mcp/auth/callback`;
            const isGitHub =
              serverRow.url.includes('githubcopilot.com') || serverRow.url.includes('github.com');
            let client: GitHubOAuthClient | MCPOAuthClient;
            if (isGitHub) {
              client = new GitHubOAuthClient(serverRow.url, callbackUrl, () => {});
            } else {
              const mcpClient = new MCPOAuthClient(serverRow.url, callbackUrl, () => {});
              const state = serverRow.config?.providerState;
              if (state) {
                try { mcpClient.prepareWithState(state); } catch {}
              }
              client = mcpClient;
            }
            // Store reconstructed client so finishOAuth can succeed
            sessionStore.setClient(sessionId, client as any);
            // Avoid calling connect() here to prevent new client_id registration. We'll finishAuth directly.
          } else {
            console.warn('No DB record found to rehydrate OAuth client for session', sessionId);
          }
        } catch (rehydrateError) {
          console.warn('Failed to rehydrate OAuth client from DB', rehydrateError);
        }
      }

      await mcpClientFactory.completeOAuth(sessionId, authCode);

      // Update database with successful authentication and persist tokens/state
      const client = sessionStore.getClient(sessionId);
      let tokens: OAuthTokens | undefined;
      let expiresAt: string | undefined;
      let providerState = serverRow?.config?.providerState;

      if (client instanceof MCPOAuthClient) {
        tokens = client.getTokens();
        expiresAt = client.getTokenExpiry();
        providerState = client.getProviderState() || providerState;
      } else if (client instanceof GitHubOAuthClient) {
        tokens = client.getTokens();
        expiresAt = client.getTokenExpiry();
      }

      await this.updateOAuthCompletion(sessionId, userId, {
        tokens,
        expiresAt,
        providerState,
        existingConfig: serverRow?.config || {},
      });

      console.log(`OAuth completed successfully for session ${sessionId}`);

      return {
        success: true,
        sessionId
      };
    } catch (error) {
      console.error('MCPWebInterface: OAuth finish error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Disconnects from an MCP server
   */
  async disconnectServer(sessionId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`MCPWebInterface: Disconnecting session ${sessionId} for user ${userId}`);

      await mcpClientFactory.disconnectOAuth(sessionId);
      
      // Remove from database
      await this.removeServerConnection(sessionId, userId);

      return { success: true };
    } catch (error) {
      console.error('MCPWebInterface: Disconnect error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Lists available tools for a user's agent configuration
   */
  async listTools(userId: string, agentConfig: AssistantConfiguration): Promise<{
    success: boolean;
    tools?: any[];
    serverCount?: number;
    error?: string;
  }> {
    try {
      console.log(`MCPWebInterface: Listing tools for user ${userId}`);

      const result = await mcpClientFactory.createForAgent(userId, agentConfig);

      return {
        success: true,
        tools: result.tools,
        serverCount: result.serverCount
      };
    } catch (error) {
      console.error('MCPWebInterface: List tools error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Calls a tool (for testing purposes)
   */
  async callTool(request: MCPToolCallRequest): Promise<MCPToolCallResponse> {
    try {
      const { userId, agentConfig, toolName, toolArgs } = request;

      console.log(`MCPWebInterface: Calling tool ${toolName} for user ${userId}`);

      const factoryResult = await mcpClientFactory.createForAgent(userId, agentConfig);

      // Find the tool
      const tool = factoryResult.tools.find(t => t.name === toolName);
      if (!tool) {
        return {
          success: false,
          error: `Tool ${toolName} not found`
        };
      }

      // Call the tool
      const result = await tool.invoke(toolArgs);

      return {
        success: true,
        result
      };
    } catch (error) {
      console.error('MCPWebInterface: Tool call error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Runs diagnostics for a user's MCP setup
   */
  async runDiagnostics(request: MCPDiagnosticRequest): Promise<MCPDiagnosticResponse> {
    try {
      const { userId, agentConfig, includeAutoFix = false } = request;

      console.log(`MCPWebInterface: Running diagnostics for user ${userId}`);

      const diagnostics = await mcpDiagnostics.runDiagnostics(userId, agentConfig);
      
      let autoFix;
      if (includeAutoFix) {
        autoFix = await mcpDiagnostics.autoFix(userId, agentConfig);
      }

      return {
        success: true,
        diagnostics,
        autoFix
      };
    } catch (error) {
      console.error('MCPWebInterface: Diagnostics error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Gets the diagnostic report as a formatted string
   */
  async getDiagnosticReport(userId: string, agentConfig: AssistantConfiguration): Promise<{
    success: boolean;
    report?: string;
    error?: string;
  }> {
    try {
      const diagnostics = await mcpDiagnostics.runDiagnostics(userId, agentConfig);
      const report = mcpDiagnostics.generateReport(diagnostics);

      return {
        success: true,
        report
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Cleans up expired sessions
   */
  async cleanupSessions(): Promise<{
    success: boolean;
    cleaned?: number;
    errors?: string[];
  }> {
    try {
      const result = await mcpSessionManager.cleanupExpiredSessions();
      return {
        success: true,
        cleaned: result.cleaned,
        errors: result.errors
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  // Private helper methods

  private async storeOAuthAttempt(userId: string, serverName: string, sessionId: string, serverUrl: string, callbackUrl: string, providerState?: any): Promise<void> {
    const insertData = {
      user_id: userId,
      qualified_name: serverName,
      session_id: sessionId,
      url: serverUrl,
      // Persist callbackUrl so we can reconstruct the OAuth client on callback
      config: { callbackUrl, providerState }, // satisfies not-null constraint
      is_enabled: false, // Will be enabled after successful auth
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Storing OAuth attempt with data:', JSON.stringify(insertData, null, 2));
    
    const { error } = await this.getSupabase()
      .from('user_mcp_servers')
      .upsert(insertData, { onConflict: 'user_id,qualified_name' });

    if (error) {
      console.error('Failed to store OAuth attempt:', error);
    } else {
      console.log('Successfully stored OAuth attempt');
    }
  }

  private async storeSuccessfulConnection(userId: string, serverName: string, sessionId: string, serverUrl: string): Promise<void> {
    const insertData = {
      user_id: userId,
      qualified_name: serverName,
      session_id: sessionId,
      url: serverUrl,
      config: {}, // Add empty config object to satisfy not-null constraint
      is_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Storing successful connection with data:', JSON.stringify(insertData, null, 2));
    
    const { error } = await this.getSupabase()
      .from('user_mcp_servers')
      .upsert(insertData, { onConflict: 'user_id,qualified_name' });

    if (error) {
      console.error('Failed to store successful connection:', error);
    } else {
      console.log('Successfully stored successful connection');
    }
  }

  private async updateOAuthCompletion(
    sessionId: string,
    userId: string,
    options: {
      tokens?: OAuthTokens;
      expiresAt?: string;
      providerState?: any;
      existingConfig: Record<string, any>;
    }
  ): Promise<void> {
    try {
      const updates: Record<string, any> = {
        is_enabled: true,
        updated_at: new Date().toISOString(),
      };

      if (options.tokens) {
        updates.oauth_token = options.tokens.access_token ?? null;
        updates.refresh_token = options.tokens.refresh_token ?? null;
      }
      if (options.expiresAt) {
        updates.expires_at = options.expiresAt;
      } else if (options.tokens && !options.expiresAt) {
        updates.expires_at = null;
      }

      const existingConfig = options.existingConfig || {};
      const updatedConfig = { ...existingConfig };

      if (options.providerState) {
        updatedConfig.providerState = options.providerState;
      }

      if (existingConfig?.callbackUrl) {
        updatedConfig.callbackUrl = existingConfig.callbackUrl;
      }

      if (options.tokens || options.expiresAt) {
        const tokenMetadata = { ...(existingConfig.tokenMetadata || {}) };
        if (options.tokens?.token_type) {
          tokenMetadata.token_type = options.tokens.token_type;
        }
        if (options.tokens?.scope) {
          tokenMetadata.scope = options.tokens.scope;
        }
        if (options.expiresAt) {
          tokenMetadata.expires_at = options.expiresAt;
        }
        updatedConfig.tokenMetadata = tokenMetadata;
      }

      updates.config = updatedConfig;

      const { error } = await this.getSupabase()
        .from('user_mcp_servers')
        .update(updates)
        .eq('session_id', sessionId)
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to update OAuth completion:', error);
      }
    } catch (error) {
      console.error('Unexpected error while updating OAuth completion:', error);
    }
  }

  private async removeServerConnection(sessionId: string, userId: string): Promise<void> {
    const { error } = await this.getSupabase()
      .from('user_mcp_servers')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to remove server connection:', error);
    }
  }

  /**
   * Disconnects a server connection by its qualified name for the current user
   */
  async disconnectServerByName(serverName: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Look up the server row to find any active session_id
      const { data: row, error: fetchError } = await this.getSupabase()
        .from('user_mcp_servers')
        .select('session_id')
        .eq('user_id', userId)
        .eq('qualified_name', serverName)
        .single();

      if (fetchError) {
        if ((fetchError as any).code === 'PGRST116') {
          return { success: true }; // Nothing to do
        }
        throw new Error(fetchError.message);
      }

      // If there's an in-memory OAuth session, disconnect it
      if (row?.session_id) {
        try {
          await mcpClientFactory.disconnectOAuth(row.session_id);
        } catch (e) {
          // Best-effort; continue to delete DB row
          console.warn('Warning disconnecting OAuth session for', serverName, e);
        }
      }

      // Delete the server row
      const { error: deleteError } = await this.getSupabase()
        .from('user_mcp_servers')
        .delete()
        .eq('user_id', userId)
        .eq('qualified_name', serverName);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

// Export singleton instance
export const mcpWebInterface = MCPWebInterface.getInstance();
