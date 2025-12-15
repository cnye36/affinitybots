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
const GOOGLE_SERVICE_CONFIG: Record<string, { qualifiedName: string; urlEnvVar: string; defaultUrl: string; port: number }> = {
  drive: { qualifiedName: "google-drive", urlEnvVar: "GOOGLE_DRIVE_MCP_URL", defaultUrl: "http://google-drive-mcp:3002", port: 3002 },
  gmail: { qualifiedName: "gmail", urlEnvVar: "GMAIL_MCP_URL", defaultUrl: "http://gmail-mcp-server:3003", port: 3003 },
  calendar: { qualifiedName: "google-calendar", urlEnvVar: "GOOGLE_CALENDAR_MCP_URL", defaultUrl: "http://google-calendar-mcp:3004", port: 3004 },
  docs: { qualifiedName: "google-docs", urlEnvVar: "GOOGLE_DOCS_MCP_URL", defaultUrl: "http://google-docs-mcp:3005", port: 3005 },
  sheets: { qualifiedName: "google-sheets", urlEnvVar: "GOOGLE_SHEETS_MCP_URL", defaultUrl: "http://google-sheets-mcp:3006", port: 3006 },
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
    const qualifiedName = config.qualifiedName
    const serverUrl = process.env[config.urlEnvVar] || config.defaultUrl

    // Generate a cryptographically secure session ID to track this OAuth flow
    const sessionId = sessionStore.generateSessionId()
    
    console.log(`🔍 Google OAuth Connect - Starting ${service} OAuth flow for user ${user.id} with session ${sessionId}`);
    
    // Get the authorization URL with state parameter and appropriate scopes
    const authUrl = getGoogleAuthorizationUrl(service, sessionId)

    const callbackUrl = `${url.origin}/api/google/oauth/callback`
    
    // Create a placeholder entry in user_mcp_servers to track this OAuth attempt
    const { error: insertError } = await supabase
      .from("user_mcp_servers")
      .upsert({
        user_id: user.id,
        qualified_name: qualifiedName,
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
        onConflict: "user_id,qualified_name",
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
