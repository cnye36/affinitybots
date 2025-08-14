"use client";

import { useMemo } from "react";
import { AgentHeader } from "@/components/agents/AgentHeader";
import { AgentCard } from "@/components/agents/AgentCard";
import { EmptyAgents } from "@/components/agents/EmptyAgents";
import { Assistant } from "@/types/assistant";
import { useAgents } from "@/hooks/useAgents";

export default function AgentsPage() {
  const { assistants, isLoading } = useAgents();

  const agents: Assistant[] = useMemo(() => {
    if (!assistants) return [] as Assistant[];
    return assistants as unknown as Assistant[];
  }, [assistants]);

  const handleAgentDelete = () => {
    // List revalidation is handled by SWR mutate in delete callers
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <AgentHeader />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <AgentHeader />

      {agents.length === 0 ? (
        <EmptyAgents />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
  );
}
