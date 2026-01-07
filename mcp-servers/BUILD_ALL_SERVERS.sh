#!/bin/bash

# Build and Start All MCP Servers
# Usage: ./mcp-servers/BUILD_ALL_SERVERS.sh

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Building and Starting All MCP Servers                   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# List of all MCP servers (except Google Drive/Gmail which use custom images)
servers=(
	"playwright-mcp"
	"fetch-mcp"
	"slack-mcp"
	"puppeteer-mcp"
)

echo "Servers to build: ${#servers[@]}"
echo ""

# Build each server
for server in "${servers[@]}"; do
	echo "──────────────────────────────────────────────────────────"
	echo "Building: $server"
	echo "──────────────────────────────────────────────────────────"
	docker-compose build "$server"
	echo ""
done

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Starting Servers                                        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Start all servers
docker-compose up -d "${servers[@]}"

echo ""
echo "Waiting for servers to start..."
sleep 5

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Server Status                                           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Show status
docker-compose ps "${servers[@]}"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Testing Health Endpoints                                ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Run health check script if it exists
if [ -f "mcp-servers/TEST_ALL_SERVERS.sh" ]; then
	./mcp-servers/TEST_ALL_SERVERS.sh
else
	echo "Health check script not found. Testing manually..."
	echo ""
	
	curl -s http://localhost:3004/health && echo " ✓ Playwright (3004)" || echo " ✗ Playwright (3004)"
	curl -s http://localhost:3005/health && echo " ✓ Fetch (3005)" || echo " ✗ Fetch (3005)"
	curl -s http://localhost:3006/health && echo " ✓ Slack (3006)" || echo " ✗ Slack (3006)"
	curl -s http://localhost:3007/health && echo " ✓ Puppeteer (3007)" || echo " ✗ Puppeteer (3007)"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Complete!                                               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "1. Start your Next.js app: pnpm dev"
echo "2. Go to: http://localhost:3000/tools"
echo "3. Add servers to your agents"
echo "4. Test in chat or playground"
echo ""
echo "View logs: docker-compose logs -f [server-name]"
echo "Stop all: docker-compose stop"
echo ""
