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
    
    console.log(`[${serverSlug}] 🔍 Google OAuth Callback - Processing for user ${user.id}`)
    console.log(`[${serverSlug}] Session ID: ${state}`)
    console.log(`[${serverSlug}] Provider: ${provider}`)
    console.log(`[${serverSlug}] IMPORTANT: This callback is for ${serverSlug} ONLY - will NOT affect other Google servers`)

    // Exchange the authorization code for tokens
    let tokens
    try {
      console.log(`[${serverSlug}] Exchanging authorization code for tokens...`)
      tokens = await exchangeCodeForTokens(code)
      console.log(`[${serverSlug}] ✅ Successfully received tokens`)
    } catch (tokenError) {
      console.error(`[${serverSlug}] ❌ Failed to exchange code for tokens:`, tokenError)
      return NextResponse.redirect(new URL("/tools?error=token_exchange_failed", url.origin))
    }

    // Calculate expiration timestamp
    const expiresAt = tokens.expiry_date 
      ? new Date(tokens.expiry_date).toISOString() 
      : null

    // Update the server configuration with tokens
    // CRITICAL: Use server_slug in WHERE clause to ensure we ONLY update this specific server
    console.log(`[${serverSlug}] Storing tokens in database...`)
    console.log(`[${serverSlug}] Access token length: ${tokens.access_token?.length || 0}`)
    console.log(`[${serverSlug}] Has refresh token: ${!!tokens.refresh_token}`)
    console.log(`[${serverSlug}] Scopes: ${tokens.scope}`)
    console.log(`[${serverSlug}] Expires at: ${expiresAt}`)
    
    const { error: updateError, data: updatedRow } = await supabase
      .from("user_mcp_servers")
      .update({
        oauth_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        expires_at: expiresAt,
        is_enabled: true,
        config: {
          ...serverConfig.config,
          provider, // Store provider to distinguish between Google services
          tokenMetadata: {
            token_type: tokens.token_type || "Bearer",
            scope: tokens.scope,
            expires_at: expiresAt,
          },
        },
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("server_slug", serverSlug) // CRITICAL: Match exact server_slug (gmail vs google-drive)
      .eq("session_id", state) // Also match session_id for extra safety
      .select()
    
    if (updateError) {
      console.error(`[${serverSlug}] ❌ Failed to store OAuth tokens:`, updateError)
      return NextResponse.redirect(new URL("/tools?error=storage_failed", url.origin))
    }
    
    if (!updatedRow || updatedRow.length === 0) {
      console.error(`[${serverSlug}] ❌ No rows updated - this should not happen!`)
      return NextResponse.redirect(new URL("/tools?error=update_failed", url.origin))
    }
    
    console.log(`[${serverSlug}] ✅ Successfully stored tokens and enabled server`)
    console.log(`[${serverSlug}] Updated row server_slug: ${updatedRow[0].server_slug}`)
    console.log(`[${serverSlug}] Updated row is_enabled: ${updatedRow[0].is_enabled}`)

    // Trigger automatic discovery after successful OAuth (don't block redirect)
    console.log(`[${serverSlug}] Triggering automatic discovery...`)
    try {
      fetch(`${url.origin}/api/mcp/servers/${serverSlug}/discover`, {
        method: "POST",
      }).catch((err) => {
        console.warn(`[${serverSlug}] Failed to trigger discovery after OAuth:`, err)
      })
    } catch (discoverError) {
      console.warn(`[${serverSlug}] Error triggering discovery:`, discoverError)
    }

    // Success! Redirect to server detail page with connected status
    return NextResponse.redirect(new URL(`/tools/${serverSlug}?connected=true`, url.origin))
  } catch (error: unknown) {
    console.error("Error in Google OAuth callback:", error)
    const url = new URL(request.url)
    return NextResponse.redirect(new URL("/tools?error=unexpected", url.origin))
  }
}
