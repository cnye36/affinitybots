"use client";

import { useMemo, useState, useEffect } from "react";
import { AgentHeader } from "@/components/agents/AgentHeader";
import { AgentCard } from "@/components/agents/AgentCard";
import { AgentListItem } from "@/components/agents/AgentListItem";
import { EmptyAgents } from "@/components/agents/EmptyAgents";
import { Assistant } from "@/types/assistant";
import { useAgents } from "@/hooks/useAgents";
import { TutorialLayout } from "@/components/tutorial/TutorialLayout";
import { agentsTutorial } from "@/lib/tutorials";
import { createClient } from "@/supabase/client";
import { useViewPreference } from "@/hooks/useViewPreference";

export default function AgentsPage() {
  const { assistants, isLoading } = useAgents();
  const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null);
  const { viewMode, setViewMode } = useViewPreference("agents", "grid");
  const supabase = createClient();

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserCreatedAt(user.created_at);
      }
    }
    fetchUser();
  }, [supabase]);

  const agents: Assistant[] = useMemo(() => {
    if (!assistants) return [] as Assistant[];
    return assistants as unknown as Assistant[];
  }, [assistants]);

  const handleAgentDelete = () => {
    // List revalidation is handled by SWR mutate in delete callers
  };

  if (isLoading) {
    return (
      <TutorialLayout tutorials={[agentsTutorial]} userCreatedAt={userCreatedAt}>
        <div className="container mx-auto px-4 py-8">
          <AgentHeader />
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </TutorialLayout>
    );
  }

  return (
    <TutorialLayout tutorials={[agentsTutorial]} userCreatedAt={userCreatedAt}>
      <div className="container mx-auto px-4 py-8">
        <AgentHeader
          showViewToggle={agents.length > 0}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {agents.length === 0 ? (
          <EmptyAgents />
        ) : viewMode === "list" ? (
          <div className="space-y-3" data-tutorial="agents-grid">
            {agents.map((assistant) => (
              <AgentListItem
                key={assistant.assistant_id}
                assistant={assistant}
                onDelete={handleAgentDelete}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-tutorial="agents-grid">
            {agents.map((assistant) => (
              <AgentCard
                key={assistant.assistant_id}
                assistant={assistant}
                onDelete={handleAgentDelete}
              />
            ))}
          </div>
        )}
      </div>
    </TutorialLayout>
  );
}
