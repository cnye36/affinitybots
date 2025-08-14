import { NextRequest, NextResponse } from "next/server";
import { mcpClientFactory } from "@/lib/mcp/mcpClientFactory";

interface DiscoverRequestBody {
  serverUrl: string;
  callbackUrl: string;
}

// Attempts to determine required auth for a server by trying an OAuth-capable connection.
// Returns { authType: 'oauth' | 'none' | 'unknown', requiresAuth, authUrl?, sessionId? }
export async function POST(request: NextRequest) {
  try {
    const body: DiscoverRequestBody = await request.json();
    const { serverUrl, callbackUrl } = body;

    if (!serverUrl || !callbackUrl) {
      return NextResponse.json({ error: 'serverUrl and callbackUrl are required' }, { status: 400 });
    }

    try {
      const result = await mcpClientFactory.initiateOAuth(serverUrl, callbackUrl);
      if (result.requiresAuth && result.authUrl) {
        return NextResponse.json({ authType: 'oauth', requiresAuth: true, authUrl: result.authUrl, sessionId: result.sessionId });
      }
      // Connected without OAuth
      return NextResponse.json({ authType: 'none', requiresAuth: false, sessionId: result.sessionId });
    } catch (e) {
      // Unknown/unsupported detection case
      return NextResponse.json({ authType: 'unknown', requiresAuth: false }, { status: 200 });
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}


