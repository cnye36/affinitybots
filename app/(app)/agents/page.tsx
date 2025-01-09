"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Agent {
  id: string;
  name: string;
  description?: string;
  model_type?: string;
  tools?: { name: string }[];
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadAgents() {
      try {
        const response = await fetch("/api/agents");
        if (!response.ok) throw new Error("Failed to load agents");
        const data = await response.json();
        setAgents(data.agents);
      } catch (error) {
        console.error("Error loading agents:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load agents"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadAgents();
  }, []);

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-4">My Agents</h1>
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">Loading your agents...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Agents</h1>
        <Link href="/agents/new">
          <Button>
            <PlusCircle className="mr-2" />
            Create Agent
          </Button>
        </Link>
      </div>

      {agents.length === 0 ? (
        <div className="text-center py-16 px-4">
          <h2 className="text-3xl font-bold mb-4">Welcome to AgentHub</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create your first AI agent to get started. AI agents can help you
            with tasks, answer questions, and assist with your work.
          </p>
          <Link href="/agents/new">
            <Button size="lg">
              <PlusCircle className="mr-2" />
              Create Your First Agent
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer"
              onClick={() => router.push(`/agents/${agent.id}`)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {agent.description || "No description provided"}
                  </p>
                </div>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <span className="flex items-center">
                  Model: {agent.model_type}
                </span>
                <span className="mx-2">•</span>
                <span>{agent.tools?.length || 0} tools</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
