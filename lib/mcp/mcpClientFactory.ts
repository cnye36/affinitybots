import { AssistantConfiguration } from "@/types/assistant";
import { mcpClientManager, MCPClientResult } from "./mcpClientManager";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";

export interface MCPFactoryResult {
  client: MultiServerMCPClient | null;
  tools: any[];
  serverCount: number;
  oauthSessions: Map<string, string>; // serverName -> sessionId
}

/**
 * Unified factory for creating MCP clients that handles both OAuth and API key authentication
 */
export class MCPClientFactory {
  private static instance: MCPClientFactory;
  
  static getInstance(): MCPClientFactory {
    if (!MCPClientFactory.instance) {
      MCPClientFactory.instance = new MCPClientFactory();
    }
    return MCPClientFactory.instance;
  }

  private constructor() {}

  /**
   * Creates MCP clients and tools for an agent based on its configuration
   */
  async createForAgent(
    userId: string, 
    agentConfig: AssistantConfiguration
  ): Promise<MCPFactoryResult> {
    try {
      const enabledServers = agentConfig.enabled_mcp_servers || [];
      const forceRefresh = agentConfig.force_mcp_refresh || false;

      console.log(`MCPClientFactory: Creating clients for agent ${userId}`);
      console.log(`Enabled servers: ${enabledServers.join(", ")}`);
      console.log(`Force refresh: ${forceRefresh}`);
      console.log(`OAuth sessions: ${(agentConfig.mcp_oauth_sessions || []).length} configured`);

      const result = await mcpClientManager.createMcpClientAndTools({
        userId,
        enabledServers,
        forceRefresh
      });

      let tools = result.tools;

      // Filter tools if selected_tools is specified in agent config
      if (agentConfig.selected_tools && agentConfig.selected_tools.length > 0) {
        const beforeCount = tools.length;
        tools = tools.filter(tool => agentConfig.selected_tools!.includes(tool.name));
        console.log(`MCPClientFactory: Filtered tools from ${beforeCount} to ${tools.length} based on selected_tools`);
        console.log(`Selected tools: ${agentConfig.selected_tools.join(", ")}`);
      }

      const factoryResult: MCPFactoryResult = {
        client: result.client,
        tools: tools,
        serverCount: result.oauthClients.size + (result.client ? Object.keys((result.client as any).mcpServers || {}).length - result.oauthClients.size : 0),
        oauthSessions: result.sessions
      };

      console.log(`MCPClientFactory: Created ${factoryResult.tools.length} tools from ${factoryResult.serverCount} servers`);

      return factoryResult;
    } catch (error) {
      console.error("MCPClientFactory: Error creating MCP clients:", error);
      return {
        client: null,
        tools: [],
        serverCount: 0,
        oauthSessions: new Map()
      };
    }
  }

  /**
   * Initiates OAuth flow for a server
   */
  async initiateOAuth(serverUrl: string, callbackUrl: string, userId?: string, serverName?: string) {
    return await mcpClientManager.createOAuthClient(serverUrl, callbackUrl, userId, serverName);
  }

  /**
   * Completes OAuth flow
   */
  async completeOAuth(sessionId: string, authCode: string) {
    return await mcpClientManager.finishOAuth(sessionId, authCode);
  }

  /**
   * Disconnects OAuth session
   */
  async disconnectOAuth(sessionId: string) {
    return await mcpClientManager.disconnectOAuth(sessionId);
  }

  /**
   * Validates and refreshes MCP clients for an agent if needed
   */
  async validateAndRefresh(
    userId: string, 
    agentConfig: AssistantConfiguration
  ): Promise<{
    needsRefresh: boolean;
    expiredSessions: string[];
    result?: MCPFactoryResult;
  }> {
    try {
      const enabledServers = agentConfig.enabled_mcp_servers || [];
      const oauthSessions = agentConfig.mcp_oauth_sessions || [];
      
      // Check for expired OAuth sessions
      const expiredSessions: string[] = [];
      const now = new Date();
      
      for (const session of oauthSessions) {
        if (session.expires_at) {
          const expiryDate = new Date(session.expires_at);
          if (expiryDate < now) {
            expiredSessions.push(session.server_name);
          }
        }
      }

      const needsRefresh = expiredSessions.length > 0;

      if (needsRefresh) {
        console.log(`MCPClientFactory: Refreshing clients for ${userId} due to expired sessions: ${expiredSessions.join(", ")}`);
        
        const result = await this.createForAgent(userId, {
          ...agentConfig,
          force_mcp_refresh: true
        });

        return {
          needsRefresh: true,
          expiredSessions,
          result
        };
      }

      return {
        needsRefresh: false,
        expiredSessions: []
      };
    } catch (error) {
      console.error("MCPClientFactory: Error validating sessions:", error);
      return {
        needsRefresh: true,
        expiredSessions: [],
        result: await this.createForAgent(userId, agentConfig)
      };
    }
  }

  /**
   * Gets diagnostic information about MCP clients
   */
  async getDiagnostics(userId: string, agentConfig: AssistantConfiguration): Promise<{
    serverCount: number;
    toolCount: number;
    oauthSessions: number;
    apiKeySessions: number;
    errors: string[];
  }> {
    try {
      const result = await this.createForAgent(userId, agentConfig);
      
      const oauthSessionCount = result.oauthSessions.size;
      const totalServers = result.serverCount;
      const apiKeySessionCount = totalServers - oauthSessionCount;

      return {
        serverCount: totalServers,
        toolCount: result.tools.length,
        oauthSessions: oauthSessionCount,
        apiKeySessions: apiKeySessionCount,
        errors: []
      };
    } catch (error) {
      return {
        serverCount: 0,
        toolCount: 0,
        oauthSessions: 0,
        apiKeySessions: 0,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Clears all cached clients (useful for testing)
   */
  clearCache(): void {
    mcpClientManager.clearCache();
  }
}

// Export singleton instance
export const mcpClientFactory = MCPClientFactory.getInstance();