# MCP Server Discovery System - Complete Guide

## Overview

The MCP Discovery System allows you to explore the exact capabilities of each MCP server before enabling them for your assistants. Every MCP server exposes three types of capabilities:

1. **Tools** - Functions that can be executed (e.g., `create_row`, `send_message`, `search_issues`)
2. **Resources** - Data that can be read (e.g., files, documents, configurations)
3. **Prompts** - Pre-built prompt templates (e.g., code review templates, analysis prompts)

## Why This Matters

Instead of blindly enabling an entire MCP server, you can now:
- **See exactly what tools are available** before connecting
- **Understand what each tool does** via descriptions and schemas
- **Choose specific tools to enable** for your assistants
- **Avoid unexpected functionality** by reviewing capabilities first
- **Debug issues** by seeing what tools the LLM has access to

---

## How It Works

### 1. MCP Protocol Discovery

When you connect an MCP server, the system automatically queries the server using the MCP protocol:

```javascript
// Example: Discover tools from Sentry
POST https://mcp.sentry.dev/mcp
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "params": {},
  "id": 1
}

// Response
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      {
        "name": "search_issues",
        "description": "Search for issues in Sentry",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": { "type": "string" },
            "project": { "type": "string" }
          }
        }
      },
      {
        "name": "create_dsn",
        "description": "Create a new DSN for a project",
        "inputSchema": {...}
      },
      // ... 14 more tools
    ]
  }
}
```

### 2. Capability Storage

Discovered capabilities are stored in the `mcp_server_capabilities` table:

```sql
CREATE TABLE mcp_server_capabilities (
  user_id UUID,
  qualified_name TEXT,
  tools JSONB,          -- Array of tool definitions
  resources JSONB,      -- Array of resource definitions
  prompts JSONB,        -- Array of prompt definitions
  server_info JSONB,    -- Server metadata
  discovered_at TIMESTAMP
);
```

### 3. User Access

You can access these capabilities via:
- **API Endpoints** - Programmatic access
- **UI Components** - Browse in the dashboard (coming soon)
- **Assistant Configuration** - See what tools are available when configuring assistants

---

## API Endpoints

### 1. Discover Capabilities for a Single Server

**Endpoint:** `POST /api/mcp/servers/[qualifiedName]/discover`

Discovers and stores the capabilities of a specific MCP server.

**Example:**
```bash
curl -X POST https://yourdomain.com/api/mcp/servers/sentry/discover \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "capabilities": {
    "qualifiedName": "sentry",
    "tools": [
      {
        "name": "search_issues",
        "description": "Search for issues in Sentry",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": { "type": "string", "description": "Search query" },
            "project": { "type": "string", "description": "Project ID" }
          },
          "required": ["query"]
        }
      },
      {
        "name": "get_issue_details",
        "description": "Get detailed information about a specific issue",
        "inputSchema": {...}
      },
      // ... more tools
    ],
    "resources": [...],
    "prompts": [...],
    "discoveredAt": "2026-01-01T00:00:00Z"
  }
}
```

### 2. Get Stored Capabilities

**Endpoint:** `GET /api/mcp/servers/[qualifiedName]/discover`

Retrieves previously discovered capabilities from the database.

**Example:**
```bash
curl https://yourdomain.com/api/mcp/servers/zapier/discover \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "tools": [
    {
      "name": "trigger_zap",
      "description": "Trigger a Zapier automation",
      "inputSchema": {...}
    }
  ],
  "resources": [],
  "prompts": [],
  "server_info": {
    "name": "Zapier MCP Server",
    "version": "1.0.0"
  },
  "discovered_at": "2026-01-01T00:00:00Z"
}
```

### 3. Discover All Servers at Once

**Endpoint:** `POST /api/mcp/servers/discover-all`

Discovers capabilities for ALL enabled MCP servers in parallel.

**Example:**
```bash
curl -X POST https://yourdomain.com/api/mcp/servers/discover-all \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "totalServers": 10,
    "totalTools": 147,
    "totalResources": 23,
    "totalPrompts": 8,
    "serversWithTools": 10,
    "serversWithResources": 3,
    "serversWithPrompts": 2
  },
  "discovered": [
    {
      "qualifiedName": "sentry",
      "toolCount": 16,
      "resourceCount": 0,
      "promptCount": 0
    },
    {
      "qualifiedName": "zapier",
      "toolCount": 8,
      "resourceCount": 0,
      "promptCount": 0
    },
    // ... more servers
  ]
}
```

### 4. Get All Stored Capabilities

**Endpoint:** `GET /api/mcp/servers/discover-all`

Gets all previously discovered capabilities for all your servers.

