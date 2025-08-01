# Universal MCP Server Setup Guide

This guide explains how to add any properly configured MCP server to your system, whether it uses OAuth, API keys, or other authentication methods.

## Overview

Your MCP client system now supports any compliant MCP server with flexible authentication:

- **OAuth 2.0 servers** - Full OAuth flow with session management
- **API key servers** - Direct URL-based connections
- **Smithery servers** - Legacy support for Smithery-hosted servers
- **Custom servers** - Any MCP-compliant server with proper configuration

## Adding a New MCP Server

### 1. **OAuth-Based Servers**

For servers that require OAuth authentication:

```json
{
  "qualified_name": "my-oauth-server",
  "url": "https://api.example.com/mcp",
  "config": {
    "auth_type": "oauth",
    "provider": "custom",
    "description": "My custom OAuth MCP server"
  },
  "is_enabled": true
}
```

**Required steps:**
1. Add the server configuration via API or UI
2. Initiate OAuth flow through `/api/mcp/auth/connect`
3. Complete authorization when redirected
4. Server will be automatically enabled after successful OAuth

### 2. **API Key Servers**

For servers with direct API key authentication:

```json
{
  "qualified_name": "my-api-server",
  "url": "https://api.example.com/mcp?api_key=YOUR_API_KEY",
  "config": {
    "auth_type": "api_key",
    "provider": "custom",
    "description": "My API key MCP server"
  },
  "is_enabled": true
}
```

**Required steps:**
1. Obtain API key from the server provider
2. Include the API key in the URL or as a config parameter
3. Add the server configuration
4. Test the connection

### 3. **WebSocket Servers**

For MCP servers using WebSocket transport:

```json
{
  "qualified_name": "my-websocket-server",
  "url": "wss://api.example.com/mcp",
  "config": {
    "transport": "websocket",
    "auth_type": "api_key",
    "provider": "custom"
  },
  "is_enabled": true
}
```

### 4. **Local/Self-Hosted Servers**

For locally running MCP servers:

```json
{
  "qualified_name": "my-local-server",
  "url": "http://localhost:3001/mcp",
  "config": {
    "auth_type": "none",
    "provider": "local",
    "description": "Local development MCP server"
  },
  "is_enabled": true
}
```

## Configuration Methods

### Via API

```bash
# Add a new server
curl -X POST /api/user-mcp-servers \
  -H "Content-Type: application/json" \
  -d '{
    "qualified_name": "my-server",
    "config": {
      "url": "https://api.example.com/mcp",
      "auth_type": "api_key"
    }
  }'

# Update existing server
curl -X PUT /api/user-mcp-servers/my-server \
  -H "Content-Type: application/json" \
  -d '{
    "config": { "updated": "config" },
    "isEnabled": true
  }'
```

### Via UI (if available)

1. Navigate to agent configuration
2. Add new MCP server
3. Fill in the server details
4. Test connection
5. Save and enable

## Authentication Types

### OAuth 2.0

**When to use:** Server requires user authorization and supports OAuth 2.0

**Configuration:**
- Set `auth_type: "oauth"` in config
- Provide the base server URL (without OAuth parameters)
- Complete OAuth flow when prompted

**Example providers:** GitHub, Google, Microsoft, custom OAuth servers

### API Key

**When to use:** Server uses simple API key authentication

**Configuration:**
- Include API key in URL or config
- Set `auth_type: "api_key"` in config
- Provide complete endpoint URL

**Example providers:** OpenAI, Anthropic, custom API services

### No Authentication

**When to use:** Public servers or local development

**Configuration:**
- Set `auth_type: "none"` in config
- Provide direct server URL
- Ensure server allows unauthenticated access

## Server Configuration Schema

```typescript
interface MCPServerConfig {
  qualified_name: string;        // Unique identifier
  url?: string;                  // Server endpoint URL
  oauth_token?: string;          // OAuth token (managed automatically)
  session_id?: string;           // OAuth session ID (managed automatically)
  expires_at?: string;           // OAuth expiration (managed automatically)
  config?: {                     // Custom configuration
    auth_type?: 'oauth' | 'api_key' | 'none';
    provider?: string;           // Provider name for organization
    description?: string;        // Human-readable description
    [key: string]: any;         // Provider-specific settings
  };
  is_enabled: boolean;          // Whether server is active
}
```

## Validation and Testing

The system automatically validates server configurations:

### Required Fields
- `qualified_name` - Must be unique per user
- Either `url` OR OAuth configuration
- Valid `config` object (if provided)

### Automatic Checks
- URL validity and reachability
- OAuth token expiration
- Authentication method compatibility
- Protocol support (HTTP/HTTPS/WS/WSS)

### Testing
```bash
# Test server connection
curl -X POST /api/user-mcp-servers/my-server/test \
  -H "Content-Type: application/json" \
  -d '{"config": {"url": "https://api.example.com/mcp"}}'
```

## Common Examples

### Supabase MCP Server
```json
{
  "qualified_name": "supabase-mcp",
  "url": "https://your-project.supabase.co/functions/v1/mcp",
  "config": {
    "auth_type": "api_key",
    "provider": "supabase",
    "project_url": "https://your-project.supabase.co",
    "anon_key": "your-anon-key"
  }
}
```

### Custom GitHub MCP Server
```json
{
  "qualified_name": "github-custom",
  "url": "https://api.github.com/mcp",
  "config": {
    "auth_type": "oauth",
    "provider": "github",
    "scopes": ["repo", "user"]
  }
}
```

### Local Development Server
```json
{
  "qualified_name": "local-dev",
  "url": "http://localhost:8000/mcp",
  "config": {
    "auth_type": "none",
    "provider": "local",
    "description": "Local MCP server for testing"
  }
}
```

## Troubleshooting

### Connection Issues
1. Verify the server URL is accessible
2. Check authentication credentials
3. Ensure the server implements MCP protocol correctly
4. Review server logs for specific error messages

### OAuth Issues
1. Verify OAuth callback URLs are configured correctly
2. Check token expiration and refresh
3. Ensure OAuth scopes are appropriate
4. Clear expired sessions if needed

### Configuration Issues
1. Use the validation API to check configuration
2. Review required fields for your auth type
3. Check for conflicting settings
4. Verify environment variables are set

## Migration from Smithery-Only

If you're migrating from a Smithery-only setup:

1. **Existing Smithery servers** continue to work without changes
2. **New servers** can be any MCP-compliant server
3. **Mixed environments** are fully supported
4. **Gradual migration** is possible - add new servers as needed

## Best Practices

1. **Use descriptive qualified names** - Makes management easier
2. **Set appropriate auth types** - Ensures proper connection handling
3. **Test configurations** - Use the test endpoint before enabling
4. **Monitor OAuth expirations** - Set up alerts for token renewal
5. **Document custom configs** - Add descriptions for team members
6. **Use environment variables** - For sensitive configuration data

## Security Considerations

1. **Never store sensitive keys in config** - Use environment variables
2. **Regularly rotate API keys** - Follow provider recommendations
3. **Monitor OAuth sessions** - Watch for unauthorized access
4. **Use HTTPS/WSS** - Ensure encrypted connections
5. **Validate server certificates** - Prevent man-in-the-middle attacks