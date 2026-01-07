# MCP Servers

This directory contains Docker-based MCP (Model Context Protocol) servers that run alongside the LangGraph platform.

## Architecture

These servers provide HTTP endpoints for MCP protocols, whether they:
- Have native HTTP support (like Playwright)
- Are stdio-based and need an HTTP wrapper (generic-wrapper)

## Available Servers

### Playwright MCP Server (`playwright-mcp/`)
Browser automation and testing server with native HTTP support.
- **Port**: 3004
- **Type**: Native HTTP
- **Package**: `@playwright/mcp`

### Fetch MCP Server (uses `generic-wrapper/`)
HTTP requests to external APIs and websites.
- **Port**: 3005
- **Type**: Stdio (wrapped)
- **Package**: `@modelcontextprotocol/server-fetch`

### Slack MCP Server (uses `generic-wrapper/`)
Interact with Slack workspaces via bot token.
- **Port**: 3006
- **Type**: Stdio (wrapped)
- **Package**: `@modelcontextprotocol/server-slack`
- **Requires**: SLACK_BOT_TOKEN environment variable

### Puppeteer MCP Server (uses `generic-wrapper/`)
Headless browser automation alternative to Playwright.
- **Port**: 3007
- **Type**: Stdio (wrapped)
- **Package**: `@modelcontextprotocol/server-puppeteer`

### Generic Stdio Wrapper (`generic-wrapper/`)
A reusable HTTP-to-stdio adapter for any stdio-based MCP server.
- Configurable via environment variables
- Can wrap any `npx`-based MCP server
- Provides SSE streaming support

## Adding a New Server

### Option 1: Server with Native HTTP Support

If the MCP server has built-in HTTP support (like Playwright):

1. Create a new directory: `mcp-servers/your-server-name/`
2. Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install the MCP server package
RUN npm install -g @your-package/mcp@latest

EXPOSE 3XXX

# Run in HTTP mode if supported
CMD ["npx", "@your-package/mcp@latest", "--port", "3XXX"]
```

3. Add to `docker-compose.yml`:

```yaml
your-server-mcp:
  build:
    context: ./mcp-servers/your-server-name
  ports:
    - "3XXX:3XXX"
  environment:
    PORT: 3XXX
  healthcheck:
    test: ["CMD", "wget", "--spider", "http://localhost:3XXX/health"]
    interval: 10s
    timeout: 5s
    retries: 3
```

4. Add to `lib/mcp/officialMcpServers.ts`

### Option 2: Stdio-based Server (Use Generic Wrapper)

For stdio-only servers:

1. Add to `docker-compose.yml` using the generic wrapper:

```yaml
your-server-mcp:
  build:
    context: ./mcp-servers/generic-wrapper
  ports:
    - "3XXX:3XXX"
  environment:
    PORT: 3XXX
    MCP_COMMAND: npx
    MCP_ARGS: "@your-package/mcp@latest"
    SERVER_NAME: your-server-name
  healthcheck:
    test: ["CMD", "wget", "--spider", "http://localhost:3XXX/health"]
```

2. Add to `lib/mcp/officialMcpServers.ts`

## Environment Variables

Set these in your `.env` file:

```bash
# Override default URLs (optional)
PLAYWRIGHT_MCP_URL=http://localhost:3004
YOUR_SERVER_MCP_URL=http://localhost:3XXX

# For production (Docker internal network)
PLAYWRIGHT_MCP_URL=http://playwright-mcp:3004
```

## Port Allocation

Current ports in use:
- 3002: Google Drive MCP (HTTP native)
- 3003: Gmail MCP (HTTP native)
- 3004: Playwright MCP (HTTP native)
- 3005: Fetch MCP (stdio wrapped)
- 3006: Slack MCP (stdio wrapped)
- 3007: Puppeteer MCP (stdio wrapped)
- 3008-3098: Available for new servers
- 3099: Generic wrapper development/testing

## Testing a Server

```bash
# Test health endpoint
curl http://localhost:3004/health

# Test MCP endpoint (if it supports GET)
curl http://localhost:3004/mcp
```

## Production Deployment

These servers should run on the same network as your LangGraph platform. Update URLs in your production environment to use Docker service names:

```bash
PLAYWRIGHT_MCP_URL=http://playwright-mcp:3004
```
