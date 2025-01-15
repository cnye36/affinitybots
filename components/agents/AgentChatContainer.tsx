"use client";

import { useState } from "react";
import { AgentChat } from "./AgentChat";
import { ChatThreads } from "./ChatThreads";
import { Button } from "@/components/ui/button";
import { Settings, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAgent } from "@/hooks/useAgent";
import { AgentConfigModal } from "@/components/configuration/AgentConfigModal";
import { Avatar } from "@/components/ui/avatar";
import { AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";

interface AgentChatContainerProps {
  agentId: string;
}

export function AgentChatContainer({ agentId }: AgentChatContainerProps) {
  const [currentThreadId, setCurrentThreadId] = useState<string>();
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const { agent, isLoading, mutate } = useAgent(agentId);

  const handleNewThread = () => {
    setCurrentThreadId(undefined);
  };

  if (isLoading) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <Link href="/agents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Avatar className="h-8 w-8">
            <AvatarImage src={agent?.image_url} alt={agent?.name} />
            <AvatarFallback>{agent?.name?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <h1 className="text-xl font-semibold">{agent?.name}</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsConfigModalOpen(true)}
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          Configure
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r border-border bg-muted/10">
          <ChatThreads
            agentId={agentId}
            currentThreadId={currentThreadId}
            onThreadSelect={setCurrentThreadId}
            onNewThread={handleNewThread}
          />
        </div>
        <div className="flex-1">
          <AgentChat
            agentId={agentId}
            currentThreadId={currentThreadId}
            onThreadCreated={setCurrentThreadId}
            onThreadUpdated={() => {
              // Trigger thread list refresh
              const event = new Event("threadUpdated");
              window.dispatchEvent(event);
            }}
          />
        </div>
      </div>

      {agent && (
        <AgentConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          agentId={agent.id}
          initialConfig={agent}
          onSave={async (config) => {
            await mutate(config, false);
            setIsConfigModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
