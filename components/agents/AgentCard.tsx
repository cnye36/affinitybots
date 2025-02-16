"use client";

import { useRouter } from "next/navigation";

interface AgentCardProps {
  assistant: {
    assistant_id: string;
    name: string;
    description?: string;
    avatar_url?: string;
    model_type?: string;
    tools?: { name: string }[];
    config?: {
      configurable: {
        avatar?: string;
      };
    };
  };
}

export function AgentCard({ assistant }: AgentCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (!assistant.assistant_id || assistant.assistant_id === "undefined") {
      console.error("Invalid assistant ID");
      return;
    }

    // Ensure the ID is properly formatted before navigation
    const assistantId = encodeURIComponent(assistant.assistant_id.trim());
    router.push(`/assistants/${assistantId}`);
  };

  // Get the avatar URL from either the root level or the config
  const avatarUrl =
    assistant.avatar_url || assistant.config?.configurable?.avatar || "";

  return (
    <div
      className="border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-start space-x-4">
        <div
          className="h-12 w-12 rounded-full ring-2 ring-background flex items-center justify-center text-sm font-medium text-white"
          style={{
            backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundColor: !avatarUrl
              ? `hsl(${(assistant.name.length * 30) % 360}, 70%, 50%)`
              : undefined,
          }}
        >
          {!avatarUrl && assistant.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{assistant.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {assistant.description || "No description provided"}
          </p>
        </div>
      </div>
      <div className="flex items-center text-sm text-muted-foreground mt-4">
        <span className="flex items-center">
          Model: {assistant.model_type || "Not specified"}
        </span>
        <span className="mx-2">•</span>
        <span>{assistant.tools?.length || 0} tools</span>
      </div>
    </div>
  );
}
