"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Assistant, Thread } from "@langchain/langgraph-sdk";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { useThreadStore } from "@/lib/stores/thread-store";
import { Button } from "@/components/ui/button";
import { AgentConfigModal } from "@/components/configuration/AgentConfigModal";

export default function AssistantPage() {
  const params = useParams();
  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const {
    threads,
    activeThreadId,
    messages,
    isLoading,
    error,
    setThreads,
    setActiveThread,
    setMessages,
    setLoading,
    setError,
  } = useThreadStore();

  // Load assistant and threads
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load assistant
        const assistantRes = await fetch(`/api/assistants/${params.id}`);
        if (!assistantRes.ok) throw new Error("Failed to load assistant");
        const assistantData = await assistantRes.json();
        setAssistant(assistantData);

        // Load threads
        const threadsRes = await fetch(`/api/assistants/${params.id}/threads`);
        if (!threadsRes.ok) throw new Error("Failed to load threads");
        const threadsData = await threadsRes.json();
        setThreads(threadsData);
      } catch (error) {
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      loadData();
    }
  }, [params.id]);

  // Load messages when active thread changes
  useEffect(() => {
    async function loadMessages() {
      if (!activeThreadId) return;
      try {
        setLoading(true);
        const res = await fetch(
          `/api/assistants/${params.id}/threads/${activeThreadId}/runs`
        );
        if (!res.ok) throw new Error("Failed to load messages");
        const data = await res.json();
        setMessages(activeThreadId, data.messages || []);
      } catch (error) {
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, [activeThreadId]);

  const handleNewThread = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/assistants/${params.id}/threads`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to create thread");
      const thread: Thread = await res.json();
      setThreads([...threads, thread]);
      setActiveThread(thread.id);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!activeThreadId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/assistants/${params.id}/threads/${activeThreadId}/runs/stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: { messages: [{ role: "user", content }] },
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      // Add user message immediately
      const currentMessages = messages[activeThreadId] || [];
      setMessages(activeThreadId, [
        ...currentMessages,
        { role: "user", content },
      ]);

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Parse the chunk and update messages
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));
            if (data.type === "message") {
              setMessages(activeThreadId, [
                ...currentMessages,
                { role: "user", content },
                { role: "assistant", content: data.content },
              ]);
            }
          }
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!assistant) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div
              className="h-10 w-10 rounded-full ring-2 ring-background flex items-center justify-center text-sm font-medium text-white"
              style={{
                backgroundColor: `hsl(${
                  (assistant.name.length * 30) % 360
                }, 70%, 50%)`,
              }}
            >
              {assistant.name.slice(0, 2).toUpperCase()}
            </div>
            <h1 className="text-xl font-semibold">{assistant.name}</h1>
          </div>
          <Button variant="outline" onClick={() => setShowConfig(true)}>
            Configure
          </Button>
        </div>
      </header>

      {/* Main chat area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r bg-background p-4">
          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={handleNewThread}
              disabled={isLoading}
            >
              New Chat
            </Button>
            <div className="space-y-1">
              {threads.map((thread) => (
                <Button
                  key={thread.id}
                  variant={thread.id === activeThreadId ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveThread(thread.id)}
                >
                  Chat {new Date(thread.created_at).toLocaleDateString()}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat container */}
        <div className="flex-1 flex flex-col">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeThreadId &&
              messages[activeThreadId]?.map((message, index) => (
                <ChatMessage
                  key={index}
                  role={message.role}
                  content={message.content}
                />
              ))}
          </div>

          {/* Input area */}
          <ChatInput
            onSubmit={handleSendMessage}
            disabled={isLoading || !activeThreadId}
          />
        </div>
      </div>

      {/* Config Modal */}
      <AgentConfigModal
        open={showConfig}
        onOpenChange={setShowConfig}
        assistant={assistant}
      />
    </div>
  );
}
