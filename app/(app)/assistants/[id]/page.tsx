import { createClient } from "@/supabase/server";
import ChatContainer from "@/components/chat/ChatContainer";
import { AgentPageHeader } from "@/components/agents/AgentPageHeader";
import { notFound } from "next/navigation";

interface AssistantPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AssistantPage(props: AssistantPageProps) {
  const params = await props.params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return notFound();
  }

  // Fetch assistant details
  try {
    const response = await fetch(
      `${process.env.LANGGRAPH_URL}/assistants/${params.id}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return notFound();
    }

    const assistant = await response.json();

    return (
      <div className="flex flex-col h-screen">
        <AgentPageHeader assistant={assistant} />
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
