import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { mcpClientFactory } from './mcpClientFactory';
import { sessionStore } from '@/lib/session-store';
import { AssistantConfiguration } from '@/types/assistant';

export interface SessionRefreshResult {
  refreshed: string[];
  failed: string[];
  expired: string[];
  errors: { [serverName: string]: string };
}

export interface SessionCleanupResult {
  cleaned: number;
  errors: string[];
}

/**
 * Manages MCP OAuth sessions - handles refresh, cleanup, and validation
 */
export class MCPSessionManager {
  private static instance: MCPSessionManager;
  private supabase: SupabaseClient | null = null;

  static getInstance(): MCPSessionManager {
    if (!MCPSessionManager.instance) {
      MCPSessionManager.instance = new MCPSessionManager();
    }
    return MCPSessionManager.instance;
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
   * Refreshes expired OAuth sessions for a user
   */
  async refreshExpiredSessions(userId: string, agentConfig: AssistantConfiguration): Promise<SessionRefreshResult> {
    const result: SessionRefreshResult = {
      refreshed: [],
      failed: [],
      expired: [],
      errors: {}
    };

    try {
      const oauthSessions = agentConfig.mcp_oauth_sessions || [];
      const now = new Date();

      // Identify expired sessions
      for (const session of oauthSessions) {
        if (session.expires_at) {
          const expiryDate = new Date(session.expires_at);
          if (expiryDate < now) {
            result.expired.push(session.server_name);
          }
        }
      }

      console.log(`MCPSessionManager: Found ${result.expired.length} expired sessions for user ${userId}`);

      // Try to refresh expired sessions
      for (const serverName of result.expired) {
        try {
          await this.refreshServerSession(userId, serverName);
          result.refreshed.push(serverName);
          console.log(`✅ Refreshed session for ${serverName}`);
        } catch (error) {
          result.failed.push(serverName);
          result.errors[serverName] = error instanceof Error ? error.message : String(error);
          console.error(`❌ Failed to refresh session for ${serverName}:`, error);
        }
      }

      // Force refresh MCP clients if any sessions were refreshed
      if (result.refreshed.length > 0) {
        console.log(`Clearing MCP cache due to ${result.refreshed.length} refreshed sessions`);
        mcpClientFactory.clearCache();
      }

      return result;
    } catch (error) {
      console.error("Error refreshing OAuth sessions:", error);
      return {
        refreshed: [],
        failed: [],
        expired: [],
        errors: { global: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  /**
   * Refreshes a specific server session
   */
  private async refreshServerSession(userId: string, serverName: string): Promise<void> {
    // Get server info from database
    const { data: serverData, error } = await this.getSupabase()
      .from('user_mcp_servers')
      .select('*')
      .eq('user_id', userId)
      .eq('qualified_name', serverName)
      .single();

    if (error || !serverData) {
      throw new Error(`Server ${serverName} not found for user ${userId}`);
    }

    // If the server has a refresh token, try to use it
    if (serverData.refresh_token) {
      try {
        await this.refreshWithRefreshToken(userId, serverName, serverData.refresh_token);
        return;
      } catch (error) {
        console.warn(`Refresh token failed for ${serverName}, will need re-authorization:`, error);
      }
    }

    // If no refresh token or refresh token failed, mark as needing re-authorization
    await this.markSessionAsExpired(userId, serverName);
    throw new Error(`Session for ${serverName} requires re-authorization`);
  }

  /**
   * Attempts to refresh using a refresh token
   */
  private async refreshWithRefreshToken(userId: string, serverName: string, refreshToken: string): Promise<void> {
    // This would depend on the specific OAuth provider's refresh token flow
    // For now, we'll just mark as expired and require re-authorization
    console.log(`Refresh token flow not yet implemented for ${serverName}`);
    throw new Error("Refresh token flow not implemented");
  }

  /**
   * Marks a session as expired in the database
   */
  private async markSessionAsExpired(userId: string, serverName: string): Promise<void> {
    const { error } = await this.getSupabase()
      .from('user_mcp_servers')
      .update({
        oauth_token: null,
        session_id: null,
        expires_at: null,
        is_enabled: false // Disable expired servers
      })
      .eq('user_id', userId)
      .eq('qualified_name', serverName);

    if (error) {
      console.error(`Failed to mark session as expired for ${serverName}:`, error);
    }
  }

  /**
   * Cleans up expired sessions from memory and database
   */
  async cleanupExpiredSessions(): Promise<SessionCleanupResult> {
    const result: SessionCleanupResult = {
      cleaned: 0,
      errors: []
    };

    try {
      // Clean up expired sessions from database
      const { data: expiredSessions, error } = await this.getSupabase()
        .from('user_mcp_servers')
        .select('session_id, qualified_name, user_id')
        .not('expires_at', 'is', null)
        .lt('expires_at', new Date().toISOString());

      if (error) {
        result.errors.push(`Database query error: ${error.message}`);
        return result;
      }

      console.log(`Found ${expiredSessions?.length || 0} expired sessions to clean up`);

      // Remove from session store and update database
      for (const session of expiredSessions || []) {
        try {
          // Remove from memory
          if (session.session_id) {
            sessionStore.removeClient(session.session_id);
          }

          // Update database
          await this.markSessionAsExpired(session.user_id, session.qualified_name);
          
          result.cleaned++;
          console.log(`Cleaned up expired session for ${session.qualified_name}`);
        } catch (error) {
          result.errors.push(`Failed to clean ${session.qualified_name}: ${error}`);
        }
      }

      // Clear MCP cache to ensure fresh connections
      if (result.cleaned > 0) {
        mcpClientFactory.clearCache();
      }

      return result;
    } catch (error) {
      result.errors.push(`Cleanup error: ${error instanceof Error ? error.message : String(error)}`);
      return result;
    }
  }

  /**
   * Validates that OAuth sessions are still valid
   */
  async validateSessions(userId: string, agentConfig: AssistantConfiguration): Promise<{
    valid: string[];
    invalid: string[];
    errors: { [serverName: string]: string };
  }> {
    const result = {
      valid: [] as string[],
      invalid: [] as string[],
      errors: {} as { [serverName: string]: string }
    };

    const oauthSessions = agentConfig.mcp_oauth_sessions || [];

    for (const session of oauthSessions) {
      try {
        if (session.session_id) {
          const client = sessionStore.getClient(session.session_id);
          if (client) {
            // Try a simple operation to validate the session
            await client.listTools();
            result.valid.push(session.server_name);
          } else {
            result.invalid.push(session.server_name);
            result.errors[session.server_name] = "Session not found in store";
          }
        } else {
          result.invalid.push(session.server_name);
          result.errors[session.server_name] = "No session ID";
        }
      } catch (error) {
        result.invalid.push(session.server_name);
        result.errors[session.server_name] = error instanceof Error ? error.message : String(error);
      }
    }

    return result;
  }

  /**
   * Gets diagnostic information about OAuth sessions
   */
  async getDiagnostics(userId: string): Promise<{
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
    sessionsInMemory: number;
    errors: string[];
  }> {
    try {
      // Get all OAuth sessions for the user
      const { data: allSessions, error } = await this.getSupabase()
        .from('user_mcp_servers')
        .select('*')
        .eq('user_id', userId)
        .not('oauth_token', 'is', null);

      if (error) {
        return {
          totalSessions: 0,
          activeSessions: 0,
          expiredSessions: 0,
          sessionsInMemory: 0,
          errors: [error.message]
        };
      }

      const sessions = allSessions || [];
      const now = new Date();

      let activeSessions = 0;
      let expiredSessions = 0;
      let sessionsInMemory = 0;

      for (const session of sessions) {
        if (session.expires_at) {
          const expiryDate = new Date(session.expires_at);
          if (expiryDate > now) {
            activeSessions++;
          } else {
            expiredSessions++;
          }
        } else {
          activeSessions++; // No expiry date means it's still active
        }

        // Check if session is in memory
        if (session.session_id && sessionStore.getClient(session.session_id)) {
          sessionsInMemory++;
        }
      }

      return {
        totalSessions: sessions.length,
        activeSessions,
        expiredSessions,
        sessionsInMemory,
        errors: []
      };
    } catch (error) {
      return {
        totalSessions: 0,
        activeSessions: 0,
        expiredSessions: 0,
        sessionsInMemory: 0,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Forces cleanup of all sessions for a user (useful for troubleshooting)
   */
  async forceCleanupUserSessions(userId: string): Promise<{ cleaned: number; errors: string[] }> {
    const result = { cleaned: 0, errors: [] as string[] };

    try {
      // Get all sessions for the user
      const { data: userSessions, error } = await this.getSupabase()
        .from('user_mcp_servers')
        .select('session_id, qualified_name')
        .eq('user_id', userId)
        .not('session_id', 'is', null);

      if (error) {
        result.errors.push(error.message);
        return result;
      }

      // Remove from memory and database
      for (const session of userSessions || []) {
        try {
          if (session.session_id) {
            sessionStore.removeClient(session.session_id);
          }
          
          await this.markSessionAsExpired(userId, session.qualified_name);
          result.cleaned++;
        } catch (error) {
          result.errors.push(`Failed to clean ${session.qualified_name}: ${error}`);
        }
      }

      // Clear cache
      mcpClientFactory.clearCache();

      return result;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
      return result;
    }
  }
}

// Export singleton instance
export const mcpSessionManager = MCPSessionManager.getInstance();