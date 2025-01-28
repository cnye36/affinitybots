import { getAgentById } from "@/lib/api";
import { ChatInterface } from "@/components/agents/chat/ChatInterface";

export default async function ChatPage({ params }: { params: { id: string } }) {
  const agent = await getAgentById(params.id);

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Agent not found</h1>
          <p className="mt-2 text-gray-600">
            The agent you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have access to it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
        {agent.description && (
          <p className="mt-1 text-gray-600">{agent.description}</p>
        )}
      </div>
      <div className="flex-1">
        <ChatInterface messages={[]} onSendMessage={() => {}} />
      </div>
    </div>
  );
}
