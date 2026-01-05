# Agent Contributor Guide

AffinityBots is a full-stack web application with a Next.js 15 App Router frontend, React 19, and a
Langgraph backend running in Docker.

## Build & Commands

- Typecheck and lint: `pnpm lint && pnpm build` (build runs with `--no-lint`)
- Fix linting: `pnpm lint --fix`
- Start dev server: `pnpm dev`
- Start Langgraph backend: `docker-compose up langgraph-api`
- Start schedule worker (dev): `pnpm run schedule:worker:dev`
- Start schedule worker (prod): `pnpm run schedule:worker`
- Build for production: `pnpm build`
- Start production server: `pnpm start`
- Run unit tests: `pnpm test`
- Run a single test: `pnpm test <file-or-pattern>`
- Jest watch/coverage: `pnpm test:watch`, `pnpm test:coverage`
- Run E2E tests: `pnpm test:e2e`
- E2E UI/debug: `pnpm test:e2e:ui`, `pnpm test:e2e:debug`
- Run all tests: `pnpm test:all`
- MCP diagnostics: `pnpm run mcp:diag`, `pnpm run mcp:fix`

### Development Environment

- Frontend dev server: http://localhost:3000
- Langgraph backend: http://localhost:8123 (via Docker)
- Supabase: configured via environment variables

## Code Style

- TypeScript strict mode (see `tsconfig.json`)
- ES modules (`"type": "module"` in `package.json`)
- Use the `@/` path alias for project imports
- Avoid `@ts-expect-error` and `@ts-ignore`
- Follow existing file formatting and patterns in the area you edit

## Testing

- Jest for unit/integration tests with React Testing Library
- Playwright for E2E tests across browsers
- Omit "should" from test names (e.g., `it("validates input")`)
- Test files: `*.test.ts`, `*.test.tsx`, or `*.spec.ts` for Jest; `e2e/*.spec.ts` for Playwright

## Architecture

- Frontend: Next.js 15 App Router + TypeScript + React 19
- Backend: Langgraph platform running in Docker
- Database: Supabase (PostgreSQL with RLS)
- Authentication: Supabase Auth
- State management: Zustand + TanStack Query where appropriate
- Queue/Jobs: BullMQ + Redis for scheduled workflows
- Styling: Tailwind CSS + Radix UI components
- Package manager: pnpm

## Security

- Never commit secrets or API keys
- Use environment variables for sensitive data
- Validate user inputs on both client and server
- Use HTTPS in production
- Follow least-privilege principles and Supabase RLS

## Git Workflow

- Run `pnpm lint` before committing
- Fix lint errors with `pnpm lint --fix`
- Never use `git push --force` on `main`
- Use `git push --force-with-lease` for feature branches if needed

## Next.js Guidelines

- Use the App Router (`app/` directory)
- Server Components by default; add `"use client"` only when needed
- Keep API routes under `app/api/`
- Add loading states and error boundaries where appropriate
- Use Next.js `Image` for optimized images

## Supabase Integration

- Use Supabase clients for DB operations
- Implement and respect RLS policies
- Handle Supabase errors explicitly
