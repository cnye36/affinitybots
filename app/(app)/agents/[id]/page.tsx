import { createClient } from "@/supabase/server";
import ChatContainer from "@/components/chat/ChatContainer";
import { AgentPageHeader } from "@/components/agents/AgentPageHeader";
import { redirect } from "next/navigation";

interface AgentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AgentPage(props: AgentPageProps) {
  const params = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/signin");
  }

  const { data: userAgent, error: userAgentError } = await supabase
    .from("user_agents")
    .select("agent_id")
    .eq("user_id", user.id)
    .eq("agent_id", params.id)
    .single();

  if (userAgentError || !userAgent) {
    throw new Error("Agent not found or access denied");
  }

  const { data: agent, error: agentError } = await supabase
    .from("agent")
    .select("*")
    .eq("id", params.id)
    .single();

  if (agentError || !agent) {
    throw new Error("Failed to fetch agent details");
  }

  // Ensure metadata and config match our Agent type
  const typedAgent = {
    ...agent,
    metadata: agent.metadata || {},
    config: agent.config,
    owner_id: agent.metadata?.owner_id as string,
  };

  return (
    <div className="flex flex-col h-screen">
      <AgentPageHeader agent={typedAgent} />
      <main className="flex-1 overflow-hidden relative">
        <ChatContainer agent={typedAgent} />
      </main>
    </div>
  );
}
