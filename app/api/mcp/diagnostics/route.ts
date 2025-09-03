import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { mcpWebInterface } from "@/lib/mcp/mcpWebInterface";
import { AssistantConfiguration } from "@/types/assistant";

function defaultConfig(): AssistantConfiguration {
  return {
    assistant_id: "diag",
    model: "gpt-5",
    tools: [],
    memory: { enabled: false },
    prompt_template: "",
    knowledge_base: { isEnabled: false, config: { sources: [] } },
    enabled_mcp_servers: [],
    force_mcp_refresh: false,
    mcp_oauth_sessions: [],
    model_config: {},
  } as any;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resp = await mcpWebInterface.runDiagnostics({
      userId: user.id,
      agentConfig: defaultConfig(),
      includeAutoFix: false,
    });
    return NextResponse.json(resp, { status: resp.success ? 200 : 500 });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const includeAutoFix = Boolean(body?.includeAutoFix);
    const agentConfig: AssistantConfiguration = body?.agentConfig || defaultConfig();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resp = await mcpWebInterface.runDiagnostics({
      userId: user.id,
      agentConfig,
      includeAutoFix,
    });
    return NextResponse.json(resp, { status: resp.success ? 200 : 500 });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}



