'use client'

import { useEffect, useRef, useState } from "react";
import { Message } from "@/types/chat";
import ReactMarkdown from "react-markdown";

interface AgentChatProps {
  agentId: string;
  currentThreadId?: string;
  onThreadCreated?: (threadId: string) => void;
  onThreadUpdated?: () => void;
}

export default function AgentChat({
  agentId,
  currentThreadId,
  onThreadCreated,
  onThreadUpdated,
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

  // Add typing indicator state
  const [isTyping, setIsTyping] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setIsLoading(true);
    setIsTyping(true);
    setError(null);

    // Add user message immediately
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

      // Get thread ID from response headers if it's a new thread
      const threadId = response.headers.get("X-Thread-Id");
      if (threadId && onThreadCreated) {
        onThreadCreated(threadId);
      }

      // Add placeholder for assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      const isFirstMessage = messages.length === 0;
      let accumulatedContent = "";

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response body");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              // Accumulate content and update immediately for smooth streaming
              accumulatedContent += data.content || "";
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === "assistant") {
                  lastMessage.content = accumulatedContent;
                }
                return newMessages;
              });

              // If this is the final message and it was the first exchange, rename the chat
              if (data.done && isFirstMessage && threadId) {
                try {
                  await fetch(`/api/agents/${agentId}/threads/rename`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      threadId,
                      messages: [
                        { role: "user", content: userMessage },
                        { role: "assistant", content: accumulatedContent },
                      ],
                    }),
                  });
                  // Notify parent to refresh thread list
                  onThreadUpdated?.();
                } catch (error) {
                  console.error("Failed to rename thread:", error);
                }
              }

              if (data.done) {
                setIsTyping(false);
                break;
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsTyping(false);
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
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === "user"
                  ? "bg-blue-500 text-white dark:bg-blue-600"
                  : "bg-gray-200 text-gray-900 dark:bg-gray-800"
              }`}
            >
              <ReactMarkdown className="prose dark:prose-invert max-w-none">
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-900 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex space-x-2">
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && <div className="p-4 text-red-500 text-center">{error}</div>}

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
} 