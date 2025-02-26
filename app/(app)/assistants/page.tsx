"use client";

import { useState, useEffect } from "react";
import { AgentHeader } from "@/components/agents/AgentHeader";
import { AgentCard } from "@/components/agents/AgentCard";
import { EmptyAgents } from "@/components/agents/EmptyAgents";
import { Assistant } from "@/types/langgraph";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Assistant[] | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch("/api/assistants");
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
      setAgents(
        agents.filter((agent) => agent.assistant_id !== deletedAgentId)
      );
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
          {agents.map((assistant) => (
            <AgentCard
              key={assistant.assistant_id}
              assistant={{
                assistant_id: assistant.assistant_id,
                name: assistant.name,
                description: assistant.metadata.description,
                model_type: assistant.config?.configurable?.model,
                tools: Object.entries(
                  assistant.config?.configurable?.tools || {}
                ).map(([name]) => ({ name })),
                config: {
                  configurable: {
                    avatar: assistant.config?.configurable?.avatar,
                  },
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
