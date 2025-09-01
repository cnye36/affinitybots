import { mcpClientFactory } from './mcpClientFactory';
import { mcpSessionManager } from './mcpSessionManager';
import { mcpDiagnostics } from './mcpDiagnostics';
import { AssistantConfiguration } from '@/types/assistant';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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
          await this.storeOAuthAttempt(userId, serverName, result.sessionId, serverUrl, callbackUrl);
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

      await mcpClientFactory.completeOAuth(sessionId, authCode);

      // Update database with successful authentication
      await this.updateOAuthCompletion(sessionId, userId);

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

  private async storeOAuthAttempt(userId: string, serverName: string, sessionId: string, serverUrl: string, callbackUrl: string): Promise<void> {
    const insertData = {
      user_id: userId,
      qualified_name: serverName,
      session_id: sessionId,
      url: serverUrl,
      // Persist callbackUrl so we can reconstruct the OAuth client on callback
      config: { callbackUrl }, // satisfies not-null constraint
      is_enabled: false, // Will be enabled after successful auth
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Storing OAuth attempt with data:', JSON.stringify(insertData, null, 2));
    
    const { error } = await this.getSupabase()
      .from('user_mcp_servers')
      .upsert(insertData);

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
      .upsert(insertData);

    if (error) {
      console.error('Failed to store successful connection:', error);
    } else {
      console.log('Successfully stored successful connection');
    }
  }

  private async updateOAuthCompletion(sessionId: string, userId: string): Promise<void> {
    const { error } = await this.getSupabase()
      .from('user_mcp_servers')
      .update({
        is_enabled: true,
        oauth_token: 'present', // We don't store the actual token for security
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to update OAuth completion:', error);
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
}

// Export singleton instance
export const mcpWebInterface = MCPWebInterface.getInstance();