import { createClient } from "@/supabase/server";
import ChatContainer from "@/components/chat/ChatContainer";
import { AgentPageHeader } from "@/components/agents/AgentPageHeader";
import { redirect } from "next/navigation";

// Helper function to create a timeout promise
function createTimeoutPromise(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });
}

interface AgentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AgentPage(props: AgentPageProps) {
  try {
    // Add timeout protection for the entire request
    const result = await Promise.race([
      (async () => {
        const params = await props.params;
        const supabase = await createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          redirect("/auth/signin");
        }

        // Check if user has access to this assistant
        let assistant = null;
        
        // First try user_assistants table
        const { data: userAssistant, error: userAssistantError } = await supabase
          .from("user_assistants")
          .select("assistant_id")
          .eq("user_id", user.id)
          .eq("assistant_id", params.id)
          .single();

        if (!userAssistantError && userAssistant) {
          // User has access via user_assistants, fetch the assistant
          const { data: assistantData, error: assistantError } = await supabase
            .from("assistant")
            .select("*")
            .eq("assistant_id", params.id)
            .single();

          if (assistantError || !assistantData) {
            throw new Error("Failed to fetch agent details");
          }
          assistant = assistantData;
        } else {
          // Fallback: check if assistant exists and user is owner
          const { data: assistantData, error: assistantError } = await supabase
            .from("assistant")
            .select("*")
            .eq("assistant_id", params.id)
            .eq("metadata->>owner_id", user.id)
            .single();

          if (assistantError || !assistantData) {
            throw new Error("Agent not found or access denied");
          }
          assistant = assistantData;
        }

        if (!assistant) {
          throw new Error("Failed to fetch agent details");
        }

        // Ensure metadata and config match our Assistant type
        const typedAssistant = {
          ...assistant,
          metadata: assistant.metadata || {},
          config: assistant.config,
          userId: assistant.metadata?.user_id as string,
        };

        return (
          <div className="flex flex-col h-screen">
            <AgentPageHeader assistant={typedAssistant} />
            <main className="flex-1 overflow-hidden relative">
              <ChatContainer assistant={typedAssistant} />
            </main>
          </div>
        );
      })(),
      createTimeoutPromise(30000) // 30 second timeout
    ]);

    return result;
  } catch (error) {
    console.error("Error in AgentPage:", error);
    
    // Check if it's a timeout error
    if (error instanceof Error && error.message.includes('timed out')) {
      throw new Error("Request timed out. Please try again.");
    }
    
    // Re-throw the error to be handled by Next.js error boundary
    throw error;
  }
}
