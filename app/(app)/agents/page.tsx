"use client";

import { useState, useEffect } from "react";
import { AgentHeader } from "@/components/agents/AgentHeader";
import { AgentCard } from "@/components/agents/AgentCard";
import { EmptyAgents } from "@/components/agents/EmptyAgents";
import { Agent } from "@/types/agent";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[] | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch("/api/agents");
        if (!response.ok) {
          throw new Error("Failed to fetch agents");
        }
        const data = await response.json();
        setAgents(data);
      } catch (error) {
        console.error("Error fetching agents:", error);
        setAgents([]); // Set empty array on error to show empty state
      }
    };

    fetchAgents();
  }, []);

  const handleAgentDelete = (deletedAgentId: string) => {
    if (agents) {
      setAgents(agents.filter((agent) => agent.id !== deletedAgentId));
    }
  };

  if (!agents) {
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
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={{
                id: agent.id,
                name: agent.name,
                agent_avatar: agent.agent_avatar,
                description: agent.description,
                config: {
                  model: agent.config?.model,
                  temperature: agent.config?.temperature,
                  tools: agent.config?.tools,
                  memory: agent.config?.memory,
                  knowledge_base: agent.config?.knowledge_base,
                },
              }}
              onDelete={handleAgentDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
