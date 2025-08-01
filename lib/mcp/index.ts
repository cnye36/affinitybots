/**
 * MCP OAuth Integration
 * 
 * This module provides OAuth-compatible MCP client integration for React agents.
 * It supports both OAuth 2.0 and API key authentication methods.
 */

// Core components
export { mcpClientManager, MCPClientManager } from './mcpClientManager';
export { mcpClientFactory, MCPClientFactory } from './mcpClientFactory';
export { mcpSessionManager, MCPSessionManager } from './mcpSessionManager';
export { mcpDiagnostics, MCPDiagnostics } from './mcpDiagnostics';
export { mcpWebInterface, MCPWebInterface } from './mcpWebInterface';

// Types
export type {
  MCPServerInfo,
  MCPClientConfig,
  MCPClientResult
} from './mcpClientManager';

export type {
  MCPFactoryResult
} from './mcpClientFactory';

export type {
  SessionRefreshResult,
  SessionCleanupResult
} from './mcpSessionManager';

export type {
  MCPDiagnosticResult
} from './mcpDiagnostics';

export type {
  MCPServerConnectRequest,
  MCPServerConnectResponse,
  MCPToolCallRequest,
  MCPToolCallResponse,
  MCPDiagnosticRequest,
  MCPDiagnosticResponse
} from './mcpWebInterface';

// Re-export agent types
export type {
  MCPServerSession,
  AgentConfiguration
} from '../../types/agent';

/**
 * Quick start utilities
 */

import { mcpClientFactory } from './mcpClientFactory';
import { mcpDiagnostics } from './mcpDiagnostics';
import { mcpSessionManager } from './mcpSessionManager';
import { AgentConfiguration } from '../../types/agent';

/**
 * Creates MCP clients for an agent - primary entry point for agent usage
 */
export async function createMCPClientsForAgent(userId: string, agentConfig: AgentConfiguration) {
  return await mcpClientFactory.createForAgent(userId, agentConfig);
}

/**
 * Runs quick health check for user's MCP setup
 */
export async function quickHealthCheck(userId: string, agentConfig: AgentConfiguration) {
  const diagnostics = await mcpDiagnostics.runDiagnostics(userId, agentConfig);
  return {
    status: diagnostics.health.status,
    toolCount: diagnostics.tools.total,
    serverCount: diagnostics.servers.enabled,
    oauthSessions: diagnostics.sessions.active,
    issues: diagnostics.health.issues,
    recommendations: diagnostics.health.recommendations
  };
}

/**
 * Performs maintenance on user's MCP sessions
 */
export async function performMaintenance(userId: string, agentConfig: AgentConfiguration) {
  // Clean up expired sessions globally
  const cleanup = await mcpSessionManager.cleanupExpiredSessions();
  
  // Refresh user's expired sessions
  const refresh = await mcpSessionManager.refreshExpiredSessions(userId, agentConfig);
  
  // Run auto-fix
  const autoFix = await mcpDiagnostics.autoFix(userId, agentConfig);
  
  return {
    cleanup,
    refresh,
    autoFix
  };
}