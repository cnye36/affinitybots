import { NextRequest, NextResponse } from "next/server";
import { mcpWebInterface } from "@/lib/mcp/mcpWebInterface";
import { createClient } from "@/supabase/server";
import { sessionStore } from "@/lib/oauth/sessionStore";

// Handles browser redirect from OAuth provider.
// Expects query params: code, state
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const authCode = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    // Check for error from OAuth provider
    const error = url.searchParams.get('error');
    if (error) {
      console.error('OAuth error:', error, url.searchParams.get('error_description'));
      return NextResponse.redirect(new URL('/tools?error=oauth_denied', url.origin));
    }

    if (!authCode || !state) {
      console.error('Missing required parameters:', { authCode: !!authCode, state: !!state, url: request.url });
      return NextResponse.json({ error: 'Missing code or state parameter' }, { status: 400 });
    }

    // Validate user authentication first
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate state parameter (CSRF protection)
    const storedState = await sessionStore.getOAuthState(state);

    if (!storedState) {
      console.error('Invalid or expired OAuth state:', state);
      return NextResponse.redirect(new URL('/tools?error=oauth_invalid_state', url.origin));
    }

    // Check state expiration
    if (storedState.expiresAt < Date.now()) {
      console.error('OAuth state expired:', state);
      await sessionStore.deleteOAuthState(state);
      return NextResponse.redirect(new URL('/tools?error=oauth_state_expired', url.origin));
    }

    // Validate user ID matches (prevent session fixation attacks)
    if (storedState.userId !== user.id) {
      console.error('User ID mismatch in OAuth callback:', { expected: storedState.userId, actual: user.id });
      await sessionStore.deleteOAuthState(state);
      return NextResponse.json({ error: 'User mismatch - possible CSRF attack' }, { status: 403 });
    }

    // Delete state parameter (single-use)
    await sessionStore.deleteOAuthState(state);

    // Now safe to proceed with OAuth completion using validated sessionId
    const result = await mcpWebInterface.finishAuth(storedState.sessionId, authCode, user.id);

    // Redirect to the specific server page on success
    if (result.success) {
      const serverSlug = storedState.serverName;
      
      // Trigger capability discovery after successful OAuth connection
      if (serverSlug) {
        try {
          // Discover capabilities in the background (don't wait for it)
          fetch(`${url.origin}/api/mcp/servers/${serverSlug}/discover`, {
            method: "POST",
          }).catch((err) => {
            console.warn(`Failed to discover capabilities for ${serverSlug} after OAuth:`, err);
          });
        } catch (discoverError) {
          console.warn(`Error triggering capability discovery:`, discoverError);
        }
      }
      
      const redirectTo = serverSlug ? `/tools/${serverSlug}?connected=true` : '/tools?connected=true';
      return NextResponse.redirect(new URL(redirectTo, url.origin));
    }

    return NextResponse.redirect(new URL('/tools?error=connection_failed', url.origin));
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

