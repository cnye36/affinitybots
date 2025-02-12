import { createClient } from "@/supabase/server";
import ChatContainer from "@/components/chat/ChatContainer";
import { AgentPageHeader } from "@/components/agents/AgentPageHeader";
import { redirect } from "next/navigation";

interface AssistantPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AssistantPage(props: AssistantPageProps) {
  const params = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/signin");
  }

  
  const { data: userAssistant, error: userAssistantError } = await supabase
    .from('user_assistants')
    .select('assistant_id')
    .eq('user_id', user.id)
    .eq('assistant_id', params.id)
    .single();

  if (userAssistantError || !userAssistant) {
    throw new Error("Assistant not found or access denied");
  }

  const { data: assistant, error: assistantError } = await supabase
    .from('assistant')
    .select('*')
    .eq('assistant_id', params.id)
    .single();

  if (assistantError || !assistant) {
    throw new Error("Failed to fetch assistant details");
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


