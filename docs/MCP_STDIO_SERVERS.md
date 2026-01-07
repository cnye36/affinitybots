# Adding Stdio-Based MCP Servers

This guide explains how to add new stdio-based MCP servers to AffinityBots.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Method 1: Native HTTP Support](#method-1-native-http-support)
- [Method 2: Using Generic Wrapper](#method-2-using-generic-wrapper)
- [Port Allocation](#port-allocation)
- [Testing](#testing)
- [Production Deployment](#production-deployment)
- [Examples](#examples)

## Overview

MCP servers can be:
1. **HTTP-native**: Built-in HTTP support (like Playwright, GitHub, Supabase)
2. **Stdio-based**: Use stdin/stdout communication (require HTTP wrapper)

We support both by:
- Running HTTP-native servers directly in Docker
- Wrapping stdio servers with our generic HTTP adapter

## Architecture

```
┌─────────────────────────────────────┐
│  Vercel (Next.js App)               │
│  API Routes + Frontend              │
└────────────┬────────────────────────┘
             │ HTTP/HTTPS
             ▼
┌─────────────────────────────────────┐
│  Docker Server                      │
│                                     │
│  ┌─────────────────┐               │
│  │ LangGraph API   │               │
│  │ (Port 8123)     │               │
│  └─────────────────┘               │
│                                     │
│  ┌─────────────────────────────────┤
│  │ MCP Servers                     │
│  │                                 │
│  │  ├─ Google Drive (3002) HTTP   │
│  │  ├─ Gmail (3003)       HTTP   │
│  │  ├─ Playwright (3004)  HTTP   │
│  │  └─ More servers...            │
│  └─────────────────────────────────┤
└─────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Access to the server running LangGraph
- The MCP server package name (e.g., `@playwright/mcp`)

### Steps

1. Determine if the server has native HTTP support
2. Choose appropriate method (direct or wrapper)
3. Create Docker configuration
4. Update `docker-compose.yml`
5. Add to `officialMcpServers.ts`
6. Test the integration

## Method 1: Native HTTP Support

If the MCP server has built-in HTTP support (check docs or `--help`):

### 1. Create Server Directory

```bash
mkdir -p mcp-servers/your-server-name
cd mcp-servers/your-server-name
```

### 2. Create `package.json`

```json
{
  "name": "your-server-mcp",
  "version": "1.0.0",
  "description": "Your MCP server with HTTP support",
  "type": "module",
  "scripts": {
    "start": "npx @your-package/mcp@latest --port ${PORT:-3005}"
  },
  "dependencies": {
    "@your-package/mcp": "latest"
  }
}
```

### 3. Create `Dockerfile`

```dockerfile
FROM node:20-alpine

# Install system dependencies if needed
RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY package*.json ./
RUN npm install

EXPOSE 3005

# Run in HTTP mode (check package docs for correct flags)
CMD ["npx", "@your-package/mcp@latest", "--port", "3005"]
```

### 4. Create `.dockerignore`

```
node_modules
npm-debug.log
.env
.git
```

### 5. Update `docker-compose.yml`

```yaml
your-server-mcp:
  build:
    context: ./mcp-servers/your-server-name
    dockerfile: Dockerfile
  ports:
    - "3005:3005"
  environment:
    PORT: 3005
    NODE_ENV: production
  healthcheck:
    test: ["CMD", "wget", "--spider", "http://localhost:3005/health"]
    interval: 10s
    timeout: 5s
    retries: 3
  restart: unless-stopped
```

### 6. Add to `lib/mcp/officialMcpServers.ts`

```typescript
{
  serverName: "your-server",
  displayName: "Your Server Name",
  description: "Description of what this server does and what tools it provides.",
  logoUrl: "/integration-icons/your-server-icon.png",
  url: process.env.YOUR_SERVER_MCP_URL || "http://localhost:3005",
  docsUrl: "https://docs.your-server.com",
  authType: "none", // or "api_key", "oauth", "pat"
  requiresSetup: false,
}
```

## Method 2: Using Generic Wrapper

For stdio-only servers without native HTTP support:

### 1. No Custom Code Needed!

The generic wrapper (`mcp-servers/generic-wrapper/`) handles stdio-to-HTTP translation.

### 2. Update `docker-compose.yml`

```yaml
your-server-mcp:
  build:
    context: ./mcp-servers/generic-wrapper
    dockerfile: Dockerfile
  ports:
    - "3005:3005"
  environment:
    PORT: 3005
    MCP_COMMAND: npx
    MCP_ARGS: "@your-package/mcp@latest --your-flags"
    SERVER_NAME: your-server
    NODE_ENV: production
  healthcheck:
    test: ["CMD", "wget", "--spider", "http://localhost:3005/health"]
    interval: 10s
    timeout: 5s
    retries: 3
  restart: unless-stopped
```

**Important**: `MCP_ARGS` is a space-separated string. Each argument should be separated by a single space.

### 3. Add to `lib/mcp/officialMcpServers.ts`

Same as Method 1.

## Port Allocation

**Current Port Usage:**

| Port | Service              | Type     |
|------|---------------------|----------|
| 3002 | Google Drive MCP    | HTTP     |
| 3003 | Gmail MCP           | HTTP     |
| 3004 | Playwright MCP      | HTTP     |
| 3005 | Available           | -        |
| 3006 | Available           | -        |
| ...  | ...                 | ...      |
| 3099 | Generic Wrapper Dev | Wrapper  |

**Allocation Rules:**
- Start at 3005 for new servers
- Increment by 1 for each new server
- Update this table when adding servers
- Reserve 3099 for wrapper development/testing

## Testing

### 1. Build and Start Container

```bash
# Build the image
docker-compose build your-server-mcp

# Start the service
docker-compose up -d your-server-mcp

# View logs
docker-compose logs -f your-server-mcp
```

### 2. Test Health Endpoint

```bash
curl http://localhost:3005/health
```

Expected response:
```json
{
  "status": "healthy",
  "server": "your-server"
}
```

### 3. Test MCP Endpoint

```bash
curl -X POST http://localhost:3005/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/list",
    "params": {}
  }'
```

### 4. Test from Next.js App

1. Start your Next.js dev server: `pnpm dev`
2. Go to Tools page: `http://localhost:3000/tools`
3. Find your new MCP server
4. Click "Connect" or "Add"
5. Create an agent and enable the server
6. Test in chat or playground

## Production Deployment

### Environment Variables

Add to your production `.env`:

```bash
# Docker internal network (for containers to communicate)
YOUR_SERVER_MCP_URL=http://your-server-mcp:3005

# Or external URL if deployed separately
YOUR_SERVER_MCP_URL=https://your-server.yourdomain.com
```

### Update Vercel Environment Variables

In your Vercel dashboard:
1. Go to Project Settings > Environment Variables
2. Add `YOUR_SERVER_MCP_URL` with the production URL
3. Redeploy your Next.js app

### Security Considerations

- **Network Isolation**: Keep MCP servers on private network
- **Authentication**: Use API keys or OAuth when available
- **Rate Limiting**: Implement at MCP server level if needed
- **Resource Limits**: Set Docker memory and CPU limits
- **Health Checks**: Monitor server uptime and restart on failure

## Examples

### Example 1: Filesystem MCP (Stdio-based)

```yaml
# docker-compose.yml
filesystem-mcp:
  build:
    context: ./mcp-servers/generic-wrapper
  ports:
    - "3005:3005"
  environment:
    PORT: 3005
    MCP_COMMAND: npx
    MCP_ARGS: "@modelcontextprotocol/server-filesystem /workspace"
    SERVER_NAME: filesystem
  volumes:
    - ./workspace:/workspace:ro  # Read-only access
  restart: unless-stopped
```

### Example 2: Database MCP (HTTP-native)

```dockerfile
# mcp-servers/database-mcp/Dockerfile
FROM node:20-alpine

RUN apk add --no-cache postgresql-client

WORKDIR /app

COPY package*.json ./
RUN npm install

EXPOSE 3006

CMD ["npx", "@your/database-mcp@latest", "--http", "--port", "3006"]
```

### Example 3: Custom MCP Server

If you're building your own MCP server:

```typescript
// mcp-servers/custom-mcp/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';

const app = express();
const server = new Server({ name: 'custom-mcp', version: '1.0.0' });

// Define your tools
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'custom_tool',
      description: 'Does something custom',
      inputSchema: { type: 'object', properties: {} }
    }
  ]
}));

app.get('/health', (req, res) => res.json({ status: 'healthy' }));

app.post('/mcp', async (req, res) => {
  const transport = new SSEServerTransport('/mcp', res);
  await server.connect(transport);
});

app.listen(3007, () => console.log('Custom MCP running on 3007'));
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs your-server-mcp

# Check if port is in use
lsof -i :3005

# Rebuild from scratch
docker-compose build --no-cache your-server-mcp
```

### Health check fails

```bash
# Enter container
docker-compose exec your-server-mcp sh

# Test internally
wget -O- http://localhost:3005/health

# Check process
ps aux
```

### MCP endpoint returns errors

```bash
# Test with verbose curl
curl -v -X POST http://localhost:3005/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "initialize", "params": {}}'

# Check if stdio process is running (for wrapped servers)
docker-compose exec your-server-mcp ps aux | grep npx
```

### Agent can't connect to server

1. Check environment variable: `echo $YOUR_SERVER_MCP_URL`
2. Test from Next.js container: `curl http://your-server-mcp:3005/health`
3. Verify `officialMcpServers.ts` URL matches
4. Check Docker network: `docker network inspect agenthub_default`

## Best Practices

1. **Always add health checks** - Helps Docker restart failed containers
2. **Use semantic versioning** - Pin major version: `@package/mcp@^1.0.0`
3. **Document your tools** - Add README.md in server directory
4. **Test before commit** - Verify all endpoints work
5. **Monitor resource usage** - Set Docker limits if needed
6. **Add logging** - Use structured logs for debugging
7. **Graceful shutdown** - Handle SIGTERM properly
8. **Idempotent operations** - Tools should be safe to retry

## Resources

- [Model Context Protocol Spec](https://modelcontextprotocol.io/specification)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [Official MCP Servers](https://github.com/modelcontextprotocol/servers)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Playwright MCP Example](https://github.com/microsoft/playwright-mcp)

## Getting Help

- Check existing MCP servers in `mcp-servers/` directory
- Review `docker-compose.yml` for configuration examples
- Test with generic wrapper first before custom implementation
- Look at Playwright MCP as reference implementation

## Checklist

When adding a new MCP server:

- [ ] Tested server package locally (`npx @package/mcp@latest`)
- [ ] Created server directory in `mcp-servers/`
- [ ] Added Dockerfile and package.json
- [ ] Updated docker-compose.yml
- [ ] Allocated unique port (3005+)
- [ ] Added entry to officialMcpServers.ts
- [ ] Downloaded/created server icon (256x256 PNG)
- [ ] Tested health endpoint
- [ ] Tested MCP tools/list endpoint
- [ ] Tested from Next.js app
- [ ] Added environment variable documentation
- [ ] Updated this port allocation table
- [ ] Committed all changes
- [ ] Deployed to production
- [ ] Verified in production environment
