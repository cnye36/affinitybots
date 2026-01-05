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

# Redis Configuration
pnpm run redis:check         # Check Redis configuration
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
- **Payments**: Stripe integration for subscriptions
- **Analytics**: Built-in analytics dashboard with activity tracking

### Core Application Structure

**App Router Layout** (`app/` directory):
- `(app)/` - Protected app routes (agents, workflows, dashboard, settings, analytics, tools, playground)
- `api/` - Next.js API routes (REST endpoints)
- `auth/` - Authentication callbacks and validation
- Public routes: `/blog`, `/pricing`, `/features`, `/privacy`

**Key Domain Areas**:

1. **Assistants/Agents** (`/lib/agent/`, `/app/api/agents/`)
   - AI agents powered by Langgraph with configurable LLMs
   - Support for multiple models (GPT-4/5, Claude Opus/Sonnet, Gemini)
   - Memory system for persistent context across conversations
   - Knowledge base integration with RAG (Retrieval Augmented Generation)
   - MCP (Model Context Protocol) server integration for external tools
   - Web search capabilities via Tavily integration
   - Multimodal support (text, images, documents)
   - Agent generation via AI (auto-create agents with specific capabilities)
   - Avatar generation for personalization

2. **MCP (Model Context Protocol)** (`/lib/mcp/`)
   - Extensible tool system allowing assistants to integrate with external services
   - Supports OAuth-authenticated MCP servers (GitHub, HubSpot, Google Drive, Gmail, etc.)
   - Client management with session caching and validation
   - Factory pattern for creating and managing MCP clients (`mcpClientFactory.ts`)
   - Session store for OAuth tokens with expiration handling
   - Both user-added and official MCP servers
   - MCP diagnostics and validation tools
   - Static capabilities detection for MCP servers
   - Web interface for MCP server discovery

3. **Workflows** (`/app/(app)/workflows/`, `/app/api/workflows/`)
   - Visual workflow builder using ReactFlow (v2 implementation)
   - Two workflow types:
     - **Sequential**: Linear chain of AI agents
     - **Orchestrator**: Manager agent delegates tasks to worker agents
   - Three node types:
     - **Triggers**: Initiate workflows (manual, webhook, form, integration, schedule)
     - **Tasks**: AI agent actions with configurable context management
     - **Orchestrator**: Manager node for orchestrator workflows
   - Thread management: workflows can share context or isolate tasks
   - Context control: agents can receive full conversation history or start isolated
   - Tool approval system: auto or manual approval for MCP tool calls
   - Scheduled execution via BullMQ worker (`scripts/schedule-worker.ts`)
   - Workflow activation/deactivation toggle
   - Execution history and run detail panels
   - Mobile-responsive design with wizard for smaller screens
   - Undo/Redo support with keyboard shortcuts (Ctrl+Z/Ctrl+Y)
   - Auto-layout using dagre algorithm
   - Snap-to-grid for precise positioning

4. **Knowledge Base** (`/lib/retrieval.ts`, `/lib/multimodal/`)
   - Document ingestion supporting multiple formats (PDF, DOCX, TXT, CSV, XLSX)
   - Vector embeddings stored in Supabase with pgvector
   - Semantic search for RAG in assistant conversations
   - Document chunking and metadata extraction
   - Multimodal file processing (images, documents)
   - Attachment handling in conversations

5. **OAuth Integration** (`/lib/oauth/`)
   - Generic OAuth client framework (`oauthClient.ts`)
   - Provider-specific implementations:
     - GitHub (code access)
     - HubSpot (CRM integration)
     - Google (Drive, Gmail, Calendar, Docs, Sheets)
   - Session management with in-memory store (sessionStore.ts)
   - Token refresh and expiration handling
   - OAuth callback handling and state validation

6. **Dashboard & Analytics** (`/app/(app)/dashboard/`, `/app/(app)/analytics/`)
   - Usage metrics and activity tracking
   - Stats overview with key performance indicators
   - Activity feed with recent actions
   - Analytics dashboard with detailed insights
   - Rate limiting monitoring
   - Subscription usage tracking

7. **Tools/MCP Management** (`/app/(app)/tools/`)
   - Browse and configure MCP servers
   - OAuth connection management
   - Server-specific configuration pages
   - Official and user-added MCP servers
   - Server validation and diagnostics

