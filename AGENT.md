# Agent Contributer Guide

AffinityBots is a full-stack web application with Next.js TypeScript frontend and Langgraph backend.

## Build & Commands

- Typecheck and lint everything: `pnpm run lint && pnpm run build`
- Fix linting/formatting: `pnpm run lint --fix`
- Run tests: `pnpm test` (when testing is configured)
- Run single test: `pnpm test -- --testPathPattern=src/file.test.ts` (when testing is configured)
- Start development server: `pnpm dev`
- Build for production: `pnpm build`
- Start production server: `pnpm start`
- Start Langgraph backend: `docker-compose up langgraph-api`

### Development Environment

- Frontend dev server: http://localhost:3000
- Langgraph backend: http://localhost:8123 (via Docker)
- Supabase: Configured via environment variables

## Code Style

- TypeScript: Strict mode with exactOptionalPropertyTypes, noUncheckedIndexedAccess
- Tabs for indentation (2 spaces for YAML/JSON/MD)
- Double quotes, no semicolons, trailing commas
- Use JSDoc docstrings for documenting TypeScript definitions, not `//` comments
- 120 character line limit
- Imports: Use consistent-type-imports
- Use descriptive variable/function names
- In CamelCase names, use "URL" (not "Url"), "API" (not "Api"), "ID" (not "Id")
- Prefer functional programming patterns
- Use TypeScript interfaces for public APIs
- NEVER use `@ts-expect-error` or `@ts-ignore` to suppress type errors

## Testing

- Jest for unit testing with React Testing Library for component tests
- Playwright for E2E tests across multiple browsers
- When writing tests, do it one test case at a time
- Use `expect(VALUE).toXyz(...)` instead of storing in variables
- Omit "should" from test names (e.g., `it("validates input")` not `it("should validate input")`)
- Test files: `*.test.ts`, `*.test.tsx`, or `*.spec.ts` for Jest; `*.spec.ts` in `e2e/` for Playwright
- Mock external dependencies appropriately
- For Next.js API routes, test both success and error cases
- Use `pnpm test` for unit tests, `pnpm test:e2e` for E2E tests
- Coverage reports available with `pnpm test:coverage`

## Architecture

- Frontend: Next.js 14 with App Router and TypeScript
- Backend: Langgraph platform running in Docker
- Database: Supabase (PostgreSQL)
- Authentication: Supabase Auth
- State management: Zustand + Langgraph Platform
- Styling: Tailwind CSS
- Build tool: Next.js
- Package manager: pnpm
- AI/LLM: Langgraph with various LLM providers

## Security

- Use appropriate data types that limit exposure of sensitive information
- Never commit secrets or API keys to repository
- Use environment variables for sensitive data
- Validate all user inputs on both client and server
- Use HTTPS in production
- Regular dependency updates
- Follow principle of least privilege
- Supabase RLS (Row Level Security) for database access control

## Git Workflow

- ALWAYS run `pnpm run lint` before committing
- Fix linting errors with `pnpm run lint --fix`
- NEVER use `git push --force` on the main branch
- Use `git push --force-with-lease` for feature branches if needed
- Always verify current branch before force operations

## Next.js Specific Guidelines

- Use App Router directory structure (`app/` directory)
- Server Components by default, Client Components when needed (`"use client"`)
- Use Next.js API routes for backend endpoints (`app/api/` directory)
- Implement proper error boundaries and loading states
- Use Next.js Image component for optimized images
- Follow Next.js caching and revalidation patterns
- Use TypeScript with Next.js types (`NextPage`, `NextApiRequest`, etc.)

## Supabase Integration

- Use Supabase client for database operations
- Implement proper authentication flows
- Use Row Level Security (RLS) policies
- Handle Supabase errors appropriately
- Use Supabase real-time subscriptions when needed
- Follow Supabase TypeScript patterns and type generation