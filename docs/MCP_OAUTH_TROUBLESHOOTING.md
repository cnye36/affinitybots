# MCP OAuth Troubleshooting Guide

## Problem Summary

You're experiencing issues with Google Drive, GitHub, and HubSpot MCP servers not being recognized by agents, while Notion works fine. This is due to:

1. **Docker Networking Issue**: Database has `localhost:3002` instead of `host.docker.internal:3002`
2. **Expired OAuth Tokens**: Tokens need refresh
3. **Architecture Differences**: Different OAuth flow patterns for different servers

## Architecture Comparison

### Working: Notion MCP
- **Server Location**: Remote (`https://mcp.notion.com/mcp`)
- **OAuth Handling**: Notion manages tokens on their server
- **Token Storage**: We store minimal session info
- **Transport**: Direct HTTP/SSE to Notion's server

### Not Working: Google Drive, GitHub, HubSpot
- **Server Location**: 
  - Google Drive: Local Docker (`http://localhost:3002` → should be `host.docker.internal:3002`)
  - GitHub: Remote (`https://api.githubcopilot.com/mcp/`)
  - HubSpot: Remote (`https://mcp.hubspot.com`)
- **OAuth Handling**: **WE** manage tokens (access_token, refresh_token, expiry)
- **Token Storage**: Full tokens in `user_mcp_servers` table
- **Transport**: We pass tokens with each request

## Root Causes

### 1. Docker Networking (Google Drive)

**Problem**: LangGraph agent runs inside Docker container at `/deps/agenthub/`, but tries to connect to `localhost:3002` which refers to the container's own localhost, not the host machine.

**Evidence from logs**:
```
Processing server: google-drive with URL: http://localhost:3002
Error: connect ECONNREFUSED 127.0.0.1:3002
```

**Solution**: Use `host.docker.internal:3002` for Docker-to-host communication.

### 2. Database vs Environment Variable

**Problem**: `GOOGLE_DRIVE_MCP_URL` environment variable only applies when **creating** new connections. Existing database records use their stored URL.

**Evidence**: Database record has old URL despite `.env` being updated.

### 3. Expired OAuth Tokens

**Problem**: Tokens expire, need refresh using refresh_token.

**Evidence from logs**:
```javascript
{
  expires_at: '2025-10-22T20:21:01.999Z',  // Already expired!
  token_type: 'Bearer',
  refresh_token: 'PRESENT'
}
```

## Fixes

### Fix 1: Update Database URLs (REQUIRED)

Run this SQL to fix the Google Drive URL:

```sql
-- Connect to your Supabase database and run:

UPDATE user_mcp_servers 
SET 
  url = 'http://host.docker.internal:3002',
  updated_at = NOW()
WHERE qualified_name = 'google-drive' 
  AND (url = 'http://localhost:3002' OR url LIKE 'http://localhost:3002/%');

-- Verify the change:
SELECT user_id, qualified_name, url, expires_at, is_enabled 
FROM user_mcp_servers 
WHERE qualified_name IN ('google-drive', 'github', 'hubspot');
```

Or use the Supabase dashboard:
1. Go to Table Editor → `user_mcp_servers`
2. Find rows with `qualified_name = 'google-drive'`
3. Update `url` to `http://host.docker.internal:3002`
4. Save

### Fix 2: Refresh Expired OAuth Tokens

The application has token refresh logic, but you need to trigger it:

**Option A: Reconnect via UI (Easiest)**
1. Go to http://localhost:3000/tools
2. Find Google Drive and click "Disconnect"
3. Click "Connect" again
4. Complete OAuth flow

**Option B: Force Refresh via Database**

```sql
-- Delete the expired connection to force re-auth:
DELETE FROM user_mcp_servers 
WHERE qualified_name = 'google-drive' 
  AND expires_at < NOW();
```

Then reconnect via UI.

### Fix 3: Verify OAuth Credentials

Check your `.env` file has all required credentials:

```bash
# Google Drive
GOOGLE_MCP_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_MCP_CLIENT_SECRET=your_client_secret
GOOGLE_DRIVE_MCP_URL=http://host.docker.internal:3002

# GitHub
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# HubSpot
HUBSPOT_CLIENT_ID=your_hubspot_client_id
HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret
NEXT_PUBLIC_HUBSPOT_MCP_URL=https://mcp.hubspot.com
```

### Fix 4: Restart Services

After making changes:

```bash
# Restart LangGraph to pick up new environment variables
docker-compose restart langgraph-api

# If you're running Next.js in dev mode, restart it too
# Ctrl+C and then:
pnpm dev
```

## Verification Steps

### 1. Check Google Drive MCP Server is Accessible from Docker

```bash
# From host machine (should work):
curl http://localhost:3002/health

# From inside the langgraph container (should work after fix):
docker exec agenthub-langgraph-api-1 curl http://host.docker.internal:3002/health
```

### 2. Check Database Has Correct URLs

```sql
SELECT 
  qualified_name,
  url,
  is_enabled,
  expires_at,
  oauth_token IS NOT NULL as has_token,
  refresh_token IS NOT NULL as has_refresh_token,
  CASE 
    WHEN expires_at IS NULL THEN 'No expiry'
    WHEN expires_at < NOW() THEN 'EXPIRED'
    ELSE 'Valid'
  END as token_status
FROM user_mcp_servers 
WHERE qualified_name IN ('google-drive', 'github', 'hubspot', 'notion')
ORDER BY qualified_name;
```

