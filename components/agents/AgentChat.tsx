'use client'

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Message } from "@/types/chat";
import ReactMarkdown from "react-markdown";
import { ToolUsage } from "./ToolUsage";

interface AgentChatProps {
  agentId: string;
  currentThreadId?: string;
  onThreadCreated?: (threadId: string) => void;
  onThreadUpdated?: () => void;
}

export function AgentChat({
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
  const [toolUsage, setToolUsage] = useState<
    {
      toolId: string;
      input: string;
      output?: string;
      status: "pending" | "approved" | "rejected" | "completed";
      requiresApproval: boolean;
    }[]
  >([]);

  // Load existing messages for thread
  useEffect(() => {
    if (currentThreadId) {
      fetch(`/api/agents/${agentId}/chat?threadId=${currentThreadId}`)
        .then((res) => res.json())
        .then((data) => {
          setMessages(data.messages || []);
        })
        .catch((err) => {
          console.error("Error loading messages:", err);
          setError("Failed to load messages");
        });
    }
  }, [agentId, currentThreadId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/agents/${agentId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          threadId: currentThreadId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // Get thread ID from response headers if it's a new thread
      const threadId = response.headers.get("X-Thread-Id");
      if (threadId && onThreadCreated) {
        onThreadCreated(threadId);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      let assistantMessage = "";
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(5));

              // Handle tool usage updates
              if (data.toolUsage) {
                setToolUsage((prev) => [...prev, data.toolUsage]);
              }

              // Handle message content
              if (data.content) {
                assistantMessage += data.content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  if (
                    newMessages[newMessages.length - 1]?.role === "assistant"
                  ) {
                    newMessages[newMessages.length - 1].content =
                      assistantMessage;
                  } else {
                    newMessages.push({
                      role: "assistant",
                      content: assistantMessage,
                    });
                  }
                  return newMessages;
                });
              }

              if (data.done) {
                // If this is the first message, trigger thread rename
                if (messages.length === 0 && threadId) {
                  try {
                    await fetch(`/api/agents/${agentId}/threads/rename`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        threadId,
                        messages: [
                          { role: "user", content: userMessage },
                          { role: "assistant", content: assistantMessage },
                        ],
                      }),
                    });
                    // Notify parent to refresh thread list
                    onThreadUpdated?.();
                  } catch (error) {
                    console.error("Failed to rename thread:", error);
                  }
                }
                break;
              }
            } catch (e) {
              console.error("Error parsing SSE:", e);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToolApproval = async (toolId: string, approved: boolean) => {
    setToolUsage((prev) =>
      prev.map((tool) =>
        tool.toolId === toolId
          ? {
              ...tool,
              status: approved ? "approved" : "rejected",
            }
          : tool
      )
    );

    // Send approval/rejection message
    const message = approved ? "approve" : "reject";
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/agents/${agentId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          threadId: currentThreadId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      let assistantMessage = "";
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(5));

              // Handle tool usage updates
              if (data.toolUsage) {
                setToolUsage((prev) => [...prev, data.toolUsage]);
              }

              // Handle message content
              if (data.content) {
                assistantMessage += data.content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  if (
                    newMessages[newMessages.length - 1]?.role === "assistant"
                  ) {
                    newMessages[newMessages.length - 1].content =
                      assistantMessage;
                  } else {
                    newMessages.push({
                      role: "assistant",
                      content: assistantMessage,
                    });
                  }
                  return newMessages;
                });
              }

              if (data.done) {
                break;
              }
            } catch (e) {
              console.error("Error parsing SSE:", e);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message, i) => (
          <div key={i} className="space-y-4">
            <div
              className={`flex ${
                message.role === "assistant" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 shadow-sm ${
                  message.role === "assistant"
                    ? "bg-muted/50 dark:bg-muted/20"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                <ReactMarkdown
                  className={`prose ${
                    message.role === "assistant"
                      ? "prose-neutral dark:prose-invert"
                      : "prose-invert"
                  } max-w-none prose-p:leading-relaxed prose-pre:p-0`}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
            {toolUsage
              .filter((tool) => tool.status === "pending")
              .map((tool) => (
                <ToolUsage
                  key={tool.toolId}
                  {...tool}
                  onApprove={() => handleToolApproval(tool.toolId, true)}
                  onReject={() => handleToolApproval(tool.toolId, false)}
                />
              ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-6">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </form>
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      </div>
    </div>
  );
} 