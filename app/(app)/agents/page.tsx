"use client";

import { useState, useEffect } from "react";
import { AgentHeader } from "@/components/agents/AgentHeader";
import { AgentCard } from "@/components/agents/AgentCard";
import { EmptyAgents } from "@/components/agents/EmptyAgents";
import { Assistant } from "@/types/assistant";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Assistant[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchAgents = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching agents...");
        const response = await fetch("/api/assistants", {
          signal: abortController.signal,
        });
        
        console.log("Response received:", response.status);
        
        if (!response.ok) {
          throw new Error("Failed to fetch agents");
        }
        
        const data = await response.json();
        console.log("Agents data:", data);
        setAgents(data.assistants || []);
      } catch (error) {
        // Only log error if it's not an abort error
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error("Error fetching agents:", error);
        }
        setAgents([]); // Set empty array on error to show empty state
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgents();

    // Cleanup function to abort the request if component unmounts
    return () => {
      console.log("Aborting fetch request");
      abortController.abort();
    };
  }, []);

  const handleAgentDelete = (deletedAgentId: string) => {
    if (agents) {
      setAgents(agents.filter((agent) => agent.assistant_id !== deletedAgentId));
    }
  };

  if (isLoading || !agents) {
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
