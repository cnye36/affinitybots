import { Metadata } from "next";
import { AgentChat } from "@/components/agents/chat/AgentChat";

export const metadata: Metadata = {
  title: "Agent Chat",
  description: "Chat with your AI agent",
};

interface AgentPageProps {
  params: {
    id: string;
  };
}

export default function AgentPage({ params }: AgentPageProps) {
  return (
    <div className="flex h-screen bg-background">
      <AgentChat assistantId={params.id} />
    </div>
  );
}
