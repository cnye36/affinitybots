import { NextRequest, NextResponse } from "next/server"
import { getGoogleAuthorizationUrl, GOOGLE_SERVICE_SCOPES } from "@/lib/oauth/googleOAuthClient"
import { createClient } from "@/supabase/server"
import { sessionStore } from "@/lib/oauth/sessionStore"

/**
 * Service-specific configuration for Google OAuth
 */
/**
 * Default URLs use Docker service names for container-to-container communication
 * These work from inside the LangGraph container
 */
const GOOGLE_SERVICE_CONFIG: Record<string, { serverName: string; urlEnvVar: string; defaultUrl: string; port: number }> = {
  drive: { serverName: "google-drive", urlEnvVar: "GOOGLE_DRIVE_MCP_URL", defaultUrl: "http://localhost:3002/mcp", port: 3002 },
  gmail: { serverName: "gmail", urlEnvVar: "GMAIL_MCP_URL", defaultUrl: "http://localhost:3003/mcp", port: 3003 },
  calendar: { serverName: "google-calendar", urlEnvVar: "GOOGLE_CALENDAR_MCP_URL", defaultUrl: "http://localhost:3004/mcp", port: 3004 },
  docs: { serverName: "google-docs", urlEnvVar: "GOOGLE_DOCS_MCP_URL", defaultUrl: "http://localhost:3005/mcp", port: 3005 },
  sheets: { serverName: "google-sheets", urlEnvVar: "GOOGLE_SHEETS_MCP_URL", defaultUrl: "http://localhost:3006/mcp", port: 3006 },
}

/**
 * Initiates Google OAuth flow for any Google service
 * This redirects the user to Google's consent screen with service-specific scopes
 * 
 * Query parameter: service=drive|gmail|calendar|docs|sheets (REQUIRED)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the service from query parameter
    const url = new URL(request.url)
    const service = url.searchParams.get("service") as keyof typeof GOOGLE_SERVICE_SCOPES
    
    // Validate service parameter - REQUIRED to prevent scope confusion
    if (!service || !GOOGLE_SERVICE_CONFIG[service]) {
      const validServices = Object.keys(GOOGLE_SERVICE_CONFIG).join(", ")
      return NextResponse.json({ 
        error: `Service parameter is required. Must be one of: ${validServices}` 
      }, { status: 400 })
    }

    const config = GOOGLE_SERVICE_CONFIG[service]
    const serverName = config.serverName
    let serverUrl = process.env[config.urlEnvVar] || config.defaultUrl
    
    // Normalize URL: Convert Docker service names to localhost for Next.js access
    // Docker service names only work inside Docker network, Next.js runs on host
    if (serverUrl.includes('google-drive-mcp:') || serverUrl.includes('gmail-mcp-server:')) {
      const originalUrl = serverUrl
      serverUrl = serverUrl.replace(/google-drive-mcp:|gmail-mcp-server:/g, 'localhost:')
      console.log(`[${serverName}] Normalized URL from ${originalUrl} to ${serverUrl} (Docker service names don't resolve from Next.js)`)
    }
    
    // Ensure URL has /mcp base path
    if (serverUrl.includes('localhost:300') && !serverUrl.includes('/mcp')) {
      serverUrl = `${serverUrl.replace(/\/$/, '')}/mcp`
      console.log(`[${serverName}] Added /mcp base path: ${serverUrl}`)
    }

    // Generate a cryptographically secure session ID to track this OAuth flow
    const sessionId = sessionStore.generateSessionId()
    
    console.log(`[${serverName}] 🔍 Google OAuth Connect - Starting ${service} OAuth flow for user ${user.id}`)
    console.log(`[${serverName}] Session ID: ${sessionId}`)
    console.log(`[${serverName}] Server URL: ${serverUrl}`)
    console.log(`[${serverName}] IMPORTANT: Each Google service (drive, gmail, etc.) requires separate OAuth authorization`)
    console.log(`[${serverName}] IMPORTANT: This OAuth flow is ONLY for ${serverName} - will NOT authorize other Google servers`)
    
    // Get the authorization URL with state parameter and appropriate scopes
    const authUrl = getGoogleAuthorizationUrl(service, sessionId)

    const callbackUrl = `${url.origin}/api/google/oauth/callback`
    
    // Create a placeholder entry in user_mcp_servers to track this OAuth attempt
    const { error: insertError } = await supabase
      .from("user_mcp_servers")
      .upsert({
        user_id: user.id,
        server_slug: serverName,
        url: serverUrl,
        session_id: sessionId,
        config: {
          callbackUrl,
          provider: service, // Store the actual service type for validation
        },
        is_enabled: false, // Will be enabled after successful OAuth
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,server_slug",
      })

    if (insertError) {
      console.error("Failed to store OAuth attempt:", insertError)
      return NextResponse.json({ error: "Failed to initiate OAuth" }, { status: 500 })
    }

    console.log(`🔍 Google OAuth Connect - Redirecting to: ${authUrl}`);

    // Redirect to Google OAuth consent screen
    return NextResponse.redirect(authUrl)
  } catch (error: unknown) {
    console.error("Error initiating Google OAuth:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
