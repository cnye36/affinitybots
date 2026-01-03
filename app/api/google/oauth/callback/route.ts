import { NextRequest, NextResponse } from "next/server"
import { exchangeCodeForTokens } from "@/lib/oauth/googleOAuthClient"
import { createClient } from "@/supabase/server"

/**
 * Handles the OAuth callback from Google for both Drive and Gmail
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

    // Find the pending OAuth session by sessionId (could be gmail or google-drive)
    const { data: serverConfig, error: fetchError } = await supabase
      .from("user_mcp_servers")
      .select("*")
      .eq("user_id", user.id)
      .eq("session_id", state)
      .single()

    if (fetchError || !serverConfig) {
      console.error("Invalid or expired OAuth session:", fetchError)
      return NextResponse.redirect(new URL("/tools?error=invalid_session", url.origin))
    }

    const serverSlug = serverConfig.server_slug
    const provider = serverConfig.config?.provider || serverSlug
    
    console.log(`🔍 Google OAuth Callback - Processing ${serverSlug} for user ${user.id}, session ${state}`);

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
    console.log(`🔍 Google OAuth Callback - Storing tokens for ${serverSlug}`);
    console.log(`🔍 Google OAuth Callback - Access token length: ${tokens.access_token?.length || 0}`);
    console.log(`🔍 Google OAuth Callback - Scopes: ${tokens.scope}`);
    
    const { error: updateError } = await supabase
      .from("user_mcp_servers")
      .update({
        oauth_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        expires_at: expiresAt,
        is_enabled: true,
        config: {
          ...serverConfig.config,
          provider,
          tokenMetadata: {
            token_type: tokens.token_type || "Bearer",
            scope: tokens.scope,
            expires_at: expiresAt,
          },
        },
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("server_slug", serverSlug)
      .eq("session_id", state)

    if (updateError) {
      console.error("Failed to store OAuth tokens:", updateError)
      return NextResponse.redirect(new URL("/tools?error=storage_failed", url.origin))
    }

    console.log(`🔍 Google OAuth Callback - Successfully stored tokens for ${serverSlug}`);

    // Success! Redirect to tools page with service-specific message
    const successMessage = serverSlug === "gmail" ? "gmail=connected" : "google=connected"
    return NextResponse.redirect(new URL(`/tools?${successMessage}`, url.origin))
  } catch (error: unknown) {
    console.error("Error in Google OAuth callback:", error)
    const url = new URL(request.url)
    return NextResponse.redirect(new URL("/tools?error=unexpected", url.origin))
  }
}
