import { NextRequest, NextResponse } from "next/server"
import { getGoogleAuthorizationUrl } from "@/lib/oauth/googleOAuthClient"
import { createClient } from "@/supabase/server"

/**
 * Initiates Google OAuth flow for Drive access
 * This redirects the user to Google's consent screen
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Generate a session ID to track this OAuth flow
    const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36)
    
    console.log(`🔍 Google OAuth Connect - Starting OAuth flow for user ${user.id} with session ${sessionId}`);
    
    // Get the authorization URL with state parameter
    const authUrl = getGoogleAuthorizationUrl(sessionId)

    // Store the session ID temporarily so we can verify it in the callback
    // In a production app, you might want to store this in Redis with expiration
    const url = new URL(request.url)
    const callbackUrl = `${url.origin}/api/google/oauth/callback`
    
    // Create a placeholder entry in user_mcp_servers to track this OAuth attempt
    const { error: insertError } = await supabase
      .from("user_mcp_servers")
      .upsert({
        user_id: user.id,
        qualified_name: "google-drive",
        url: process.env.GOOGLE_DRIVE_MCP_URL || "http://localhost:3002",
        session_id: sessionId,
        config: {
          callbackUrl,
          provider: "google-drive",
        },
        is_enabled: false, // Will be enabled after successful OAuth
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,qualified_name",
      })

    if (insertError) {
      console.error("Failed to create OAuth session record:", insertError)
      return NextResponse.json({ error: "Failed to initiate OAuth" }, { status: 500 })
    }

    // Redirect to Google's authorization page
    return NextResponse.redirect(authUrl)
  } catch (error: unknown) {
    console.error("Error initiating Google OAuth:", error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

