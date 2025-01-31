"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Assistant, Thread } from "@langchain/langgraph-sdk";
import { useThreadStore } from "@/lib/stores/thread-store";
import { AgentConfigModal } from "@/components/configuration/AgentConfigModal";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatContainer } from "@/components/chat/ChatContainer";

export default function AssistantPage() {
  const params = useParams();
  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const {
    threads,
    activeThreadId,
    messages,
    isLoading,
    setThreads,
    setActiveThread,
    setMessages,
    setLoading,
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

        // Create initial thread if none exists
        if (threadsData.length === 0) {
          handleNewThread();
        } else {
          setActiveThread(threadsData[0].id);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      loadData();
    }
  }, [params.id, setLoading, setThreads, setActiveThread]);

  // Load messages when active thread changes
  useEffect(() => {
    async function loadMessages() {
      if (!activeThreadId) return;
      try {
        setLoading(true);
        const res = await fetch(
          `/api/assistants/${params.id}/threads/${activeThreadId}/messages`
        );
        if (!res.ok) throw new Error("Failed to load messages");
        const data = await res.json();
        setMessages(activeThreadId, data.messages || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, [activeThreadId, params.id, setLoading, setMessages]);

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
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!activeThreadId) return;

    try {
      setLoading(true);
      const currentMessages = messages[activeThreadId] || [];
      // Add user message immediately
      setMessages(activeThreadId, [
        ...currentMessages,
        { role: "user", content },
      ]);

      const response = await fetch(
        `/api/assistants/${params.id}/threads/${activeThreadId}/runs/stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: {
              messages: [...currentMessages, { role: "user", content }],
            },
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      let assistantMessage = "";

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Parse the chunk and update messages
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "message") {
                assistantMessage = data.content;
                // Update messages with the latest content
                setMessages(activeThreadId, [
                  ...currentMessages,
                  { role: "user", content },
                  { role: "assistant", content: assistantMessage },
                ]);
              }
            } catch (e) {
              console.error("Error parsing stream data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error ? error.message : "Failed to send message"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!assistant) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen flex-col">
      <ChatHeader
        assistant={assistant}
        onConfigureClick={() => setShowConfig(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar
          threads={threads}
          activeThreadId={activeThreadId}
          isLoading={isLoading}
          onNewChat={handleNewThread}
          onThreadSelect={setActiveThread}
        />

        <ChatContainer
          messages={activeThreadId ? messages[activeThreadId] || [] : []}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
        />
      </div>

      <AgentConfigModal
        open={showConfig}
        onOpenChange={setShowConfig}
        assistant={assistant}
      />
    </div>
  );
}
