#!/usr/bin/env tsx
/**
 * Script to fix MCP server URLs in the database for Docker networking
 * 
 * Usage:
 *   pnpm tsx scripts/fix-mcp-urls.ts
 * 
 * This script:
 * 1. Finds all Google Drive MCP servers using localhost URLs
 * 2. Updates them to use host.docker.internal for Docker networking
 * 3. Optionally clears expired tokens to force re-authentication
 */

import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
	console.error("❌ Missing Supabase environment variables")
	console.error("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
	process.exit(1)
}

const supabase = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey)

async function main() {
	console.log("🔍 Checking MCP server URLs in database...\n")

	// 1. Find all Google Drive servers with localhost URLs
	const { data: servers, error: fetchError } = await supabase
		.from("user_mcp_servers")
		.select("*")
		.eq("qualified_name", "google-drive")

	if (fetchError) {
		console.error("❌ Error fetching servers:", fetchError)
		process.exit(1)
	}

	if (!servers || servers.length === 0) {
		console.log("ℹ️  No Google Drive MCP servers found in database")
		return
	}

	console.log(`Found ${servers.length} Google Drive MCP server(s):\n`)

	const now = new Date()
	let updatedCount = 0

	for (const server of servers) {
		console.log(`Server for user ${server.user_id}:`)
		console.log(`  Current URL: ${server.url}`)
		console.log(`  Expires: ${server.expires_at || "No expiry"}`)
		console.log(`  Enabled: ${server.is_enabled}`)
		
		const isExpired = server.expires_at && new Date(server.expires_at) < now
		if (isExpired) {
			console.log(`  ⚠️  Token EXPIRED`)
		}

		// Check if URL needs fixing
		const needsURLFix = 
			server.url?.includes("localhost:3002") ||
			server.url?.includes("127.0.0.1:3002")

		if (needsURLFix) {
			console.log(`  🔧 Fixing URL...`)
			
			const newUrl = "http://host.docker.internal:3002"
			
			const { error: updateError } = await supabase
				.from("user_mcp_servers")
				.update({
					url: newUrl,
					updated_at: new Date().toISOString(),
				})
				.eq("user_id", server.user_id)
				.eq("qualified_name", "google-drive")

			if (updateError) {
				console.error(`  ❌ Failed to update: ${updateError.message}`)
			} else {
				console.log(`  ✅ Updated URL to: ${newUrl}`)
				updatedCount++
			}
		} else {
			console.log(`  ✅ URL is correct`)
		}

		// Warn about expired tokens
		if (isExpired) {
			console.log(`  ℹ️  Note: Token is expired. User should reconnect via UI at /tools`)
		}

		console.log()
	}

	console.log(`\n✅ Fixed ${updatedCount} server URL(s)`)

	if (updatedCount > 0) {
		console.log("\n⚠️  IMPORTANT: Restart the LangGraph API container for changes to take effect:")
		console.log("   docker-compose restart langgraph-api")
	}

	// Check for other MCP servers that might need attention
	console.log("\n🔍 Checking other MCP servers...\n")

	const { data: otherServers } = await supabase
		.from("user_mcp_servers")
		.select("qualified_name, url, expires_at, is_enabled")
		.in("qualified_name", ["github", "hubspot", "notion"])

	if (otherServers && otherServers.length > 0) {
		console.log("Other MCP servers:")
		for (const server of otherServers) {
			const isExpired = server.expires_at && new Date(server.expires_at) < now
			const status = isExpired ? "⚠️  EXPIRED" : "✅ OK"
			console.log(`  ${server.qualified_name}: ${server.url} - ${status}`)
		}
	}
}

main().catch((error) => {
	console.error("❌ Script error:", error)
	process.exit(1)
})



