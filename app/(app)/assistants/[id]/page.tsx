import { createClient } from "@/supabase/server";
import ChatContainer from "@/components/chat/ChatContainer";
import { AgentPageHeader } from "@/components/agents/AgentPageHeader";
import { notFound } from "next/navigation";
import { Assistant } from "@/types";

interface AssistantPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AssistantPage(props: AssistantPageProps) {
  const params = await props.params;
  const supabase = await createClient();

  try {
    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return notFound();
    }

    // Fetch assistant details
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/assistants/${params.assistant_id}`
    );
    if (!response.ok) {
      return notFound();
    }

    const assistantData: Assistant = await response.json();

    return (
      <div className="flex flex-col h-screen">
        <AgentPageHeader assistant={assistantData} />
        <main className="flex-1 overflow-hidden">
          <ChatContainer assistantId={params.id} />
        </main>
      </div>
    );
  } catch (error) {
    console.error("Error fetching assistant:", error);
    return notFound();
  }
}

