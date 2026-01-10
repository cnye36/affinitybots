import { NextRequest, NextResponse } from "next/server";
import { mcpClientFactory } from "@/lib/mcp/mcpClientFactory";
import { discoverServerCapabilities } from "@/lib/mcp/mcpDiscovery";

interface DiscoverRequestBody {
  serverUrl: string;
  callbackUrl: string;
  apiKey?: string;
  bearerToken?: string;
  apiKeyHeaderName?: string;
}

// Attempts to determine required auth for a server by trying different auth methods.
// Returns { authType: 'oauth' | 'api_key' | 'bearer' | 'none' | 'unknown', requiresAuth, authUrl?, sessionId? }
export async function POST(request: NextRequest) {
  try {
    const body: DiscoverRequestBody = await request.json();
    const { serverUrl, callbackUrl, apiKey, bearerToken, apiKeyHeaderName } = body;

    if (!serverUrl || !callbackUrl) {
      return NextResponse.json({ error: 'serverUrl and callbackUrl are required' }, { status: 400 });
    }

    // First, try without any auth to see if the server accepts unauthenticated requests
    try {
      const capabilities = await discoverServerCapabilities(serverUrl, 'discovery', {});
      if (capabilities.tools.length > 0 || capabilities.resources.length > 0 || capabilities.prompts.length > 0) {
        return NextResponse.json({ authType: 'none', requiresAuth: false });
      }
    } catch (e) {
      // Server requires auth, continue to try different methods
    }

    // If API key or bearer token provided, try those first
    if (apiKey || bearerToken) {
      try {
        const capabilities = await discoverServerCapabilities(
          serverUrl,
          'discovery',
          {
            apiKey: apiKey || undefined,
            bearerToken: bearerToken || undefined,
            apiKeyHeaderName: apiKeyHeaderName || undefined,
          }
        );
        if (capabilities.tools.length > 0 || capabilities.resources.length > 0 || capabilities.prompts.length > 0) {
          return NextResponse.json({
            authType: bearerToken ? 'bearer' : 'api_key',
            requiresAuth: true,
            detected: true,
          });
        }
      } catch (e) {
        // Auth failed, continue to try OAuth
      }
    }

    // Try OAuth detection
    try {
      const result = await mcpClientFactory.initiateOAuth(serverUrl, callbackUrl);
      if (result.requiresAuth && result.authUrl) {
        return NextResponse.json({ authType: 'oauth', requiresAuth: true, authUrl: result.authUrl, sessionId: result.sessionId });
      }
      // Connected without OAuth (but might still need auth for actual operations)
      return NextResponse.json({ authType: 'none', requiresAuth: false, sessionId: result.sessionId });
    } catch (e) {
      // OAuth not available or failed
    }

    // If we have credentials provided but they didn't work, return error
    if (apiKey || bearerToken) {
      return NextResponse.json({
        authType: bearerToken ? 'bearer' : 'api_key',
        requiresAuth: true,
        detected: false,
        error: 'Provided credentials did not work. Please verify your API key or bearer token.',
      }, { status: 200 });
    }

    // Unknown/unsupported - could be OAuth, API key, or bearer token
    return NextResponse.json({ authType: 'unknown', requiresAuth: true, detected: false }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}


