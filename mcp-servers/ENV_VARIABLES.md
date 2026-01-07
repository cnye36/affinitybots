# MCP Server Environment Variables

Add these to your `.env` file to configure MCP servers.

## Local Development

```bash
# Google Drive MCP (self-hosted)
GOOGLE_DRIVE_MCP_URL=http://localhost:3002

# Gmail MCP (self-hosted)
GMAIL_MCP_URL=http://localhost:3003

# Playwright MCP (self-hosted)
PLAYWRIGHT_MCP_URL=http://localhost:3004

# Add more servers as needed...
# YOUR_SERVER_MCP_URL=http://localhost:3005
```

## Production (Docker Internal Network)

```bash
# Use Docker service names for internal communication
GOOGLE_DRIVE_MCP_URL=http://google-drive-mcp:3002
GMAIL_MCP_URL=http://gmail-mcp-server:3003
PLAYWRIGHT_MCP_URL=http://playwright-mcp:3004

# Or use external URLs if deployed separately
# PLAYWRIGHT_MCP_URL=https://playwright-mcp.yourdomain.com
```

## Default Behavior

If environment variables are not set, the system falls back to:
- `http://localhost:PORT` in development
- These defaults are defined in `lib/mcp/officialMcpServers.ts`

## Vercel Deployment

Add all production MCP URLs to Vercel environment variables:

1. Go to Project Settings > Environment Variables
2. Add each `*_MCP_URL` variable with production value
3. Redeploy to apply changes
