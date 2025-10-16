# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development
pnpm dev                      # Start Next.js dev server (http://localhost:3000)
docker-compose up langgraph-api  # Start Langgraph backend (http://localhost:8123)
pnpm run schedule:worker:dev  # Start schedule worker (development mode)

# Testing
pnpm test                     # Run all Jest unit tests
pnpm test:watch              # Run tests in watch mode
pnpm test:coverage           # Generate coverage report
pnpm test Button.test.tsx    # Run specific test file
pnpm test:e2e                # Run Playwright E2E tests
pnpm test:e2e:ui             # Run E2E tests with UI
pnpm test:e2e:debug          # Run E2E tests in debug mode
pnpm test:all                # Run both unit and E2E tests

# Build & Production
pnpm build                   # Build for production (uses --no-lint flag)
pnpm start                   # Start production server
pnpm lint                    # Run ESLint
pnpm lint --fix              # Auto-fix linting issues

# MCP Diagnostics
pnpm run mcp:diag            # Run MCP diagnostics
pnpm run mcp:fix             # Auto-fix MCP issues

# Schedule Worker
pnpm run schedule:worker     # Start production schedule worker
```

## High-Level Architecture

### Stack Overview
- **Frontend**: Next.js 15 with App Router, TypeScript, React 19
- **Backend**: Langgraph platform (Docker-based AI agent runtime)
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth
- **State Management**: Zustand + Langgraph Platform state
- **Queue/Jobs**: BullMQ with Redis (for scheduled workflows)
- **Styling**: Tailwind CSS with Radix UI components
- **Package Manager**: pnpm (required)

### Core Application Structure

**App Router Layout** (`app/` directory):
- `(app)/` - Protected app routes (assistants, workflows, dashboard, settings)
- `api/` - Next.js API routes (REST endpoints)
- `auth/` - Authentication callbacks and validation
- Public routes: `/blog`, `/pricing`, `/features`, `/privacy`

**Key Domain Areas**:

1. **Assistants** (`/lib/agent/`, `/app/api/agents/`)
   - AI agents powered by Langgraph with configurable LLMs
   - Support for multiple models (GPT-4/5, Claude Opus/Sonnet, Gemini)
   - Memory system for persistent context across conversations
   - Knowledge base integration with RAG (Retrieval Augmented Generation)
   - MCP (Model Context Protocol) server integration for external tools

2. **MCP (Model Context Protocol)** (`/lib/mcp/`)
   - Extensible tool system allowing assistants to integrate with external services
   - Supports OAuth-authenticated MCP servers (GitHub, HubSpot, etc.)
   - Client management with session caching and validation
   - Factory pattern for creating and managing MCP clients (`mcpClientFactory.ts`)
   - Session store for OAuth tokens with expiration handling
   - Both user-added and globally available MCP servers

3. **Workflows** (`/app/(app)/workflows/`, `/app/api/workflows/`)
   - Visual workflow builder using ReactFlow
   - Chain multiple AI assistants together in DAG (directed acyclic graph)
   - Two node types: Triggers (initiate workflows) and Tasks (AI agent actions)
   - Trigger types: manual, webhook, form, integration, schedule
   - Thread management: workflows can share context or isolate tasks
   - Tool approval system: auto or manual approval for MCP tool calls
   - Scheduled execution via BullMQ worker (`scripts/schedule-worker.ts`)

4. **Knowledge Base** (`/lib/retrieval.ts`)
   - Document ingestion supporting multiple formats (PDF, DOCX, TXT, CSV, XLSX)
   - Vector embeddings stored in Supabase with pgvector
   - Semantic search for RAG in assistant conversations
   - Document chunking and metadata extraction

5. **OAuth Integration** (`/lib/oauth/`)
   - Generic OAuth client framework (`oauthClient.ts`)
   - Provider-specific implementations (GitHub, HubSpot)
   - Session management with Redis-backed store
   - Token refresh and expiration handling

### Important Data Flow Patterns

**Assistant Execution Flow**:
1. User message → `/app/api/agents/[agentId]/chat/route.ts`
2. Load assistant config from Supabase (includes MCP servers, memory settings, knowledge base)
3. Create MCP clients via `mcpClientFactory` (handles OAuth sessions)
4. Initialize Langgraph agent in `lib/agent/reactAgent.ts`
5. Retrieve relevant knowledge if enabled
6. Execute agent with streaming response
7. Extract and store memories if memory enabled

**Workflow Execution Flow**:
1. Trigger invoked → `/app/api/workflows/[workflowId]/triggers/[triggerId]/invoke/route.ts`
2. Create workflow run record
3. Execute tasks in sequence based on edges
4. Each task invokes assigned assistant via Langgraph
5. Thread management: share context or isolate based on task config
6. Tool approval checks if configured
7. Store outputs and update run status

**MCP Integration Flow**:
1. User enables MCP server for assistant
2. If OAuth required, redirect to `/app/api/mcp/auth/connect/route.ts`
3. OAuth callback stores session in Redis (`lib/oauth/sessionStore.ts`)
4. During assistant execution, `mcpClientFactory.createForAgent()` creates clients
5. Clients are cached and validated for session expiration
6. Tools from MCP servers available to Langgraph agent

### Database Schema Key Tables

- `user_assistants` - Assistant configurations owned by users
- `user_mcp_servers` - User-specific MCP server configs with OAuth sessions
- `global_mcp_servers` - Globally available MCP servers (Smithery registry)
- `workflows` - Workflow definitions
- `workflow_tasks` - Tasks within workflows (AI agent nodes)
- `workflow_triggers` - Workflow trigger configurations
- `workflow_runs` - Execution history
- `knowledge_documents` - Uploaded documents for RAG
- `document_vectors` - Vector embeddings for semantic search
- `activity_log` - User activity tracking

### Testing Structure

- **Unit/Integration**: `*.test.ts(x)` files using Jest + React Testing Library
- **Test utilities**: `lib/test-utils.tsx` - shared test helpers
- **E2E**: `e2e/*.spec.ts` using Playwright (multi-browser)
- **API route tests**: Test Next.js handlers directly with `NextRequest` mocks
- Omit "should" from test names (e.g., `it("validates input")`)

### Environment Configuration

Key environment variables (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase config
- `REDIS_URL` / `REDIS_URI` - Redis for BullMQ and OAuth sessions
- `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT` - Langgraph tracing
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY` - LLM providers

### Code Style (from AGENT.md)

- TypeScript strict mode with exact optional properties
- Tabs for indentation (2 spaces for YAML/JSON/Markdown)
- Double quotes, no semicolons, trailing commas
- JSDoc for public APIs, not `//` comments
- 120 character line limit
- Never use `@ts-expect-error` or `@ts-ignore`
- Prefer functional programming patterns
- CamelCase: use "URL", "API", "ID" (not "Url", "Api", "Id")

### Deployment Architecture

- **Frontend + API Routes**: Vercel (Next.js)
- **Langgraph Backend**: Docker container (see `docker-compose.yml`)
- **Schedule Worker**: Separate process/container (Railway/Render/Fly.io or local)
- **Redis**: Upstash (external, not local Docker)
- **Database**: Supabase hosted PostgreSQL

### Common Patterns

**Supabase Client Usage**:
- Client components: `createBrowserClient()` from `@supabase/ssr`
- Server components: `createServerClient()` with cookies
- Admin operations: `getSupabaseAdmin()` from `lib/supabase-admin.ts`

**MCP Server Registration**:
- User-added servers go to `user_mcp_servers` table
- Discoverable servers fetched from Smithery API and cached in `global_mcp_servers`
- OAuth sessions stored separately in `sessionStore` (Redis)

**Workflow Scheduling**:
- Schedules registered in `workflow_triggers` table with cron expressions
- BullMQ jobs created via `lib/scheduler/scheduler.ts`
- Worker process (`scripts/schedule-worker.ts`) must run separately
- Uses cron-parser for schedule validation

**Agent Memory**:
- Memories extracted from conversations using LLM
- Stored in Langgraph platform store (injected via `config.store`)
- Retrieved during agent initialization for context

### Known Integration Points

- **Smithery**: MCP server discovery and registry
- **HubSpot**: OAuth integration for CRM access
- **GitHub**: OAuth for repository/code access
- **Langgraph Platform**: Remote agent execution and state management
