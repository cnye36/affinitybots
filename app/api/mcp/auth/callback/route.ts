import { NextRequest, NextResponse } from "next/server";
import { mcpWebInterface } from "@/lib/mcp/mcpWebInterface";
import { createClient } from "@/supabase/server";

// Handles browser redirect from OAuth provider.
// Expects query params: code, state (optional), sessionId
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const authCode = url.searchParams.get('code');
    const sessionId = url.searchParams.get('sessionId');

    if (!authCode || !sessionId) {
      return NextResponse.json({ error: 'Missing code or sessionId' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await mcpWebInterface.finishAuth(sessionId, authCode, user.id);

    // Optionally redirect back to a UI page
    if (result.success) {
      const redirectTo = url.searchParams.get('redirectTo') || '/tools';
      return NextResponse.redirect(new URL(redirectTo, url.origin));
    }

    return NextResponse.json(result, { status: 500 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

