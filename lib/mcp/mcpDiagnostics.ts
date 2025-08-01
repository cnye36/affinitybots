import { mcpClientFactory } from './mcpClientFactory';
import { mcpSessionManager } from './mcpSessionManager';
import { AgentConfiguration } from '@/types/agent';
import { getUserMcpServers } from '../agent/getUserMcpServers';

export interface MCPDiagnosticResult {
  userId: string;
  timestamp: string;
  servers: {
    total: number;
    enabled: number;
    oauth: number;
    apiKey: number;
  };
  sessions: {
    total: number;
    active: number;
    expired: number;
    inMemory: number;
  };
  tools: {
    total: number;
    byServer: { [serverName: string]: number };
  };
  health: {
    status: 'healthy' | 'warning' | 'error';
    issues: string[];
    recommendations: string[];
  };
  errors: string[];
}

/**
 * Provides diagnostic and troubleshooting capabilities for MCP OAuth integration
 */
export class MCPDiagnostics {
  private static instance: MCPDiagnostics;

  static getInstance(): MCPDiagnostics {
    if (!MCPDiagnostics.instance) {
      MCPDiagnostics.instance = new MCPDiagnostics();
    }
    return MCPDiagnostics.instance;
  }

  private constructor() {}

  /**
   * Runs a comprehensive diagnostic check for a user's MCP setup
   */
  async runDiagnostics(userId: string, agentConfig: AgentConfiguration): Promise<MCPDiagnosticResult> {
    const result: MCPDiagnosticResult = {
      userId,
      timestamp: new Date().toISOString(),
      servers: { total: 0, enabled: 0, oauth: 0, apiKey: 0 },
      sessions: { total: 0, active: 0, expired: 0, inMemory: 0 },
      tools: { total: 0, byServer: {} },
      health: { status: 'healthy', issues: [], recommendations: [] },
      errors: []
    };

    try {
      // Check server configuration
      await this.checkServerConfiguration(userId, agentConfig, result);
      
      // Check OAuth sessions
      await this.checkOAuthSessions(userId, agentConfig, result);
      
      // Check tool availability
      await this.checkToolAvailability(userId, agentConfig, result);
      
      // Generate health assessment
      this.assessHealth(result);

      console.log(`MCP Diagnostics completed for user ${userId}:`, {
        servers: result.servers,
        sessions: result.sessions,
        tools: result.tools.total,
        health: result.health.status
      });

      return result;
    } catch (error) {
      result.errors.push(`Diagnostic error: ${error instanceof Error ? error.message : String(error)}`);
      result.health.status = 'error';
      return result;
    }
  }

