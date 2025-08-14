import { NextRequest, NextResponse } from "next/server";
import { mcpWebInterface } from "@/lib/mcp/mcpWebInterface";
import { createClient } from "@/supabase/server";

interface FinishAuthRequestBody {
  authCode: string;
  sessionId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: FinishAuthRequestBody = await request.json();
    const { authCode, sessionId } = body;

    if (!authCode || !sessionId) {
      return NextResponse.json(
        { error: "Authorization code and session ID are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await mcpWebInterface.finishAuth(sessionId, authCode, user.id);
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}