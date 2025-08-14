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