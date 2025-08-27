# AffinityBots

AffinityBots is a full-stack web application with Next.js TypeScript frontend and Langgraph backend.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Start Langgraph backend (separate terminal)
docker-compose up langgraph-api
```

## Testing

This project uses a comprehensive testing setup with multiple testing strategies:

### Unit & Integration Tests (Jest + React Testing Library)

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode during development
pnpm test:watch

# Generate coverage report
pnpm test:coverage

# Run specific test file
pnpm test Button.test.tsx
```

**Test Structure:**
- **Unit tests**: `*.test.ts`, `*.test.tsx` files
- **Component tests**: Use React Testing Library in `components/__tests__/`
- **Utility tests**: Pure function tests in `__tests__/`
- **Test utilities**: Shared helpers in `lib/test-utils.tsx`

### End-to-End Tests (Playwright)

```bash
# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI mode
pnpm test:e2e:ui

# Run E2E tests in debug mode
pnpm test:e2e:debug

# Run specific browser
pnpm test:e2e --project=chromium
```

**E2E Test Features:**
- Cross-browser testing (Chromium, Firefox, WebKit)
- Mobile device simulation
- Screenshot and video capture on failure
- Test trace recording
- Automatic dev server startup

### Running All Tests

```bash
# Run both unit and E2E tests
pnpm test:all
```

### Test Configuration

- **Jest Config**: `jest.config.mjs` - Unit test configuration
- **Playwright Config**: `playwright.config.ts` - E2E test configuration
- **Test Setup**: `jest.setup.js` - Global test setup and mocks

### Writing Tests

**Component Test Example:**
```typescript
import { render, screen, fireEvent } from '@/lib/test-utils'
import { Button } from '@/components/ui/Button'

describe('Button Component', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })
})
```

**E2E Test Example:**
```typescript
import { test, expect } from '@playwright/test'

test('should load home page', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/AffinityBots/)
})
```

**API Test Example:**
```typescript
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/health/route'

describe('/api/health', () => {
  it('should return health status', async () => {
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    expect(response.status).toBe(200)
  })
})
```

## Development

```bash
# Start development
pnpm dev

# Lint code
pnpm lint

# Fix linting issues
pnpm lint --fix

# Build for production
pnpm build

# Start production server
pnpm start
```

## Architecture

- **Frontend**: Next.js 14 with App Router and TypeScript
- **Backend**: Langgraph platform running in Docker
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Testing**: Jest + React Testing Library + Playwright
- **AI/LLM**: Langgraph with various LLM providers

## Environment Setup

Create a `.env.local` file with your configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# Add other environment variables as needed
```

## Contributing

1. Run `pnpm lint` before committing
2. Ensure all tests pass with `pnpm test:all`
3. Add tests for new features
4. Follow the coding standards in `AGENT.md`
