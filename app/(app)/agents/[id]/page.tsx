"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AgentChat from "@/components/agents/AgentChat";
import { AgentConfigModal } from "@/components/configuration/AgentConfigModal";
import { ChatThreads } from "@/components/agents/ChatThreads";
import { useAgent } from "@/hooks/useAgent";

export default function AgentPage() {
  const params = useParams();
  const { agent, isLoading, isError, mutate } = useAgent(params.id as string);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>(
    undefined
  );

  // Load initial thread state
  useEffect(() => {
    async function loadInitialThread() {
      try {
        const response = await fetch(`/api/agents/${params.id}/threads`);
        if (!response.ok) throw new Error("Failed to load threads");
        const data = await response.json();

        // If there are threads, set the most recent one as current
        if (data.threads && data.threads.length > 0) {
          setCurrentThreadId(data.threads[0].id);
        }
      } catch (error) {
        console.error("Error loading initial thread:", error);
      }
    }

    loadInitialThread();
  }, [params.id]);

  // Handle URL thread parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const threadId = searchParams.get("thread");
    if (threadId) {
      setCurrentThreadId(threadId);
    }
  }, []);

  const handleNewThread = () => {
    setCurrentThreadId(undefined);
    // Remove thread parameter from URL
    const url = new URL(window.location.href);
    url.searchParams.delete("thread");
    window.history.replaceState({}, "", url.toString());
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError || !agent) return <div>Agent not found</div>;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <Link href="/agents" className="mr-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Agent: {agent.name}</h1>
        </div>
        <Button onClick={() => setIsConfigModalOpen(true)}>
          Configure Agent
        </Button>
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

      <div className="flex-1 flex overflow-hidden">
        <ChatThreads
          agentId={params.id as string}
          currentThreadId={currentThreadId}
          onThreadSelect={setCurrentThreadId}
          onNewThread={handleNewThread}
        />

        <AgentChat
          agentId={params.id as string}
          currentThreadId={currentThreadId}
          onThreadCreated={setCurrentThreadId}
          onThreadUpdated={() => {
            // Trigger a refresh of the threads list
            const event = new Event("threadUpdated");
            window.dispatchEvent(event);
          }}
        />
      </div>
    </div>
  );
}
