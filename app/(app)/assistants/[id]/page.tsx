import { createClient } from "@/supabase/server";
import ChatContainer from "@/components/chat/ChatContainer";
import { AgentPageHeader } from "@/components/agents/AgentPageHeader";
import { redirect } from "next/navigation";
import { getLangGraphClient } from "@/lib/langchain/client";

interface AssistantPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AssistantPage(props: AssistantPageProps) {
  const params = await props.params;
  const supabase = await createClient();
  const client = getLangGraphClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Error fetching user:", userError);
  }

  if (!user) {
    redirect("/signin");
  }

  // Fetch assistant data directly using LangGraph client
  const assistant = await client.assistants.get(params.id);

  if (!assistant || assistant.metadata?.owner_id !== user.id) {
    throw new Error("Assistant not found or access denied");
  }

  // Ensure metadata and config match our Assistant type
  const typedAssistant = {
    ...assistant,
    metadata: assistant.metadata || {},
    config: {
      configurable: {
        ...assistant.config?.configurable,
        owner_id: assistant.metadata?.owner_id as string,
      },
    },
  };

  return (
    <div className="flex flex-col h-screen">
      <AgentPageHeader assistant={typedAssistant} />
      <main className="flex-1 overflow-hidden">
        <ChatContainer assistantId={params.id} />
      </main>
    </div>
  );
}


