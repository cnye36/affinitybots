"use client";

import { useRouter } from "next/navigation";

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    description?: string;
    model_type?: string;
    tools?: { name: string }[];
  };
}

export function AgentCard({ agent }: AgentCardProps) {
  const router = useRouter();

  return (
    <div
      key={agent.id}
      className="border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer"
      onClick={() => router.push(`/agents/${agent.id}`)}
    >
      <div className="flex items-start space-x-4">
        <div
          className="h-12 w-12 rounded-full ring-2 ring-background flex items-center justify-center text-sm font-medium text-white"
          style={{
            backgroundColor: `hsl(${(agent.name.length * 30) % 360}, 70%, 50%)`,
          }}
        >
          {agent.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{agent.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {agent.description || "No description provided"}
          </p>
        </div>
      </div>
      <div className="flex items-center text-sm text-muted-foreground mt-4">
        <span className="flex items-center">
          Model: {agent.model_type || "Not specified"}
        </span>
        <span className="mx-2">•</span>
        <span>{agent.tools?.length || 0} tools</span>
      </div>
    </div>
  );
}
