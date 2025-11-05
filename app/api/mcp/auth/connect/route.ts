import { NextRequest, NextResponse } from "next/server";
import { mcpWebInterface } from "@/lib/mcp/mcpWebInterface";
import { createClient } from "@/supabase/server";

interface ConnectRequestBody {
  serverUrl: string;
  callbackUrl: string;
  serverName?: string; // qualified_name if known
}

export async function POST(request: NextRequest) {
  try {
    const body: ConnectRequestBody = await request.json();
    const { serverUrl, callbackUrl, serverName } = body;

    console.log("Connect request received:", {
      serverUrl,
      callbackUrl,
      serverName,
      hasServerName: !!serverName
    });

    if (!serverUrl || !callbackUrl) {
      console.error("Missing required parameters:", { serverUrl: !!serverUrl, callbackUrl: !!callbackUrl });
      return NextResponse.json(
        { error: "Server URL and callback URL are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("Unauthorized connect attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`Initiating connection to ${serverName || serverUrl} for user ${user.id}`);

    const result = await mcpWebInterface.connectServer({
      serverUrl,
      callbackUrl,
      userId: user.id,
      serverName,
    });

    console.log("Connect result:", {
      success: result.success,
      requiresAuth: result.requiresAuth,
      hasAuthUrl: !!result.authUrl,
      hasSessionId: !!result.sessionId
    });

    return NextResponse.json(result, { status: result.success ? 200 : (result.requiresAuth ? 401 : 500) });
  } catch (error: unknown) {
    console.error("Connect error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}