8. **Playground** (`/app/(app)/playground/`)
   - Interactive testing environment for agents
   - Quick agent creation and configuration
   - Real-time testing without saving
   - Orchestrator configuration testing

9. **Admin Panel** (`/app/(app)/admin/`)
   - Admin dashboard with system metrics
   - Rate limit management
   - Blog post management (create, edit, publish)
   - User management and monitoring
   - Notification system for admin alerts

10. **Subscription & Billing** (`/lib/subscription/`)
    - Credit-based usage system
    - Subscription tiers with different limits
    - Usage tracking per user
    - Stripe integration for payments
    - Rate limiting based on subscription tier

11. **Tutorials & Onboarding** (`/lib/tutorials/`)
    - Interactive tutorials for key features
    - Dashboard tutorial
    - Agents tutorial
    - Agent detail tutorial
    - Workflows tutorial
    - Step-by-step guidance for new users

12. **Blog System** (`/lib/blog.ts`)
    - MDX-based blog posts
    - Frontmatter metadata support
    - Admin interface for managing posts
    - Dynamic routing for blog content

### Important Data Flow Patterns

**Assistant Execution Flow**:
1. User message → `/app/api/agents/[agentId]/chat/route.ts`
2. Load assistant config from Supabase (includes MCP servers, memory settings, knowledge base)
3. Create MCP clients via `mcpClientFactory` (handles OAuth sessions)
4. Initialize Langgraph agent in `lib/agent/reactAgent.ts`
5. Retrieve relevant knowledge if enabled (RAG)
6. Execute agent with streaming response (SSE)
7. Extract and store memories if memory enabled
8. Track usage and update credits
9. Apply rate limiting based on subscription tier

**Sequential Workflow Execution Flow**:
1. Trigger invoked → `/app/api/workflows/[workflowId]/triggers/[triggerId]/invoke/route.ts`
2. Create workflow run record
3. Execute tasks in sequence based on edges
4. Each task invokes assigned assistant via Langgraph
5. Thread management: share context or isolate based on task config
6. Context control: pass conversation history or start fresh
7. Tool approval checks if configured
8. Store outputs and update run status
9. Track execution in workflow_runs table

**Orchestrator Workflow Execution Flow**:
1. Trigger invoked → `/app/api/workflows/[workflowId]/execute/route.ts`
2. Load orchestrator config (manager prompt, model, settings)
3. Initialize orchestrator agent (`lib/agent/orchestratorAgent.ts`)
4. Manager analyzes user goal and available agents
5. Manager delegates to ONE agent at a time with specific instruction
6. Agent executes and returns result to manager
7. Manager evaluates result and decides next step
8. Process continues until manager signals completion
9. Stream events back to client (orchestrator-start, manager-decision, agent-execution, done)

**MCP Integration Flow**:
1. User enables MCP server for assistant
2. If OAuth required, redirect to `/app/api/mcp/auth/connect/route.ts`
3. OAuth callback stores session in sessionStore (in-memory)
4. During assistant execution, `mcpClientFactory.createForAgent()` creates clients
5. Clients are cached and validated for session expiration
6. Tools from MCP servers available to Langgraph agent
7. Tool calls can require approval based on task configuration

### Database Schema Key Tables

**Core Tables**:
- `user_assistants` - Assistant configurations owned by users
- `user_mcp_servers` - User-specific MCP server configs with OAuth sessions
- `global_mcp_servers` - Globally available MCP servers (organization-wide)

**Workflow Tables**:
- `workflows` - Workflow definitions with type (sequential/orchestrator)
- `workflow_tasks` - Tasks within workflows (AI agent nodes)
- `workflow_triggers` - Workflow trigger configurations with cron schedules
- `workflow_runs` - Execution history and results
- `workflow_edges` - Connections between nodes (for sequential workflows)

**Knowledge & Documents**:
- `knowledge_documents` - Uploaded documents for RAG
- `document_vectors` - Vector embeddings for semantic search
- `conversations` - Chat message history
- `memories` - Extracted memories from conversations

**Analytics & Tracking**:
- `activity_log` - User activity tracking
- `usage_records` - API usage and credits consumed

