/**
 * MCP Endpoint Validation Script
 * Tests HTTP connectivity and MCP protocol compliance for remote MCP servers
 */

interface MCPServer {
	name: string
	url: string
	authType: "oauth" | "api_key" | "none"
	headers?: Record<string, string>
}

interface ValidationResult {
	server: string
	url: string
	accessible: boolean
	mcpCompliant: boolean | null
	tools: string[] | null
	error: string | null
	responseTime: number | null
}

const TEST_SERVERS: MCPServer[] = [
	{
		name: "Sentry",
		url: "https://mcp.sentry.dev/mcp",
		authType: "oauth",
	},
	{
		name: "Pinecone Assistant",
		url: "https://production-starter-environment.pinecone.io/mcp/assistants/example",
		authType: "api_key",
		headers: {
			Authorization: "Bearer YOUR_API_KEY_HERE",
		},
	},
	{
		name: "FireCrawl",
		url: "https://mcp.firecrawl.dev/YOUR_API_KEY/sse",
		authType: "api_key",
	},
	{
		name: "Prisma Postgres",
		url: "https://mcp.prisma.io/mcp",
		authType: "api_key",
	},
	{
		name: "AWS Knowledge",
		url: "https://knowledge-mcp.global.api.aws",
		authType: "api_key",
	},
]

/**
 * Test basic HTTP connectivity to an MCP server endpoint
 */
async function testConnectivity(server: MCPServer): Promise<{
	accessible: boolean
	responseTime: number | null
	error: string | null
}> {
	const startTime = Date.now()

	try {
		const response = await fetch(server.url, {
			method: "GET",
			headers: server.headers || {},
			signal: AbortSignal.timeout(10000), // 10 second timeout
		})

		const responseTime = Date.now() - startTime

		return {
			accessible: response.ok || response.status === 401 || response.status === 403,
			responseTime,
			error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
		}
	} catch (error) {
		const responseTime = Date.now() - startTime
		return {
			accessible: false,
			responseTime,
			error: error instanceof Error ? error.message : String(error),
		}
	}
}

/**
 * Test MCP protocol compliance by attempting to list tools
 */
async function testMCPProtocol(server: MCPServer): Promise<{
	compliant: boolean
	tools: string[] | null
	error: string | null
}> {
	try {
		// MCP protocol: JSON-RPC 2.0 request to list tools
		const mcpRequest = {
			jsonrpc: "2.0",
			id: 1,
			method: "tools/list",
			params: {},
		}

		const response = await fetch(server.url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(server.headers || {}),
			},
			body: JSON.stringify(mcpRequest),
			signal: AbortSignal.timeout(15000), // 15 second timeout
		})

		if (!response.ok) {
			return {
				compliant: false,
				tools: null,
				error: `HTTP ${response.status}: ${response.statusText}`,
			}
		}

		const data = await response.json()

		// Check if response follows MCP protocol structure
		if (data.jsonrpc !== "2.0" || !data.result) {
			return {
				compliant: false,
				tools: null,
				error: "Response does not follow MCP protocol structure",
			}
		}

		// Extract tool names
		const tools = data.result.tools?.map((tool: any) => tool.name) || []

		return {
			compliant: true,
			tools,
			error: null,
		}
	} catch (error) {
		return {
			compliant: false,
			tools: null,
			error: error instanceof Error ? error.message : String(error),
		}
	}
}

/**
 * Validate a single MCP server
 */
async function validateServer(server: MCPServer): Promise<ValidationResult> {
	console.log(`\nValidating ${server.name}...`)
	console.log(`URL: ${server.url}`)
	console.log(`Auth: ${server.authType}`)

	// Test connectivity first
	const connectivityResult = await testConnectivity(server)

	if (!connectivityResult.accessible) {
		console.log(`❌ Not accessible: ${connectivityResult.error}`)
		return {
			server: server.name,
			url: server.url,
			accessible: false,
			mcpCompliant: null,
			tools: null,
			error: connectivityResult.error,
			responseTime: connectivityResult.responseTime,
		}
	}

	console.log(`✅ Accessible (${connectivityResult.responseTime}ms)`)

	// Test MCP protocol compliance
	const protocolResult = await testMCPProtocol(server)

	if (!protocolResult.compliant) {
		console.log(`⚠️  MCP protocol test failed: ${protocolResult.error}`)
		return {
			server: server.name,
			url: server.url,
			accessible: true,
			mcpCompliant: false,
			tools: null,
			error: protocolResult.error,
			responseTime: connectivityResult.responseTime,
		}
	}

	console.log(`✅ MCP Compliant`)
	console.log(`📋 Tools discovered: ${protocolResult.tools?.length || 0}`)
	if (protocolResult.tools && protocolResult.tools.length > 0) {
		protocolResult.tools.slice(0, 5).forEach(tool => {
			console.log(`   - ${tool}`)
		})
		if (protocolResult.tools.length > 5) {
			console.log(`   ... and ${protocolResult.tools.length - 5} more`)
		}
	}

	return {
		server: server.name,
		url: server.url,
		accessible: true,
		mcpCompliant: true,
		tools: protocolResult.tools,
		error: null,
		responseTime: connectivityResult.responseTime,
	}
}

/**
 * Run validation on all test servers
 */
async function runValidation() {
	console.log("=" + "=".repeat(70))
	console.log("MCP Endpoint Validation")
	console.log("=" + "=".repeat(70))

	const results: ValidationResult[] = []

	for (const server of TEST_SERVERS) {
		const result = await validateServer(server)
		results.push(result)
		await new Promise(resolve => setTimeout(resolve, 1000)) // Rate limiting
	}

	// Summary
	console.log("\n" + "=" + "=".repeat(70))
	console.log("Validation Summary")
	console.log("=" + "=".repeat(70) + "\n")

	const accessible = results.filter(r => r.accessible).length
	const compliant = results.filter(r => r.mcpCompliant === true).length

	console.log(`Servers Tested: ${results.length}`)
	console.log(`Accessible: ${accessible}/${results.length}`)
	console.log(`MCP Compliant: ${compliant}/${results.length}`)

	console.log("\nDetailed Results:")
	results.forEach(result => {
		const status = result.mcpCompliant
			? "✅ READY"
			: result.accessible
				? "⚠️  ACCESSIBLE"
				: "❌ FAILED"
		console.log(`\n${status} - ${result.server}`)
		console.log(`  URL: ${result.url}`)
		if (result.responseTime) {
			console.log(`  Response Time: ${result.responseTime}ms`)
		}
		if (result.tools) {
			console.log(`  Tools: ${result.tools.length}`)
		}
		if (result.error) {
			console.log(`  Error: ${result.error}`)
		}
	})

	// Export results to JSON
	const fs = require("fs")
	const path = require("path")
	const outputPath = path.join(__dirname, "validation-results.json")
	fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
	console.log(`\n✅ Results saved to: ${outputPath}`)
}

// Run validation if executed directly
if (require.main === module) {
	runValidation().catch(console.error)
}

export { validateServer, runValidation, type MCPServer, type ValidationResult }
