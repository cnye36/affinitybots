'use client'

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AgentChatProps {
  agentId: string;
  currentThreadId?: string;
  onThreadCreated?: (threadId: string) => void;
}

export default function AgentChat({
  agentId,
  currentThreadId,
  onThreadCreated,
}: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load existing messages for thread
  useEffect(() => {
    if (!currentThreadId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        const response = await fetch(
          `/api/agents/${agentId}/chat?threadId=${currentThreadId}`
        );
        if (!response.ok) throw new Error("Failed to load messages");
        const data = await response.json();
        setMessages(data.messages);
      } catch (err) {
        console.error("Error loading messages:", err);
        setError("Failed to load messages");
      }
    };

    loadMessages();
  }, [agentId, currentThreadId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);
    setError(null);

    // Add user message to UI immediately
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const response = await fetch(`/api/agents/${agentId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          threadId: currentThreadId,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      // Get thread ID from response
      const newThreadId = response.headers.get("X-Thread-Id");
      if (newThreadId && onThreadCreated) {
        onThreadCreated(newThreadId);
      }

      // Add placeholder for assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      // Process the stream
      const reader = response.body?.getReader();
      let assistantMessage = "";

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Decode and process the chunk
            const text = new TextDecoder().decode(value);
            const lines = text.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(5));
                  assistantMessage = data.content;

                  // Update the last message in real time
                  setMessages((prev) => {
                    const updated = [...prev];
                    const lastMessage = updated[updated.length - 1];
                    if (lastMessage?.role === "assistant") {
                      lastMessage.content = assistantMessage;
                    }
                    return updated;
                  });
                } catch (e) {
                  console.error("Error parsing SSE data:", e);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      // Remove the assistant message if there was an error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col h-full border-l">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentThreadId ? (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "assistant" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "assistant"
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>Start a new conversation with your agent</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && <div className="p-4 text-sm text-red-500">Error: {error}</div>}

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
} 