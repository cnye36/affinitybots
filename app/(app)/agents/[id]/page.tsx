import { AgentChatContainer } from "@/components/agents/AgentChatContainer";

interface AgentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AgentPage(props: AgentPageProps) {
  const params = await props.params;
  return <AgentChatContainer agentId={params.id} />;
}
