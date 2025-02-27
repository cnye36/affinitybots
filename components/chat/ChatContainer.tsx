"use client";

import { useState, useEffect } from "react";
import { AgentState } from "@/types/langgraph";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ThreadSidebar from "./ThreadSidebar";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatContainerProps {
  assistantId: string;
  threadId?: string;
}

export default function ChatContainer({
  assistantId,
  threadId: initialThreadId,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<AgentState["messages"]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>(
    initialThreadId
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initialize chat if no thread exists
  useEffect(() => {
    if (!currentThreadId) {
      setMessages([]);
    }
  }, [currentThreadId]);

  // Fetch thread state when switching threads
  useEffect(() => {
    const fetchThreadState = async () => {
      if (!currentThreadId) {
        setMessages([]);
        return;
      }

      try {
        const response = await fetch(
          `/api/assistants/${assistantId}/threads/${currentThreadId}/state`
        );
        if (!response.ok) throw new Error("Failed to get thread state");

        const data = await response.json();
        if (data.values?.messages) {
          setMessages(
            data.values.messages.map((msg: { type: string; content: string }) =>
              msg.type === "human"
                ? new HumanMessage(msg.content)
                : new AIMessage(msg.content)
            )
          );
        }
      } catch (error) {
        console.error("Error fetching thread state:", error);
        setMessages([]);
      }
    };

    fetchThreadState();
  }, [currentThreadId, assistantId]);

  const handleThreadSelect = (threadId: string) => {
    if (threadId !== currentThreadId) {
      setCurrentThreadId(threadId);
    }
  };

  const handleNewThread = async () => {
    try {
      const response = await fetch(`/api/assistants/${assistantId}/threads`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to create thread");
      const data = await response.json();
      setCurrentThreadId(data.thread_id);
      setMessages([]);
    } catch (error) {
      console.error("Error creating new thread:", error);
    }
  };

  const sendChatMessage = async (content: string) => {
    setIsLoading(true);
    let threadId = currentThreadId;

    try {
      // Create a thread only if we don't have one and we're actually sending a message
      if (!threadId) {
        const response = await fetch(`/api/assistants/${assistantId}/threads`, {
          method: "POST",
        });
        if (!response.ok) throw new Error("Failed to create thread");
        const data = await response.json();
        threadId = data.thread_id;
        setCurrentThreadId(threadId);
      }

      // Optimistically add user message
      const userMessage = new HumanMessage(content);
      setMessages((prev) => [...prev, userMessage]);

      // Stream the response
      const response = await fetch(
        `/api/assistants/${assistantId}/threads/${threadId}/runs`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error("No response stream received");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            if (line.startsWith("data: ")) {
              const jsonData = JSON.parse(line.slice(6));
              const messageData = jsonData[0];

              if (messageData?.content !== undefined) {
                fullResponse = messageData.content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage instanceof AIMessage) {
                    newMessages[newMessages.length - 1] = new AIMessage(
                      messageData.content
                    );
                  } else {
                    newMessages.push(new AIMessage(messageData.content));
                  }
                  return newMessages;
                });
              }
            }
          } catch (e) {
            console.error("Error parsing chunk:", e, line);
          }
        }
      }

      // Generate title after first message exchange if not already set
      if (messages.length === 0) {
        const conversation = `User: ${content}\nAssistant: ${fullResponse}`;
        try {
          const titleResponse = await fetch(
            `/api/assistants/${assistantId}/threads/${threadId}/rename`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ conversation }),
            }
          );

          if (!titleResponse.ok) {
            console.error("Failed to generate title");
          }
        } catch (error) {
          console.error("Error generating title:", error);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        new AIMessage(
          "I apologize, but I encountered an error. Please try again."
        ),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] mx-2 mb-2 rounded-lg border bg-background shadow-sm relative">
      {/* Mobile Sidebar Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 left-2 md:hidden z-50"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed md:relative inset-y-0 left-0 z-40 w-80 transform transition-transform duration-200 ease-in-out bg-background md:transform-none",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <ThreadSidebar
          assistantId={assistantId}
          currentThreadId={currentThreadId}
          onThreadSelect={(threadId) => {
            handleThreadSelect(threadId);
            setIsSidebarOpen(false);
          }}
          onNewThread={() => {
            handleNewThread();
            setIsSidebarOpen(false);
          }}
        />
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden border-l border-border">
        <MessageList messages={messages} />
        <MessageInput onSend={sendChatMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