  /**
   * Checks server configuration and availability
   */
  private async checkServerConfiguration(
    userId: string, 
    agentConfig: AgentConfiguration, 
    result: MCPDiagnosticResult
  ): Promise<void> {
    try {
      const allServers = await getUserMcpServers(userId);
      const enabledServers = agentConfig.enabled_mcp_servers || [];

      result.servers.total = Object.keys(allServers).length;
      result.servers.enabled = enabledServers.length;

      // Analyze server types
      for (const serverName of enabledServers) {
        const serverConfig = allServers[serverName];
        if (serverConfig) {
          if (serverConfig.url && (serverConfig.url.includes('/oauth/') || serverConfig.url.includes('oauth=true'))) {
            result.servers.oauth++;
          } else {
            result.servers.apiKey++;
          }
        }
      }

      // Check for missing servers
      const missingServers = enabledServers.filter(name => !allServers[name]);
      if (missingServers.length > 0) {
        result.health.issues.push(`Missing server configurations: ${missingServers.join(', ')}`);
      }

      // Check for disabled enabled servers
      if (result.servers.enabled === 0 && result.servers.total > 0) {
        result.health.recommendations.push('No servers are enabled. Enable servers in agent configuration.');
      }

    } catch (error) {
      result.errors.push(`Server config check error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Checks OAuth session status
   */
  private async checkOAuthSessions(
    userId: string, 
    agentConfig: AgentConfiguration, 
    result: MCPDiagnosticResult
  ): Promise<void> {
    try {
      const sessionDiagnostics = await mcpSessionManager.getDiagnostics(userId);
      
      result.sessions = {
        total: sessionDiagnostics.totalSessions,
        active: sessionDiagnostics.activeSessions,
        expired: sessionDiagnostics.expiredSessions,
        inMemory: sessionDiagnostics.sessionsInMemory
      };

      // Add session-related errors
      result.errors.push(...sessionDiagnostics.errors);

      // Check for session issues
      if (result.sessions.expired > 0) {
        result.health.issues.push(`${result.sessions.expired} expired OAuth sessions found`);
        result.health.recommendations.push('Run session cleanup or re-authorize expired servers');
      }

      if (result.sessions.total > 0 && result.sessions.inMemory === 0) {
        result.health.issues.push('OAuth sessions exist in database but none are loaded in memory');
        result.health.recommendations.push('Restart the application or refresh sessions');
      }

      // Validate active sessions
      if (result.sessions.active > 0) {
        const validation = await mcpSessionManager.validateSessions(userId, agentConfig);
        if (validation.invalid.length > 0) {
          result.health.issues.push(`${validation.invalid.length} invalid OAuth sessions: ${validation.invalid.join(', ')}`);
        }
      }

    } catch (error) {
      result.errors.push(`Session check error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Checks tool availability and functionality
   */
  private async checkToolAvailability(
    userId: string, 
    agentConfig: AgentConfiguration, 
    result: MCPDiagnosticResult
  ): Promise<void> {
    try {
      const factoryResult = await mcpClientFactory.createForAgent(userId, agentConfig);
      
      result.tools.total = factoryResult.tools.length;

      // Get tool counts by server (if available)
      if (factoryResult.client) {
        // This would require accessing the internal structure of MultiServerMCPClient
        // For now, we'll just provide the total count
        result.tools.byServer['all_servers'] = factoryResult.tools.length;
      }

      // Check for tool loading issues
      if (result.servers.enabled > 0 && result.tools.total === 0) {
        result.health.issues.push('No tools loaded despite having enabled servers');
        result.health.recommendations.push('Check server connectivity and authentication');
      }

      // Check for missing tools from specific servers
      const expectedOAuthServers = agentConfig.mcp_oauth_sessions?.map(s => s.server_name) || [];
      const activeOAuthSessions = factoryResult.oauthSessions.size;
      
      if (expectedOAuthServers.length > activeOAuthSessions) {
        result.health.issues.push(`Expected ${expectedOAuthServers.length} OAuth sessions, but only ${activeOAuthSessions} are active`);
      }

    } catch (error) {
      result.errors.push(`Tool check error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Assesses overall health based on collected diagnostics
   */
  private assessHealth(result: MCPDiagnosticResult): void {
    const issueCount = result.health.issues.length;
    const errorCount = result.errors.length;

    if (errorCount > 0) {
      result.health.status = 'error';
    } else if (issueCount > 2) {
      result.health.status = 'error';
    } else if (issueCount > 0) {
      result.health.status = 'warning';
    } else {
      result.health.status = 'healthy';
    }

    // Add general recommendations
    if (result.servers.total === 0) {
      result.health.recommendations.push('Configure MCP servers in the database');
    }

    if (result.servers.oauth > 0 && result.sessions.total === 0) {
      result.health.recommendations.push('Set up OAuth authentication for OAuth-enabled servers');
    }

    if (result.tools.total === 0) {
      result.health.recommendations.push('Verify server connectivity and ensure servers are properly configured');
    }
  }

  /**
   * Generates a human-readable diagnostic report
   */
  generateReport(diagnostics: MCPDiagnosticResult): string {
    const lines: string[] = [];
    
    lines.push(`=== MCP Diagnostic Report ===`);
    lines.push(`User: ${diagnostics.userId}`);
    lines.push(`Timestamp: ${diagnostics.timestamp}`);
    lines.push(`Health Status: ${diagnostics.health.status.toUpperCase()}`);
    lines.push('');

    lines.push('--- Server Configuration ---');
    lines.push(`Total servers: ${diagnostics.servers.total}`);
    lines.push(`Enabled servers: ${diagnostics.servers.enabled}`);
    lines.push(`OAuth servers: ${diagnostics.servers.oauth}`);
    lines.push(`API key servers: ${diagnostics.servers.apiKey}`);
    lines.push('');

    lines.push('--- OAuth Sessions ---');
    lines.push(`Total sessions: ${diagnostics.sessions.total}`);
    lines.push(`Active sessions: ${diagnostics.sessions.active}`);
    lines.push(`Expired sessions: ${diagnostics.sessions.expired}`);
    lines.push(`Sessions in memory: ${diagnostics.sessions.inMemory}`);
    lines.push('');

    lines.push('--- Tools ---');
    lines.push(`Total tools loaded: ${diagnostics.tools.total}`);
    for (const [server, count] of Object.entries(diagnostics.tools.byServer)) {
      lines.push(`  ${server}: ${count} tools`);
    }
    lines.push('');

    if (diagnostics.health.issues.length > 0) {
      lines.push('--- Issues ---');
      diagnostics.health.issues.forEach(issue => lines.push(`⚠️  ${issue}`));
      lines.push('');
    }

    if (diagnostics.health.recommendations.length > 0) {
      lines.push('--- Recommendations ---');
      diagnostics.health.recommendations.forEach(rec => lines.push(`💡 ${rec}`));
      lines.push('');
    }

    if (diagnostics.errors.length > 0) {
      lines.push('--- Errors ---');
      diagnostics.errors.forEach(error => lines.push(`❌ ${error}`));
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Attempts to fix common issues automatically
   */
  async autoFix(userId: string, agentConfig: AgentConfiguration): Promise<{
    fixed: string[];
    failed: string[];
    recommendations: string[];
  }> {
    const result = {
      fixed: [] as string[],
      failed: [] as string[],
      recommendations: [] as string[]
    };

    try {
      // Clean up expired sessions
      const cleanup = await mcpSessionManager.cleanupExpiredSessions();
      if (cleanup.cleaned > 0) {
        result.fixed.push(`Cleaned up ${cleanup.cleaned} expired sessions`);
      }
      result.failed.push(...cleanup.errors);

      // Refresh expired sessions for this user
      const refresh = await mcpSessionManager.refreshExpiredSessions(userId, agentConfig);
      if (refresh.refreshed.length > 0) {
        result.fixed.push(`Refreshed ${refresh.refreshed.length} expired sessions: ${refresh.refreshed.join(', ')}`);
      }
      if (refresh.failed.length > 0) {
        result.failed.push(...refresh.failed.map(server => `Failed to refresh ${server}: ${refresh.errors[server] || 'Unknown error'}`));
        result.recommendations.push(`Re-authorize failed servers: ${refresh.failed.join(', ')}`);
      }

      // Clear cache to force fresh connections
      mcpClientFactory.clearCache();
      result.fixed.push('Cleared MCP client cache');

      return result;
    } catch (error) {
      result.failed.push(`Auto-fix error: ${error instanceof Error ? error.message : String(error)}`);
      return result;
    }
  }
}

// Export singleton instance
export const mcpDiagnostics = MCPDiagnostics.getInstance();