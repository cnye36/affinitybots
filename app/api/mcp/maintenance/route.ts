import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { performMaintenance } from "@/lib/mcp";
import { AssistantConfiguration } from "@/types/assistant";

function defaultConfig(): AssistantConfiguration {
  return {
    assistant_id: "diag",
    model: "gpt-5-2025-08-07",
    tools: [],
    memory: { enabled: false },
    prompt_template: "",
    knowledge_base: { isEnabled: false, config: { sources: [] } },
    enabled_mcp_servers: [],
    force_mcp_refresh: true,
    mcp_oauth_sessions: [],
    model_config: {},
  } as any;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const agentConfig: AssistantConfiguration = body?.agentConfig || defaultConfig();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resp = await performMaintenance(user.id, agentConfig);
    return NextResponse.json({ success: true, ...resp });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}