**Admin & Subscription**:
- `subscriptions` - User subscription information
- `credits` - Credit balance and transactions
- `rate_limits` - Custom rate limit overrides

### Responsive Design Patterns

The application is optimized for desktop use but supports tablet and mobile devices:

**Breakpoints**:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Responsive Components**:
- **Workflow Builder**: Desktop grid layout, mobile wizard with stepper
- **Task Config Modal**: Desktop 3-column grid, tablet/mobile accordion with collapsible sections
- **Orchestrator Config Modal**: Desktop split-panel, tablet/mobile tabs
- **Modals**: Add margin on smaller screens (1rem mobile, 2rem tablet)
- **Navigation**: Responsive sidebar with mobile burger menu

**Key Responsive Patterns**:
- Use `isMobile` state with window.innerWidth checks
- Provide alternative layouts for complex UIs
- Collapsible/accordion patterns for content-heavy modals
- Tab patterns for split-panel views on mobile
- Always include close (X) buttons on modals
- Reduce font sizes and padding on smaller screens
- Use truncation and overflow handling for text

### Testing Structure

- **Unit/Integration**: `*.test.ts(x)` files using Jest + React Testing Library
- **Test utilities**: `lib/test-utils.tsx` - shared test helpers
- **E2E**: `e2e/*.spec.ts` using Playwright (multi-browser)
- **API route tests**: Test Next.js handlers directly with `NextRequest` mocks
- Omit "should" from test names (e.g., `it("validates input")`)
- Mock Supabase clients in tests
- Use `identity-obj-proxy` for CSS module mocks

### Environment Configuration

Key environment variables:

**Core Services**:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase config
- `SUPABASE_SERVICE_ROLE_KEY` - Admin operations

**Redis**:
- `REDIS_URL` / `REDIS_URI` - Local Redis for BullMQ scheduler (uses Docker langgraph-redis service)
- `RATE_LIMIT_REDIS_URL` - Separate cloud Redis for rate limiting (Upstash or similar)

**AI & LLMs**:
- `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT` - Langgraph tracing
- `OPENAI_API_KEY` - OpenAI models (GPT-4/5)
- `ANTHROPIC_API_KEY` - Claude models
- `GOOGLE_API_KEY` - Gemini models
- `TAVILY_API_KEY` - Web search integration

**Payments & Subscriptions**:
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe config
- `STRIPE_WEBHOOK_SECRET` - Webhook signature verification

**OAuth Providers**:
- GitHub: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- HubSpot: `HUBSPOT_CLIENT_ID`, `HUBSPOT_CLIENT_SECRET`
- Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

**Redis Architecture:**
- **LangGraph Platform**: Uses built-in `langgraph-redis` Docker service (configured in docker-compose.yml)
- **Rate Limiting**: Uses separate cloud Redis via `RATE_LIMIT_REDIS_URL` (recommended: Upstash free tier)
- **BullMQ Scheduler**: Uses local Docker Redis via `REDIS_URL` (same as general Redis connection)
- **OAuth Sessions**: Currently in-memory (sessionStore, not using Redis)

### Code Style

- TypeScript strict mode with exact optional properties
- Tabs for indentation (use tabs, not spaces)
- Double quotes for strings, no semicolons, trailing commas
- JSDoc for public APIs, avoid `//` comments for documentation
- 120 character line limit
- Never use `@ts-expect-error` or `@ts-ignore`
- Prefer functional programming patterns
- CamelCase: use "URL", "API", "ID" (not "Url", "Api", "Id")
- Component file names: PascalCase (e.g., `TaskNode.tsx`)
- Utility file names: camelCase (e.g., `mcpClientFactory.ts`)

### Deployment Architecture

- **Frontend + API Routes**: Vercel (Next.js)
- **Langgraph Backend**: Docker container (see `docker-compose.yml`)
- **Schedule Worker**: Separate process/container (Railway/Render/Fly.io or local)
- **Redis**:
  - Local: Docker langgraph-redis for development
  - Production: Upstash or similar cloud Redis for rate limiting
- **Database**: Supabase hosted PostgreSQL

### Common Patterns

**Supabase Client Usage**:
- Client components: `createBrowserClient()` from `@supabase/ssr`
- Server components: `createServerClient()` with cookies
- Admin operations: `getSupabaseAdmin()` from `lib/supabase-admin.ts`
- Always handle errors and check for null results

