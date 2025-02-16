"use client";

import { useEffect, useState } from "react";
import { AgentHeader } from "@/components/agents/AgentHeader";
import { AgentCard } from "@/components/agents/AgentCard";
import { EmptyAgents } from "@/components/agents/EmptyAgents";
import { AgentCardSkeletonGrid } from "@/components/agents/AgentCardSkeleton";

interface Assistant {
  assistant_id: string;
  name: string;
  graph_id: string;
  metadata: {
    owner_id: string;
    description: string;
    agent_type: string;
  };
  config: {
    configurable: {
      model?: string;
      temperature?: number;
      instructions?: string;
      tools?: { name: string }[];
      memory?: {
        enabled: boolean;
        max_entries: number;
        relevance_threshold: number;
      };
      avatar?: string;
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
        console.log("Starting to load assistants...");
        const response = await fetch(`/api/assistants`);
        console.log("Response status:", response.status);

        if (!response.ok) {
          console.error(
            "Response not OK:",
            response.status,
            response.statusText
          );
          throw new Error("Failed to load assistants");
        }

        const responseText = await response.text();

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
        console.error("Error loading assistants:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load assistants"
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
          {agents.map((assistant) => (
            <AgentCard
              key={assistant.assistant_id}
              assistant={{
                assistant_id: assistant.assistant_id,
                name: assistant.name,
                description: assistant.metadata.description,
                model_type: assistant.config?.configurable?.model,
                tools: assistant.config?.configurable?.tools,
                config: {
                  configurable: {
                    avatar: assistant.config?.configurable?.avatar,
                  },
                },
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
