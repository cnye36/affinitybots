import { NextRequest, NextResponse } from "next/server";
import { mcpWebInterface } from "@/lib/mcp/mcpWebInterface";
import { createClient } from "@/supabase/server";
import { findOfficialServer } from "@/lib/mcp/officialMcpServers";
import { sessionStore } from "@/lib/oauth/sessionStore";

interface ConnectRequestBody {
  serverUrl: string;
  callbackUrl: string;
  serverName?: string; // server_slug if known
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const serverSlug = url.searchParams.get("server");

    if (!serverSlug) {
      return NextResponse.json(
        { error: "Server parameter is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL("/auth/login?redirectTo=/tools", url.origin));
    }

    const officialServer = findOfficialServer(serverSlug);
    if (!officialServer) {
      return NextResponse.json(
        { error: "Server not found" },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || url.origin;
    const callbackUrl = `${baseUrl}/api/mcp/auth/callback`;

    const result = await mcpWebInterface.connectServer({
      serverUrl: officialServer.url,
      callbackUrl,
      userId: user.id,
      serverName: officialServer.serverName,
    });

    if (result.requiresAuth && result.authUrl && result.sessionId) {
      // Generate CSRF state parameter
      const state = sessionStore.generateSessionId();
      await sessionStore.setOAuthState(state, {
        sessionId: result.sessionId,
        userId: user.id,
        serverName: officialServer.serverName,
        serverUrl: officialServer.url,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      });

      // Redirect to OAuth authorization URL with state parameter
      const authUrl = new URL(result.authUrl);
      authUrl.searchParams.set("state", state);

      return NextResponse.redirect(authUrl.toString());
    } else if (result.success) {
      // Direct connection succeeded (no OAuth required)
      return NextResponse.redirect(new URL(`/tools/${serverSlug}?connected=true`, url.origin));
    } else {
      // Connection failed
      return NextResponse.redirect(new URL(`/tools/${serverSlug}?error=${encodeURIComponent(result.error || "Connection failed")}`, url.origin));
    }
  } catch (error: unknown) {
    console.error("OAuth connect error:", error);
    const url = new URL(request.url);
    if (error instanceof Error) {
      return NextResponse.redirect(new URL(`/tools?error=${encodeURIComponent(error.message)}`, url.origin));
    }
    return NextResponse.redirect(new URL(`/tools?error=connection_failed`, url.origin));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ConnectRequestBody = await request.json();
    const { serverUrl, callbackUrl, serverName } = body;

    if (!serverUrl || !callbackUrl) {
      return NextResponse.json(
        { error: "Server URL and callback URL are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await mcpWebInterface.connectServer({
      serverUrl,
      callbackUrl,
      userId: user.id,
      serverName,
    });

    return NextResponse.json(result, { status: result.success ? 200 : (result.requiresAuth ? 401 : 500) });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}