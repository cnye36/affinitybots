# MCP OAuth Integration for React Agents

This document explains the OAuth-compatible MCP client integration for your React agents running on LangGraph Platform.

## Overview

The integration provides a unified system for connecting to MCP (Model Context Protocol) servers that support various authentication methods:

- **OAuth 2.0** - For servers requiring OAuth authentication flows
- **API Keys** - For servers using simple API key authentication
- **Hybrid Support** - Automatic detection and handling of different auth types

## Architecture

### Core Components

1. **MCPClientManager** (`lib/agent/mcpClientManager.ts`)
   - Manages both OAuth and API key client connections
   - Handles session validation and refresh
   - Provides caching for performance

2. **MCPClientFactory** (`lib/agent/mcpClientFactory.ts`) 
   - Unified interface for creating MCP clients
   - Used by agents to get tools and clients
   - Handles configuration and diagnostics

3. **MCPSessionManager** (`lib/agent/mcpSessionManager.ts`)
   - Manages OAuth session lifecycle
   - Handles session refresh and cleanup
   - Provides session validation

4. **MCPDiagnostics** (`lib/agent/mcpDiagnostics.ts`)
   - Comprehensive diagnostic and troubleshooting
   - Health checks for servers and sessions
   - Auto-fix capabilities for common issues

5. **MCPWebInterface** (`lib/agent/mcpWebInterface.ts`)
   - Bridge between Next.js API routes and MCP system
   - Handles OAuth flows from web interface
   - Provides tool testing capabilities

## Updated Agent Configuration

The `AgentConfiguration` type now supports OAuth sessions:

```typescript
interface AgentConfiguration {
  // ... existing fields ...
  
  // OAuth sessions for MCP servers
  mcp_oauth_sessions?: MCPServerSession[];
  
  // Force refresh MCP clients 
  force_mcp_refresh?: boolean;
}

interface MCPServerSession {
  server_name: string;
  session_id: string;
  expires_at?: string;
  auth_type: 'oauth' | 'api_key';
}
```

## How It Works

### 1. Server Detection and Setup

When an agent needs MCP tools, the system:

1. Queries user's configured servers from database
2. Detects authentication type (OAuth vs API key)
3. Sets up appropriate client connections
4. Caches results for performance

### 2. OAuth Flow

For OAuth-enabled servers:

1. **Initiation**: Agent or web interface initiates connection
2. **Authorization**: User is redirected to OAuth provider
3. **Callback**: OAuth callback returns authorization code
4. **Completion**: System exchanges code for tokens
5. **Storage**: Session info stored in database and memory

### 3. Session Management

- Sessions are automatically validated before use
- Expired sessions trigger refresh attempts
- Failed refresh requires re-authorization
- Cleanup routines remove expired sessions

## Usage Examples

### Basic Agent Usage

The updated `reactAgent.ts` automatically handles all MCP connections:

```typescript
// No changes needed in your agent code!
// The agent will automatically:
// 1. Load enabled MCP servers
// 2. Handle OAuth sessions 
// 3. Provide tools to the LLM
// 4. Manage session refresh
```

### Programmatic OAuth Setup

```typescript
import { mcpWebInterface } from '@/lib/agent/mcpWebInterface';

// Connect to OAuth server
const result = await mcpWebInterface.connectServer({
  serverUrl: 'https://server.example.com/mcp',
  callbackUrl: 'https://yourapp.com/api/mcp/auth/callback',
  userId: 'user123',
  serverName: 'example-server'
});

if (result.requiresAuth) {
  // Redirect user to result.authUrl
  window.location.href = result.authUrl;
}
```

### Running Diagnostics

```typescript
import { mcpDiagnostics } from '@/lib/agent/mcpDiagnostics';

const diagnostics = await mcpDiagnostics.runDiagnostics(userId, agentConfig);
const report = mcpDiagnostics.generateReport(diagnostics);
console.log(report);

// Auto-fix common issues
const autoFix = await mcpDiagnostics.autoFix(userId, agentConfig);
```