**Example:**
```bash
curl https://yourdomain.com/api/mcp/servers/discover-all \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Real-World Examples

### Example 1: Sentry MCP Server

After connecting Sentry and running discovery, you'll see:

**16 Tools:**
1. `search_issues` - Search for errors and issues
2. `get_issue_details` - Get full details of a specific issue
3. `create_dsn` - Create a new Data Source Name
4. `list_projects` - List all Sentry projects
5. `query_metrics` - Query performance metrics
6. `get_organization_info` - Get organization details
7. `list_teams` - List all teams
8. `search_events` - Search for specific events
9. `get_release_info` - Get release information
10. `create_issue_comment` - Add comments to issues
11. `resolve_issue` - Mark an issue as resolved
12. `assign_issue` - Assign an issue to a team member
13. `get_error_trends` - Get error trend data
14. `query_discover` - Use Discover API for custom queries
15. `seer_autofix` - Use Seer AI to automatically fix issues
16. `get_stack_trace` - Get stack trace for an error

**Use Case:**
When an error occurs in your app, your AI assistant can:
1. Use `search_issues` to find similar errors
2. Use `get_issue_details` to see the full stack trace
3. Use `seer_autofix` to get AI-powered fix suggestions
4. Use `create_issue_comment` to document the fix

### Example 2: Zapier MCP Server

**8+ Tools (dynamically generated):**
1. `list_zaps` - List all your Zapier automations
2. `trigger_zap` - Manually trigger a Zap
3. `create_zap` - Create a new automation
4. `get_zap_history` - Get execution history
5. `pause_zap` - Pause an automation
6. `resume_zap` - Resume a paused automation
7. `test_zap` - Test a Zap configuration
8. `search_apps` - Search available Zapier apps

**Use Case:**
Your AI assistant can:
1. Use `list_zaps` to show all automations
2. Use `trigger_zap` when user says "send me a daily report"
3. Use `create_zap` to build new workflows on the fly
4. Use `get_zap_history` to debug failed automations

### Example 3: FireCrawl MCP Server

**Tools:**
1. `scrape_url` - Scrape content from a URL
2. `crawl_website` - Crawl an entire website
3. `extract_structured_data` - Extract structured data from HTML
4. `convert_to_markdown` - Convert web content to markdown
5. `batch_scrape` - Scrape multiple URLs at once

**Resources:**
- `/scraped/{id}` - Access previously scraped content
- `/crawls/{id}/results` - Access crawl results

**Use Case:**
Your knowledge base assistant can:
1. Use `scrape_url` to fetch content from documentation sites
2. Use `convert_to_markdown` to make it AI-friendly
3. Store results in the knowledge base
4. Access via resources for future queries

---

## Tool Schema Examples

### Simple Tool (No Parameters)
```json
{
  "name": "list_projects",
  "description": "List all projects in the organization",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

### Tool with Required Parameters
```json
{
  "name": "search_issues",
  "description": "Search for issues matching a query",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Search query string"
      },
      "project": {
        "type": "string",
        "description": "Project ID to search within"
      },
      "status": {
        "type": "string",
        "enum": ["resolved", "unresolved", "ignored"],
        "description": "Filter by issue status"
      }
    },
    "required": ["query"]
  }
}
```

### Tool with Complex Schema
```json
{
  "name": "create_zap",
  "description": "Create a new Zapier automation",
  "inputSchema": {
    "type": "object",
    "properties": {
      "trigger": {
        "type": "object",
        "properties": {
          "app": { "type": "string", "description": "App name (e.g., 'gmail')" },
          "event": { "type": "string", "description": "Trigger event" }
        },
        "required": ["app", "event"]
      },
      "actions": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "app": { "type": "string" },
            "action": { "type": "string" },
            "params": { "type": "object" }
          }
        }
      }
    },
    "required": ["trigger", "actions"]
  }
}
```

---

## Resource Examples

Resources are read-only data exposed by MCP servers:

```json
{
  "uri": "file:///docs/api-reference.md",
  "name": "API Reference",
  "description": "Complete API documentation",
  "mimeType": "text/markdown"
}
```

**Common Resource Types:**
- Documentation files
- Configuration files
- Log files
- Database schemas
- API specifications

---

## Prompt Examples

Prompts are pre-built templates for common tasks:

```json
{
  "name": "code_review",
  "description": "Perform a comprehensive code review",
  "arguments": [
    {
      "name": "code",
      "description": "The code to review",
      "required": true
    },
    {
      "name": "language",
      "description": "Programming language",
      "required": false
    }
  ]
}
```

**Common Prompt Types:**
- Code review templates
- Analysis prompts
- Report generation templates
- Debugging guides

---

## Best Practices

### 1. Discover After Connecting
Always run discovery after connecting a new MCP server:

```bash
# After OAuth or API key setup
POST /api/mcp/servers/sentry/discover
```

### 2. Refresh Periodically
MCP servers may add new tools over time. Re-discover monthly:

```bash
# Cron job or scheduled task
POST /api/mcp/servers/discover-all
```

### 3. Review Before Enabling
Before enabling a server for assistants, review its tools:

```bash
GET /api/mcp/servers/zapier/discover
# Review the tools list
# Understand what the LLM will have access to
```

### 4. Document Your Integrations
Keep track of which tools you're using:

```markdown
## Sentry Integration
- ✅ search_issues - Find errors in production
- ✅ seer_autofix - Get AI fix suggestions
- ❌ create_dsn - Not needed for our use case
- ❌ list_teams - Internal only
```

### 5. Test Tools Individually
Before giving access to assistants, test tools manually:

```bash
# Test a specific tool
POST /api/agents/{agentId}/tools/{toolName}/execute
{
  "args": {
    "query": "TypeError"
  }
}
```

---

## Troubleshooting

### No Tools Discovered

**Problem:** Discovery returns empty tools array

**Solutions:**
1. Check server is connected (OAuth or API key valid)
2. Verify server URL is correct
3. Check server supports MCP protocol version
4. Review server logs for authentication errors

### Discovery Fails

**Problem:** Discovery endpoint returns error

**Solutions:**
1. Check server is reachable (network/firewall)
2. Verify authentication credentials are valid
3. Check rate limits haven't been exceeded
4. Try manual MCP request to test server

### Tools Not Appearing in Assistant

**Problem:** Tools are discovered but not available to LLM

**Solutions:**
1. Verify server is enabled in assistant config
2. Check `user_mcp_servers` table shows `is_enabled: true`
3. Clear MCP client cache
4. Restart assistant session

---

## Future Enhancements

### Planned Features:
1. **Selective Tool Enabling** - Enable only specific tools per assistant
2. **Tool Usage Analytics** - Track which tools are used most
3. **Tool Testing UI** - Test tools directly from dashboard
4. **Tool Documentation** - Enhanced descriptions with examples
5. **Tool Categories** - Organize tools by category (CRUD, Search, etc.)
6. **Custom Tool Filters** - Filter by keyword, type, or server
7. **Tool Versioning** - Track changes to tool schemas over time

---

## Example Workflows

### Workflow 1: Setting Up Sentry Integration

1. **Connect Sentry:**
   ```
   Navigate to /tools → Find Sentry → Click Connect → OAuth
   ```

2. **Discover Capabilities:**
   ```bash
   POST /api/mcp/servers/sentry/discover
   ```

3. **Review Tools:**
   ```bash
   GET /api/mcp/servers/sentry/discover
   # See all 16 tools
   ```

4. **Enable for Assistant:**
   ```
   Navigate to assistant settings → MCP Servers → Enable Sentry
   ```

5. **Test:**
   ```
   Ask assistant: "Search for TypeErrors in Sentry"
   # Assistant uses search_issues tool
   ```

### Workflow 2: Bulk Discovery for New User

1. **Connect Multiple Servers:**
   - Sentry (OAuth)
   - Zapier (OAuth)
   - FireCrawl (API Key)
   - Brave Search (API Key)

2. **Discover All at Once:**
   ```bash
   POST /api/mcp/servers/discover-all
   ```

3. **Review Summary:**
   ```json
   {
     "totalServers": 4,
     "totalTools": 42,
     "totalResources": 5,
     "totalPrompts": 2
   }
   ```

4. **Enable Strategically:**
   - Enable Sentry for debugging assistant
   - Enable Zapier for automation assistant
   - Enable FireCrawl for research assistant
   - Enable Brave Search for all assistants

---

## Summary

The MCP Discovery System gives you complete visibility into what each MCP server can do. Instead of blindly trusting external servers, you can:

✅ See exactly what tools are available
✅ Understand tool parameters and schemas
✅ Review before enabling for assistants
✅ Debug tool usage issues
✅ Make informed decisions about integrations

This transparency is crucial for:
- **Security** - Know what external APIs can be called
- **Debugging** - Understand what the LLM has access to
- **User Experience** - Choose the right tools for each assistant
- **Compliance** - Document exactly what integrations do

---

**Next Steps:**
1. Run discovery for all your enabled servers: `POST /api/mcp/servers/discover-all`
2. Review the capabilities in the database
3. Build UI components to display this data (coming soon)
4. Enable selective tool filtering per assistant (roadmap)
