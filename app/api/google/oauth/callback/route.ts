import { NextRequest, NextResponse } from "next/server"
import { exchangeCodeForTokens } from "@/lib/oauth/googleOAuthClient"
import { createClient } from "@/supabase/server"

/**
 * Handles the OAuth callback from Google
 * Exchanges the authorization code for tokens and stores them
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state") // This is our sessionId
    const error = url.searchParams.get("error")

    // Check for OAuth errors
    if (error) {
      console.error("OAuth error from Google:", error, url.searchParams.get("error_description"))
      return NextResponse.redirect(new URL("/tools?error=oauth_denied", url.origin))
    }

    if (!code) {
      return NextResponse.redirect(new URL("/tools?error=missing_code", url.origin))
    }

    if (!state) {
      return NextResponse.redirect(new URL("/tools?error=missing_state", url.origin))
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the session exists and belongs to this user
    const { data: serverConfig, error: fetchError } = await supabase
      .from("user_mcp_servers")
      .select("*")
      .eq("user_id", user.id)
      .eq("qualified_name", "google-drive")
      .eq("session_id", state)
      .single()

    if (fetchError || !serverConfig) {
      console.error("Invalid or expired OAuth session:", fetchError)
      return NextResponse.redirect(new URL("/tools?error=invalid_session", url.origin))
    }

    // Exchange the authorization code for tokens
    let tokens
    try {
      tokens = await exchangeCodeForTokens(code)
    } catch (tokenError) {
      console.error("Failed to exchange code for tokens:", tokenError)
      return NextResponse.redirect(new URL("/tools?error=token_exchange_failed", url.origin))
    }

    // Calculate expiration timestamp
    const expiresAt = tokens.expiry_date 
      ? new Date(tokens.expiry_date).toISOString() 
      : null

    // Update the server configuration with tokens
    console.log(`🔍 Google OAuth Callback - Storing tokens for user ${user.id}, session ${state}`);
    console.log(`🔍 Google OAuth Callback - Access token length: ${tokens.access_token?.length || 0}`);
    
    const { error: updateError } = await supabase
      .from("user_mcp_servers")
      .update({
        oauth_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        expires_at: expiresAt,
        is_enabled: true,
        config: {
          ...serverConfig.config,
          provider: "google-drive",
          tokenMetadata: {
            token_type: tokens.token_type || "Bearer",
            scope: tokens.scope,
            expires_at: expiresAt,
          },
        },
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("qualified_name", "google-drive")
      .eq("session_id", state)

    if (updateError) {
      console.error("Failed to store OAuth tokens:", updateError)
      return NextResponse.redirect(new URL("/tools?error=storage_failed", url.origin))
    }

    console.log(`🔍 Google OAuth Callback - Successfully stored tokens for user ${user.id}`);

    // Success! Redirect to tools page
    return NextResponse.redirect(new URL("/tools?google=connected", url.origin))
  } catch (error: unknown) {
    console.error("Error in Google OAuth callback:", error)
    const url = new URL(request.url)
    return NextResponse.redirect(new URL("/tools?error=unexpected", url.origin))
  }
}

