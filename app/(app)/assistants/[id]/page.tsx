import { createClient } from "@/supabase/server";
import ChatContainer from "@/components/chat/ChatContainer";
import { AgentPageHeader } from "@/components/agents/AgentPageHeader";
import { redirect } from "next/navigation";

interface AssistantPageProps {
  params: {
    id: string;
  };
}

export default async function AssistantPage(props: AssistantPageProps) {
  const params = props.params;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Error fetching user:", userError);
  }
  console.log("I am working here", user);
  if (!user) {
    redirect("/signin");
  }

  // Fetch assistant data directly via Supabase
  const { data: assistantData, error: assistantError } = await supabase
    .from("assistant")
    .select("*")
    .eq("assistant_id", params.id)
    .single();

  if (assistantError) {
    console.error("Error fetching assistant:", assistantError);
    throw new Error("Failed to load assistant data");
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


