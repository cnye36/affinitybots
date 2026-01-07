#!/bin/bash

# Test All MCP Servers - Quick Health Check Script
# Usage: ./mcp-servers/TEST_ALL_SERVERS.sh

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  MCP Servers Health Check                               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Server configurations
declare -A servers=(
	["Google Drive"]="3002"
	["Gmail"]="3003"
	["Playwright"]="3004"
	["Fetch"]="3005"
	["Slack"]="3006"
	["Puppeteer"]="3007"
)

passed=0
failed=0
total=${#servers[@]}

echo "Testing $total MCP servers..."
echo ""

# Test each server
for server in "${!servers[@]}"; do
	port=${servers[$server]}
	url="http://localhost:$port/health"
	
	printf "%-20s Port %s ... " "$server" "$port"
	
	# Try to curl the health endpoint
	if response=$(curl -s -f -m 5 "$url" 2>&1); then
		# Check if response contains "healthy" or valid JSON
		if echo "$response" | grep -q -i "healthy\|status"; then
			echo -e "${GREEN}✓ HEALTHY${NC}"
			((passed++))
		else
			echo -e "${RED}✗ INVALID RESPONSE${NC}"
			echo "   Response: $response"
			((failed++))
		fi
	else
		echo -e "${RED}✗ FAILED${NC}"
		echo -e "   ${YELLOW}Error: Cannot connect to server${NC}"
		((failed++))
	fi
done

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Results                                                 ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo -e "Total servers: $total"
echo -e "${GREEN}Passed: $passed${NC}"
echo -e "${RED}Failed: $failed${NC}"
echo ""

if [ $failed -eq 0 ]; then
	echo -e "${GREEN}✓ All servers are healthy!${NC}"
	exit 0
else
	echo -e "${RED}✗ Some servers failed health checks${NC}"
	echo ""
	echo "Troubleshooting:"
	echo "1. Check if servers are running:"
	echo "   docker-compose ps"
	echo ""
	echo "2. View logs for failed servers:"
	echo "   docker-compose logs [server-name]"
	echo ""
	echo "3. Restart failed servers:"
	echo "   docker-compose restart [server-name]"
	echo ""
	echo "4. Rebuild if needed:"
	echo "   docker-compose build [server-name]"
	echo "   docker-compose up -d [server-name]"
	exit 1
fi
