# Playwright MCP Server

Browser automation and testing server using the official Playwright MCP package.

## Features

- Native HTTP support (no wrapper needed)
- Control Chromium, Firefox, and WebKit browsers
- Take screenshots and PDFs
- Fill forms and interact with pages
- Execute JavaScript in browser context
- Network interception and monitoring

## Running Locally

```bash
# Install dependencies
npm install

# Run on default port 3004
npm start

# Or run on custom port
PORT=8931 npm start
```

## Docker

```bash
# Build
docker build -t playwright-mcp .

# Run
docker run -p 3004:3004 playwright-mcp
```

## Testing

```bash
# Health check
curl http://localhost:3004/health

# Test MCP endpoint
curl -X POST http://localhost:3004/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list", "params": {}}'
```

## Environment Variables

- `PORT`: Server port (default: 3004)
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`: Path to Chromium (set in Docker)
- `PLAYWRIGHT_FIREFOX_EXECUTABLE_PATH`: Path to Firefox (set in Docker)

## Available Tools

The Playwright MCP server provides tools for:

- `browser_navigate`: Navigate to a URL
- `browser_snapshot`: Capture page accessibility snapshot
- `browser_click`: Click on elements
- `browser_type`: Type text into inputs
- `browser_screenshot`: Take screenshots
- `browser_evaluate`: Execute JavaScript
- And more...

## Documentation

- [Playwright MCP GitHub](https://github.com/microsoft/playwright-mcp)
- [Playwright Documentation](https://playwright.dev/)
