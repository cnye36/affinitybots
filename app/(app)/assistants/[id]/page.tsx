import { createClient } from "@/supabase/server";
import ChatContainer from "@/components/chat/ChatContainer";
import { AgentPageHeader } from "@/components/agents/AgentPageHeader";
import { redirect } from "next/navigation";

interface AssistantPageProps {
  params: {
    id: string;
  };
}

export default async function AssistantPage({ params }: AssistantPageProps) {
  const supabase = await createClient();
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/assistants/${params.id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    console.error("Response not OK:", response.status, response.statusText);
    const errorText = await response.text();
    console.error("Error response body:", errorText);
    throw new Error(
      `Failed to load assistant: ${response.status} ${response.statusText}`
    );
  }

  let assistantData;
  try {
    assistantData = await response.json();
  } catch (error) {
    console.error("Failed to parse response as JSON:", error);
    throw new Error("Invalid response format from server");
  }

  if (!assistantData) {
    throw new Error("No assistant data received");
  }

  return (
    <div className="flex flex-col h-screen">
      <AgentPageHeader assistant={assistantData} />
      <main className="flex-1 overflow-hidden">
        <ChatContainer assistantId={params.id} />
      </main>
    </div>
  );
}


