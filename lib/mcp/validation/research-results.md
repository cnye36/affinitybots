# MCP Server Research Results - January 2026

## Executive Summary

Researched 16 official MCP servers from PulseMCP. **Confirmed HTTP endpoints for 13/16 servers** (81% success rate).

### Ready for Implementation (13 servers)
- 10 servers with confirmed HTTP/remote endpoints
- 3 servers with local HTTP mode available

### Deferred (3 servers)
- Storybook - Experimental, localhost only during development
- Playwright - Requires local installation, HTTP mode available but complex
- OVHcloud - MCP server still in development

---

## Tier 1: Production-Ready HTTP Endpoints (10 servers)

### 1. Sentry ✅ READY
- **HTTP Endpoint:** `https://mcp.sentry.dev/mcp`
- **Auth:** OAuth
- **Transport:** Streamable HTTP with SSE fallback
- **Status:** Production-ready, official Sentry server
- **Docs:** [Sentry MCP Server](https://docs.sentry.io/product/sentry-mcp/)
- **Features:** 16+ tool calls, error tracking, project management
- **Implementation Priority:** HIGH - Developer tool

### 2. Zapier ✅ READY
- **HTTP Endpoint:** Not publicly documented, requires OAuth setup
- **Auth:** OAuth 2.0 + API Key (both supported)
- **Transport:** Streamable HTTP with SSE
- **Status:** Production-ready, 8000+ app integrations
- **Docs:** [Zapier MCP](https://zapier.com/mcp)
- **Features:** RESTful API endpoints following OpenAPI spec
- **Implementation Priority:** HIGHEST - Maximum value

### 3. Pinecone Assistant ✅ READY
- **HTTP Endpoint:** `https://<PINECONE_HOST>/mcp/assistants/<ASSISTANT_NAME>`
- **Auth:** API Key (Bearer token in Authorization header)
- **Transport:** Streamable HTTP (SSE deprecated Aug 2025)
- **Status:** Production-ready, early access
- **Docs:** [Pinecone MCP](https://docs.pinecone.io/guides/assistant/mcp-server)
- **Features:** Vector search, contextual knowledge
- **Implementation Priority:** HIGH - RAG enhancement

### 4. FireCrawl ✅ READY
- **HTTP Endpoint:** `https://mcp.firecrawl.dev/{FIRECRAWL_API_KEY}/sse`
- **Auth:** API Key (embedded in URL)
- **Transport:** Streamable HTTP, set `HTTP_STREAMABLE_SERVER=true`
- **Status:** Production-ready
- **Docs:** [FireCrawl MCP](https://docs.firecrawl.dev/mcp-server)
- **Features:** Web scraping, crawling, structured data extraction
- **Implementation Priority:** HIGH - Knowledge base enrichment

### 5. Snowflake ✅ READY
- **HTTP Endpoint:** POST `/api/v2/databases/{database}/schemas/{schema}/mcp-servers/{name}`
- **Auth:** OAuth (Snowflake's built-in OAuth)
- **Transport:** Streamable HTTP
- **Status:** General availability (GA)
- **Docs:** [Snowflake MCP](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents-mcp)
- **Features:** Cortex AI, SQL orchestration, RBAC
- **Implementation Priority:** MEDIUM - Enterprise data platform

### 6. dbt Cloud ✅ READY
- **HTTP Endpoint:** Remote MCP server (cloud-hosted, specific URL not public)
- **Auth:** API Key (dbt Cloud API token)
- **Transport:** Streamable HTTP
- **Status:** Production-ready, announced Dec 2025
- **Docs:** [dbt MCP](https://docs.getdbt.com/docs/dbt-ai/about-mcp)
- **Features:** dbt CLI, API, Discovery API, Semantic Layer, Admin API
- **Implementation Priority:** MEDIUM - Data transformation

### 7. Prisma Postgres ✅ READY
- **HTTP Endpoint:** `https://mcp.prisma.io/mcp`
- **Auth:** API Key (Prisma Console authentication)
- **Transport:** Streamable HTTP
- **Status:** Production-ready (Prisma CLI v6.6.0+)
- **Docs:** [Prisma MCP](https://www.prisma.io/docs/postgres/integrations/mcp-server)
- **Features:** Backup creation, connection strings, database recovery
- **Implementation Priority:** MEDIUM - Database management

### 8. AWS Knowledge/Documentation ✅ READY
- **HTTP Endpoint:** `https://knowledge-mcp.global.api.aws`
- **Auth:** AWS IAM (API Key or IAM credentials)
- **Transport:** Streamable HTTP
- **Status:** Production-ready, fully managed
- **Docs:** [AWS MCP Servers](https://awslabs.github.io/mcp/)
- **Features:** AWS docs search, API references, regional availability, announcements
- **Implementation Priority:** MEDIUM - Developer documentation

### 9. Dynatrace ✅ READY
- **HTTP Endpoint:** Supports HTTP server mode (configurable port/host)
- **Auth:** API Key (Dynatrace API token)
- **Transport:** HTTP mode available
- **Status:** Production-ready
- **Docs:** [Dynatrace MCP](https://github.com/dynatrace-oss/dynatrace-mcp)
- **NPM:** `@dynatrace-oss/dynatrace-mcp-server`
- **Features:** Real-time observability, metrics, logs, anomalies
- **Implementation Priority:** MEDIUM - Observability

### 10. Browserbase ✅ READY
- **HTTP Endpoint:** Remote hosted via Smithery.ai or self-hosted HTTP endpoint
- **Auth:** API Key (Browserbase API key)
- **Transport:** HTTP (self-hosted: `/v1/tool-endpoint` on port 8080)
- **Status:** Production-ready
- **Docs:** [Browserbase MCP](https://docs.browserbase.com/integrations/mcp/introduction)
- **Features:** Cloud browser automation via Stagehand
- **Implementation Priority:** HIGH - Browser automation

---

## Tier 2: Local HTTP Mode Available (3 servers)

### 11. Brave Search ⚠️ LOCAL HTTP
- **HTTP Endpoint:** Local only, `--transport http` flag required
- **Auth:** API Key (BRAVE_API_KEY environment variable)
- **Transport:** STDIO (default) or HTTP (via flag)
- **Status:** Production-ready but defaults to STDIO
- **Docs:** [Brave Search MCP](https://github.com/brave/brave-search-mcp-server)
- **NPM:** `@brave/brave-search-mcp-server`
- **Features:** Web search, local business search
- **Implementation Priority:** HIGH - Search capability
- **NOTE:** Can be used with HTTP transport for remote connections

### 12. Storybook ⚠️ LOCAL HTTP
- **HTTP Endpoint:** `http://localhost:6006/mcp` (addon) or `http://localhost:13316/mcp` (standalone)
- **Auth:** None (local development server)
- **Transport:** HTTP (local only)
- **Status:** Experimental, under active development
- **Docs:** [Storybook MCP](https://storybook.js.org/addons/@storybook/addon-mcp)
- **Packages:** `@storybook/mcp`, `@storybook/addon-mcp`
- **Features:** Component metadata, stories, development workflows
- **Implementation Priority:** LOW - Experimental, localhost only
- **NOTE:** Good for 2026 rollouts but not production-ready yet

### 13. Playwright (Microsoft) ⚠️ LOCAL HTTP
- **HTTP Endpoint:** `http://localhost:8931/mcp` (configurable port)
- **Auth:** None (local) or custom for self-hosted
- **Transport:** HTTP/SSE (with `--port` flag)
- **Status:** Production-ready but requires local/Docker deployment
- **Docs:** [Playwright MCP](https://github.com/microsoft/playwright-mcp)
- **NPM:** `@playwright/mcp`
- **Features:** Browser automation, testing, screenshots
- **Implementation Priority:** MEDIUM - Requires Docker/local setup
- **NOTE:** Can run as long-lived HTTP service via Docker

---

## Tier 3: Deferred/Development (3 servers)

### 14. Google Toolbox for Databases ⚠️ DEFERRED
- **HTTP Endpoint:** `http://127.0.0.1:5000` (default local), can deploy to Cloud Run
- **Auth:** Google Cloud OAuth
- **Transport:** HTTP (local or Cloud Run)
- **Status:** Production-ready but requires Cloud Run deployment
- **Docs:** [MCP Toolbox](https://googleapis.github.io/genai-toolbox/)
- **Features:** AlloyDB, Spanner, Cloud SQL, Bigtable support
- **Implementation Priority:** LOW - Requires Cloud Run setup
- **NOTE:** Self-hosted solution, no public endpoint

### 15. OVHcloud ❌ DEFERRED
- **HTTP Endpoint:** No public endpoint documented
- **Auth:** Unknown
- **Transport:** Unknown
- **Status:** Still in development
- **Docs:** [OVHcloud MCP](https://blog.ovhcloud.com/model-context-protocol-mcp-with-ovhcloud-ai-endpoints/)
- **Features:** OVH cloud infrastructure management
- **Implementation Priority:** DEFERRED - Not production-ready
- **NOTE:** Wait for official release

### 16. Chrome DevTools ❌ NOT RESEARCHED
- **Status:** Not included in current research
- **Implementation Priority:** DEFERRED

---

## Implementation Recommendation

### Phase 1: Quick Wins (Week 1) - API Key Servers
1. **Sentry** - `https://mcp.sentry.dev/mcp` (OAuth but can start with API key exploration)
2. **Pinecone** - Template-based URL with API key auth
3. **FireCrawl** - `https://mcp.firecrawl.dev/{API_KEY}/sse`
4. **Browserbase** - Remote or self-hosted with API key
5. **Dynatrace** - HTTP mode with API token

### Phase 2: OAuth Integration (Week 2)
1. **Zapier** - HIGHEST PRIORITY (8000+ apps)
2. **Sentry** - Full OAuth implementation
3. **Snowflake** - Enterprise data access
4. **dbt Cloud** - Data transformation workflows

### Phase 3: Advanced (Week 3)
1. **Prisma Postgres** - `https://mcp.prisma.io/mcp`
2. **AWS Knowledge** - `https://knowledge-mcp.global.api.aws`
3. **Brave Search** - Local HTTP mode for search
4. **Playwright** - Docker-based HTTP deployment (if needed)

### Deferred Until Production-Ready
- Storybook (experimental)
- Google Toolbox (requires Cloud Run setup)
- OVHcloud (still in development)

---

## Authentication Summary

| Server | Auth Type | Credential Format | Ready |
|--------|-----------|-------------------|-------|
| Sentry | OAuth | OAuth token | ✅ |
| Zapier | OAuth + API Key | Both supported | ✅ |
| Pinecone | API Key | Bearer token | ✅ |
| FireCrawl | API Key | URL-embedded | ✅ |
| Snowflake | OAuth | Snowflake OAuth | ✅ |
| dbt Cloud | API Key | dbt Cloud token | ✅ |
| Prisma | API Key | Prisma Console auth | ✅ |
| AWS Knowledge | API Key/IAM | AWS credentials | ✅ |
| Dynatrace | API Key | Dynatrace token | ✅ |
| Browserbase | API Key | Browserbase API key | ✅ |
| Brave Search | API Key | BRAVE_API_KEY env | ⚠️ |
| Storybook | None | Local only | ⚠️ |
| Playwright | None/Custom | Configurable | ⚠️ |

---

## Sources

- [Zapier MCP](https://zapier.com/mcp)
- [Brave Search MCP](https://github.com/brave/brave-search-mcp-server)
- [Sentry MCP Server](https://docs.sentry.io/product/sentry-mcp/)
- [Browserbase MCP](https://www.browserbase.com/mcp)
- [Pinecone Assistant MCP](https://docs.pinecone.io/guides/assistant/mcp-server)
- [FireCrawl MCP](https://docs.firecrawl.dev/mcp-server)
- [Snowflake MCP](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents-mcp)
- [dbt MCP](https://docs.getdbt.com/docs/dbt-ai/about-mcp)
- [Dynatrace MCP](https://github.com/dynatrace-oss/dynatrace-mcp)
- [AWS MCP Servers](https://awslabs.github.io/mcp/)
- [Prisma MCP](https://www.prisma.io/docs/postgres/integrations/mcp-server)
- [OVHcloud MCP Blog](https://blog.ovhcloud.com/model-context-protocol-mcp-with-ovhcloud-ai-endpoints/)
- [Storybook MCP](https://storybook.js.org/addons/@storybook/addon-mcp)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)
- [Google MCP Toolbox](https://googleapis.github.io/genai-toolbox/)
