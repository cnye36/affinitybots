import { NextRequest, NextResponse } from "next/server";
import {
  buildCallbackUrl,
  exchangeCodeForTokens,
  getHubSpotClientId,
  getHubSpotClientSecret,
} from "@/lib/oauth/hubspotOAuth";
import { createClient } from "@/supabase/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  const redirectUri = buildCallbackUrl(req);
  const clientId = getHubSpotClientId();
  const clientSecret = getHubSpotClientSecret();

  try {
    const tokens = await exchangeCodeForTokens({
      code,
      redirectUri,
      clientId,
      clientSecret,
    });

    // Persist connection for the current user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hubspotMcpUrl = process.env.NEXT_PUBLIC_HUBSPOT_MCP_URL || "https://mcp.hubspot.com";
    const now = Date.now();
    const expiresAt = tokens.expires_in ? new Date(now + tokens.expires_in * 1000).toISOString() : null;

    const upsert = {
      user_id: user.id,
      server_slug: "hubspot",
      url: hubspotMcpUrl,
      // Store access token in oauth_token field (expected by mcpClientManager)
      oauth_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      expires_at: expiresAt,
      is_enabled: true,
      config: {
        scope: tokens.scope,
        provider: "hubspot",
        auth_type: "bearer", // Mark as bearer token auth
        tokenMetadata: {
          token_type: "Bearer",
          scope: tokens.scope,
          expires_at: expiresAt,
        },
      },
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    } as any;

    await supabase
      .from("user_mcp_servers")
      .upsert(upsert, { onConflict: "user_id,server_slug" });

    const redirectTo = req.nextUrl.searchParams.get("redirectTo") || "/tools/hubspot";
    return NextResponse.redirect(new URL(redirectTo, req.nextUrl.origin));
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Token exchange failed" }, { status: 500 });
  }
}


