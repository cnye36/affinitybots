"use client";

import { useState, useEffect } from "react";
import { Message } from "@/types/langgraph";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ThreadSidebar from "./ThreadSidebar";

interface ChatContainerProps {
  assistantId: string;
  threadId?: string;
}

export default function ChatContainer({
  assistantId,
  threadId: initialThreadId,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>(
    initialThreadId
  );
  const [isLoading, setIsLoading] = useState(false);

  // Initialize chat if no thread exists
  useEffect(() => {
    const initializeChat = async () => {
      if (!currentThreadId) {
        try {
          const thread = await fetch(`/api/assistants/${assistantId}/threads`, {
            method: "POST",
          });
          const data = await thread.json();
          setCurrentThreadId(data.thread_id);
        } catch (error) {
          console.error("Error creating thread:", error);
        }
      }
    };

    initializeChat();
  }, [assistantId, currentThreadId]);

  // Fetch messages when switching threads
  useEffect(() => {
    const fetchThreadMessages = async () => {
      if (currentThreadId) {
        try {
          const response = await fetch(
            `/api/assistants/${assistantId}/threads/${currentThreadId}`
          );
          if (!response.ok) {
            throw new Error("Failed to get thread state");
          }
          const data = await response.json();
          if (data.values?.messages) {
            setMessages(
              data.values.messages.map((msg: Message) => ({
                role: msg.role === "user" ? "user" : "assistant",
                content: msg.content,
              }))
            );
          }
        } catch (error) {
          console.error("Error fetching thread messages:", error);
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    };

    fetchThreadMessages();
  }, [currentThreadId, assistantId]);

  const handleThreadSelect = (threadId: string) => {
    if (threadId !== currentThreadId) {
      setCurrentThreadId(threadId);
    }
  };

  const handleNewThread = async () => {
    try {
      const thread = await fetch(`/api/assistants/${assistantId}/threads`, {
        method: "POST",
      });
      const data = await thread.json();
      setCurrentThreadId(data.thread_id);
      setMessages([]);
    } catch (error) {
      console.error("Error creating new thread:", error);
    }
  };

  // const generateTitle = async (threadId: string, conversation: string) => {
  //   try {
  //     const response = await fetch(
  //       `/api/assistants/${assistantId}/threads/${threadId}/rename`,
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({ conversation }),
  //       }
  //     );

  //     if (!response.ok) {
  //       throw new Error("Failed to generate title");
  //     }

  //     const data = await response.json();
  //     if (data.title) {
  //       setTitle(threadId, data.title);
  //     }
  //   } catch (error) {
  //     console.error("Error generating title:", error);
  //   }
  // };

  const sendChatMessage = async (content: string) => {
    setIsLoading(true);
    try {
      let threadId = currentThreadId;

      // If there's no current thread, create one
      if (!threadId) {
        const thread = await fetch(`/api/assistants/${assistantId}/threads`, {
          method: "POST",
        });
        const data = await thread.json();
        threadId = data.thread_id;
        setCurrentThreadId(threadId);
      }

      if (!threadId) {
        throw new Error("Failed to create or get thread ID");
      }

      // Optimistically add user message
      const userMessage: Message = { role: "user", content };
      const assistantMessage: Message = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, userMessage, assistantMessage]);

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
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage?.role === "assistant") {
                    newMessages[newMessages.length - 1] = {
                      role: "assistant",
                      content: messageData.content,
                    };
                    return newMessages;
                  }
                  return prev;
                });
              }
            }
          } catch (e) {
            console.error("Error parsing chunk:", e, line);
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage?.role === "assistant") {
          newMessages[newMessages.length - 1] = {
            role: "assistant",
            content:
              "I apologize, but I encountered an error. Please try again.",
          };
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full">
      <ThreadSidebar
        assistantId={assistantId}
        currentThreadId={currentThreadId}
        onThreadSelect={handleThreadSelect}
        onNewThread={handleNewThread}
      />
      <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
        <MessageList messages={messages} />
        <MessageInput onSend={sendChatMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
