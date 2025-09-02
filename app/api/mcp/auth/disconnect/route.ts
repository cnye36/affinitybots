import { NextRequest, NextResponse } from "next/server";
import { mcpWebInterface } from "@/lib/mcp/mcpWebInterface";
import { createClient } from "@/supabase/server";

interface DisconnectRequestBody {
  sessionId?: string;
  serverName?: string; // optional alternative: disconnect by qualified name
}

export async function POST(request: NextRequest) {
  try {
    const body: DisconnectRequestBody = await request.json();
    const { sessionId, serverName } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!sessionId && !serverName) {
      return NextResponse.json({ error: "sessionId or serverName is required" }, { status: 400 });
    }

    const result = sessionId
      ? await mcpWebInterface.disconnectServer(sessionId, user.id)
      : await mcpWebInterface.disconnectServerByName(serverName!, user.id);
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}