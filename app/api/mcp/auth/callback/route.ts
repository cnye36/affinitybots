import { NextRequest, NextResponse } from "next/server";
import { mcpWebInterface } from "@/lib/mcp/mcpWebInterface";
import { createClient } from "@/supabase/server";

// Handles browser redirect from OAuth provider.
// Expects query params: code, state (optional), sessionId
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const authCode = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    console.log('OAuth callback received:', {
      hasCode: !!authCode,
      hasState: !!state,
      url: request.url
    });

    // Check for error from OAuth provider
    const error = url.searchParams.get('error');
    if (error) {
      const errorDescription = url.searchParams.get('error_description');
      console.error('OAuth provider error:', { error, errorDescription });
      const errorParam = encodeURIComponent(errorDescription || error);
      return NextResponse.redirect(new URL(`/tools?error=${errorParam}`, url.origin));
    }

    // sessionId can come from either 'sessionId' param or 'state' param
    let sessionId = url.searchParams.get('sessionId') || url.searchParams.get('state');

    if (!authCode || !sessionId) {
      console.error('Missing required parameters:', {
        authCode: !!authCode,
        sessionId: !!sessionId,
        allParams: Object.fromEntries(url.searchParams.entries())
      });
      return NextResponse.redirect(
        new URL('/tools?error=Missing authorization code or session ID', url.origin)
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found in callback');
      return NextResponse.redirect(
        new URL('/tools?error=Not authenticated. Please log in and try again.', url.origin)
      );
    }

    console.log(`Processing OAuth callback for session ${sessionId} and user ${user.id}`);

    const result = await mcpWebInterface.finishAuth(sessionId, authCode, user.id);

    // Redirect back to a UI page
    if (result.success) {
      const redirectTo = url.searchParams.get('redirectTo') || '/tools';
      console.log(`OAuth completed successfully, redirecting to ${redirectTo}`);
      return NextResponse.redirect(new URL(`${redirectTo}?success=connected`, url.origin));
    }

    console.error('OAuth finish failed:', result.error);
    const errorParam = encodeURIComponent(result.error || 'Failed to complete OAuth');
    return NextResponse.redirect(new URL(`/tools?error=${errorParam}`, url.origin));
  } catch (error: unknown) {
    console.error('OAuth callback error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorParam = encodeURIComponent(errorMessage);

    // Try to redirect to tools page with error, or return JSON if redirect fails
    try {
      const url = new URL(request.url);
      return NextResponse.redirect(new URL(`/tools?error=${errorParam}`, url.origin));
    } catch {
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  }
}

