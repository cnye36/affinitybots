"use client";

import { useEffect, useState } from "react";
import { AgentHeader } from "@/components/agents/AgentHeader";
import { AgentCard } from "@/components/agents/AgentCard";
import { EmptyAgents } from "@/components/agents/EmptyAgents";
import { AgentCardSkeletonGrid } from "@/components/agents/AgentCardSkeleton";

interface Agent {
  id: string;
  name: string;
  description?: string;
  model_type?: string;
  tools?: { name: string }[];
  avatar?: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAgents() {
      try {
        const response = await fetch("/api/assistants");
        if (!response.ok) throw new Error("Failed to load agents");
        const data = await response.json();
        setAgents(data.agents || []);
      } catch (error) {
        console.error("Error loading agents:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load agents"
        );
        setAgents([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadAgents();
  }, []);

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <AgentHeader />
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (isLoading || !agents) {
    return (
      <div className="container mx-auto px-4 py-8">
        <AgentHeader />
        <AgentCardSkeletonGrid />
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
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}