### Manual Session Management

```typescript
import { mcpSessionManager } from '@/lib/agent/mcpSessionManager';

// Clean up expired sessions
const cleanup = await mcpSessionManager.cleanupExpiredSessions();

// Refresh user's expired sessions
const refresh = await mcpSessionManager.refreshExpiredSessions(userId, agentConfig);

// Force cleanup all user sessions
const forceCleanup = await mcpSessionManager.forceCleanupUserSessions(userId);
```

## Database Schema

Your `user_mcp_servers` table should include these OAuth-related fields:

```sql
ALTER TABLE user_mcp_servers ADD COLUMN IF NOT EXISTS oauth_token TEXT;
ALTER TABLE user_mcp_servers ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE user_mcp_servers ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
ALTER TABLE user_mcp_servers ADD COLUMN IF NOT EXISTS refresh_token TEXT;
```

## API Routes

The existing API routes in `app/api/mcp/` handle OAuth flows:

- `POST /api/mcp/auth/connect` - Initiate connection
- `GET /api/mcp/auth/callback` - OAuth callback handler  
- `POST /api/mcp/auth/finish` - Complete OAuth flow
- `POST /api/mcp/disconnect` - Disconnect session
- `GET /api/mcp/tool/list` - List available tools
- `POST /api/mcp/tool/call` - Call a tool (for testing)

## Environment Variables

Required environment variables:

```env
# Supabase (for session storage)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Smithery API key for fallback
SMITHERY_API_KEY=your-smithery-key
```

## OAuth Server Configuration

When setting up OAuth servers in your database:

```sql
INSERT INTO user_mcp_servers (
  user_id,
  qualified_name,
  url,
  is_enabled,
  config
) VALUES (
  'user123',
  'oauth-server',
  'https://server.example.com/mcp?oauth=true',
  true,
  '{"auth_type": "oauth"}'
);
```

## Troubleshooting

### Common Issues

1. **No tools loaded**: Check server connectivity and authentication
2. **OAuth sessions expired**: Run session cleanup or re-authorize
3. **Mixed auth types**: Ensure correct server URLs and configuration

### Diagnostic Commands

```typescript
// Get comprehensive diagnostics
const diagnostics = await mcpDiagnostics.runDiagnostics(userId, agentConfig);

// Check specific session status  
const sessionDiag = await mcpSessionManager.getDiagnostics(userId);

// Validate current sessions
const validation = await mcpSessionManager.validateSessions(userId, agentConfig);
```

### Auto-Fix

The system can automatically fix many common issues:

```typescript
const autoFix = await mcpDiagnostics.autoFix(userId, agentConfig);
console.log('Fixed:', autoFix.fixed);
console.log('Failed:', autoFix.failed);
console.log('Recommendations:', autoFix.recommendations);
```

## Security Considerations

1. **Token Storage**: OAuth tokens are stored securely in database
2. **Session Management**: Sessions are cleaned up automatically
3. **Validation**: All sessions are validated before use
4. **Isolation**: Each user's sessions are isolated

## Performance

1. **Caching**: Clients and tools are cached for performance
2. **Lazy Loading**: Clients are created only when needed
3. **Session Reuse**: OAuth sessions are reused across requests
4. **Background Cleanup**: Expired sessions cleaned up automatically

## Migration from API Key Only

If you're migrating from an API-key-only setup:

1. **No code changes needed** - The system is backward compatible
2. **Database migration** - Add OAuth columns as shown above
3. **Gradual migration** - Mix OAuth and API key servers as needed
4. **Testing** - Use diagnostics to verify everything works

## Next Steps

1. **Configure OAuth servers** in your database
2. **Test OAuth flows** using the web interface
3. **Monitor diagnostics** to ensure healthy connections  
4. **Set up cleanup routines** for production deployment

The integration is designed to be production-ready and handles all the complexity of managing mixed authentication types automatically.