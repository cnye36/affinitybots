"use client";

import { useEffect, useState } from "react";
import { AgentHeader } from "@/components/agents/AgentHeader";
import { AgentCard } from "@/components/agents/AgentCard";
import { EmptyAgents } from "@/components/agents/EmptyAgents";
import { AgentCardSkeletonGrid } from "@/components/agents/AgentCardSkeleton";

interface Assistant {
  id: string;
  name: string;
  graph_id: string;
  config: {
    configurable: {
      model?: string;
      temperature?: number;
      instructions?: string;
      tools?: { name: string }[];
    };
    metadata: {
      description?: string;
      owner_id: string;
    };
  };
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Assistant[] | null>(null);
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAgents() {
      try {
        console.log("Starting to load agents...");
        const response = await fetch("/api/assistants");
        console.log("Response status:", response.status);

        if (!response.ok) {
          console.error(
            "Response not OK:",
            response.status,
            response.statusText
          );
          throw new Error("Failed to load agents");
        }

        const responseText = await response.text();
        console.log("Raw response:", responseText);

        let assistants;
        try {
          assistants = JSON.parse(responseText);
          console.log("Parsed assistants:", assistants);
        } catch (parseError) {
          console.error("Failed to parse response:", parseError);
          throw new Error("Invalid response format");
        }

        setAgents(Array.isArray(assistants) ? assistants : []);
        console.log(
          "Agents set to state:",
          Array.isArray(assistants) ? assistants : []
        );
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
            <AgentCard
              key={agent.id}
              agent={{
                id: agent.id,
                name: agent.name,
                description: agent.config.metadata.description,
                model_type: agent.config.configurable.model,
                tools: agent.config.configurable.tools,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