**MCP Server Registration**:
- User-added servers go to `user_mcp_servers` table
- Official MCP servers are defined in the codebase (`officialMcpServers.ts`)
- OAuth sessions stored separately in `sessionStore` (in-memory)
- Use `mcpClientFactory` for creating clients with proper caching

**Workflow Scheduling**:
- Schedules registered in `workflow_triggers` table with cron expressions
- BullMQ jobs created via `lib/scheduler/scheduler.ts`
- Worker process (`scripts/schedule-worker.ts`) must run separately
- Uses cron-parser for schedule validation
- Jobs are idempotent and can be safely retried

**Agent Memory**:
- Memories extracted from conversations using LLM
- Stored in Langgraph platform store (injected via `config.store`)
- Retrieved during agent initialization for context
- Memory extraction is opt-in per assistant

**State Management**:
- Zustand for client-side state (workflow builder, playground, etc.)
- React Query for server state and caching
- Langgraph SDK for workflow execution state
- Store definitions in `lib/stores/`

**Modal Patterns**:
- Use Radix UI Dialog component
- Include close (X) button in top-right
- Handle responsive layouts (desktop vs tablet/mobile)
- Use modal controls hooks for complex modal flows
- Auto-save patterns where appropriate (blur events)

**Streaming Responses**:
- Use Server-Sent Events (SSE) for streaming
- Proper SSE parsing with buffering across chunks
- Event types: `metadata`, `messages/partial`, `messages/complete`, `error`, `rate-limit`
- Handle partial JSON fragments gracefully
- Clean up readers and streams on component unmount

### Node Sizing and Layout (Workflows)

**Node Dimensions**:
- All node types (trigger, task, orchestrator) use consistent sizing: `min-w-[200px] max-w-[240px]`
- Nodes expand based on content but stay within bounds
- Icon sizes: `h-3.5 w-3.5` to `h-4 w-4`
- Badge text: `text-[10px]` for consistency
- Padding: `p-3` for card content, `pt-2` for top spacing

**Node Styling**:
- Trigger nodes: Blue gradient theme
- Task nodes: Violet/purple gradient theme
- Orchestrator nodes: Emerald/green gradient theme
- All nodes: Glass morphism effect (`bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm`)
- Hover effects: Shadow, glow, slight upward translation
- Status indicators: Top-right corner with colored dots

**Layout**:
- Dagre auto-layout algorithm for automatic positioning
- Snap-to-grid: 20px grid size
- Handle positions:
  - Sequential: Left (target) and Right (source)
  - Orchestrator: Top (target) and Bottom (source)

### Known Integration Points

**External Services**:
- **HubSpot**: OAuth integration for CRM access
- **GitHub**: OAuth for repository/code access
- **Google**: Drive, Gmail, Calendar, Docs, Sheets via OAuth
- **Stripe**: Payment processing and subscription management
- **Tavily**: Web search API for agents
- **Langgraph Platform**: Remote agent execution and state management

**MCP Servers** (Official):
- GitHub MCP
- Google Drive MCP
- Gmail MCP
- HubSpot MCP
- (Additional servers defined in `officialMcpServers.ts`)

### Performance Considerations

- Use React.memo for expensive components (e.g., workflow nodes)
- Implement proper comparison functions for memo components
- Debounce save operations (300ms default)
- Use pagination for large lists
- Lazy load heavy components
- Optimize bundle size with dynamic imports
- Cache MCP clients to avoid repeated initialization
- Use indexes on database queries
- Implement proper loading states to avoid layout shifts

### Security Considerations

- Row-Level Security (RLS) enabled on all Supabase tables
- OAuth state parameter validation to prevent CSRF
- Rate limiting per user and subscription tier
- API key rotation support
- Secure token storage (never expose in client code)
- Input validation on all API routes
- SQL injection prevention via parameterized queries
- XSS prevention via React's built-in escaping
- Admin routes protected with `requireAdmin()` middleware

### Accessibility

- Use semantic HTML elements
- Include ARIA labels for icon buttons
- Keyboard navigation support (Tab, Enter, Escape)
- Focus management in modals
- Screen reader support for status updates
- Color contrast compliance (WCAG AA)
- Tooltip for icon-only buttons