Expected results:
- `google-drive`: url should be `http://host.docker.internal:3002`, has_token = true, token_status = 'Valid'
- `github`: url should be `https://api.githubcopilot.com/mcp/`, has_token = true
- `hubspot`: url should be `https://mcp.hubspot.com`, has_token = true
- `notion`: url should be `https://mcp.notion.com/mcp`, has_token = true

### 3. Test via Agent

1. Create or open an assistant
2. Enable Google Drive tools
3. Send message: "List my files in Google Drive"
4. Check logs for:
   - ✅ `Processing server: google-drive with URL: http://host.docker.internal:3002`
   - ✅ `Got N tools from OAuth client for google-drive` (N > 0)
   - ✅ `Binding N tools to model...`

## Common Errors and Solutions

### Error: "ECONNREFUSED 127.0.0.1:3002"

**Cause**: Using `localhost` instead of `host.docker.internal` in Docker container

**Fix**: Update database URL (see Fix 1)

### Error: "Token expired and no refresh token available"

**Cause**: OAuth token expired and refresh token missing or invalid

**Fix**: Reconnect via UI (see Fix 2, Option A)

### Error: "OAuth credentials not configured"

**Cause**: Missing `GITHUB_CLIENT_ID`, `GOOGLE_MCP_CLIENT_ID`, or `HUBSPOT_CLIENT_ID` in environment

**Fix**: Add credentials to `.env` (see Fix 3)

### Error: "No tools loaded for enabled servers"

**Cause**: Connection to MCP server failed, or server URL is wrong

**Fix**: 
1. Check database has correct URL
2. Verify MCP server is running
3. Test connectivity from Docker container

## Understanding the OAuth Flow

### Google Drive (Custom Implementation)

```
User → AffinityBots UI → Google OAuth Consent
                          ↓
                     Authorization Code
                          ↓
AffinityBots ← Access Token + Refresh Token
     ↓ (stores in DB)
     ↓
When agent needs Google Drive:
     ↓
AffinityBots → GET tokens from DB
     ↓
     → Check if expired
     ↓ (if expired)
     → Refresh using refresh_token
     ↓
     → Call Google Drive MCP Server with tokens
        POST http://host.docker.internal:3002/mcp/execute
        { tool, arguments, tokens: { access_token, refresh_token } }
     ↓
Google Drive MCP Server → Uses tokens → Google Drive API
```

### GitHub (SDK-based)

```
User → AffinityBots UI → GitHub OAuth Consent
                          ↓
                     Authorization Code
                          ↓
AffinityBots ← Access Token via MCP SDK
     ↓ (stores in DB + sessionStore)
     ↓
When agent needs GitHub:
     ↓
AffinityBots → Rehydrate GitHubOAuthClient with stored tokens
     ↓
     → Connect to https://api.githubcopilot.com/mcp/
     ↓
     → MCP SDK handles token refresh automatically
```

### HubSpot (Bearer Token)

```
User → AffinityBots UI → HubSpot OAuth Consent
                          ↓
                     Authorization Code
                          ↓
AffinityBots ← Access Token + Refresh Token
     ↓ (stores bearer_token in config)
     ↓
When agent needs HubSpot:
     ↓
AffinityBots → GET bearer_token from DB
     ↓
     → Call https://mcp.hubspot.com
        with header: Authorization: Bearer {token}
```

### Notion (Fully Remote)

```
User → AffinityBots UI → Notion OAuth Consent (handled by Notion)
                          ↓
                     MCP OAuth Protocol
                          ↓
AffinityBots ← Session established via MCP SDK
     ↓ (stores minimal session info)
     ↓
When agent needs Notion:
     ↓
AffinityBots → Connect to https://mcp.notion.com/mcp
     ↓
     → Notion handles ALL token management
     ↓
     → MCP SDK communicates via standard protocol
```

## Key Differences

| Aspect | Notion | Google Drive | GitHub | HubSpot |
|--------|--------|--------------|--------|---------|
| **Token Storage** | Minimal | Full (access + refresh) | Full (via SDK) | Bearer token |
| **Token Refresh** | Notion handles | We handle | SDK handles | We handle |
| **Server Location** | Remote | Local Docker | Remote | Remote |
| **Transport** | MCP SDK | Custom HTTP | MCP SDK | HTTP + Bearer |
| **Complexity** | Low | High | Medium | Medium |

## Next Steps

1. **Immediate**: Update database URL for Google Drive (Fix 1)
2. **Then**: Refresh expired tokens by reconnecting (Fix 2)
3. **Verify**: Test with agent and check logs (Verification Steps)
4. **Long-term**: Consider migrating to remote MCP servers or Docker Compose networking

## Docker Compose Enhancement (Optional)

Add the Google Drive MCP server to your `docker-compose.yml` for better networking:

```yaml
services:
  # ... existing services ...
  
  google-drive-mcp:
    # Assuming you have a Dockerfile for it
    build: ./google-drive-mcp-server
    ports:
      - "3002:3002"
    networks:
      - agenthub-network

  langgraph-api:
    # ... existing config ...
    depends_on:
      - google-drive-mcp
    networks:
      - agenthub-network
    environment:
      # Can use service name directly!
      GOOGLE_DRIVE_MCP_URL: http://google-drive-mcp:3002

networks:
  agenthub-network:
    driver: bridge
```

Then update database to use `http://google-drive-mcp:3002` instead of `host.docker.internal:3002`.

## Support

If issues persist:
1. Share full logs from `docker-compose logs langgraph-api`
2. Share results from verification SQL queries
3. Verify all MCP servers are running: `docker ps | grep mcp`



