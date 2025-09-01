import { quickHealthCheck } from "@/lib/mcp";
import { AssistantConfiguration } from "@/types/assistant";

async function main() {
  const userId = process.env.TEST_USER_ID || "dev-user";

  const enabled = (process.env.MCP_ENABLED_SERVERS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const sessionsEnv = process.env.MCP_SESSIONS_JSON || "[]";
  let mcpSessions: AssistantConfiguration["mcp_oauth_sessions"] = [];
  try {
    mcpSessions = JSON.parse(sessionsEnv);
  } catch {
    // ignore malformed
  }

  const agentConfig: AssistantConfiguration = {
    assistant_id: "diag",
    model: "gpt-5-2025-08-07",
    tools: [],
    memory: { enabled: false },
    prompt_template: "",
    knowledge_base: { isEnabled: false, config: { sources: [] } },
    enabled_mcp_servers: enabled,
    force_mcp_refresh: Boolean(process.env.FORCE_MCP_REFRESH === "1"),
    mcp_oauth_sessions: mcpSessions,
    model_config: {},
  } as any;

  const result = await quickHealthCheck(userId, agentConfig);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});



