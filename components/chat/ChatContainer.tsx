"use client";

import { useState, useEffect } from "react";
import { Message } from "@/types/langgraph";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ThreadSidebar from "./ThreadSidebar";
import { createThread, sendMessage, getThreadState } from "@/utils/chatApi";
import { useThreadStore } from "@/lib/stores/thread-store";
import { v4 as uuidv4 } from "uuid";

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
  const [userId] = useState(() => uuidv4());
  const { setTitle } = useThreadStore();

  // Initialize chat if no thread exists
  useEffect(() => {
    const initializeChat = async () => {
      if (!currentThreadId) {
        try {
          const thread = await createThread(assistantId);
          setCurrentThreadId(thread.thread_id);
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
          const threadState = await getThreadState(
            currentThreadId,
            assistantId
          );
          if (threadState.values?.messages) {
            setMessages(
              threadState.values.messages.map((msg) => ({
                role: msg.role === "human" ? "user" : "assistant",
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
      const thread = await createThread(assistantId);
      setCurrentThreadId(thread.thread_id);
      setMessages([]);
    } catch (error) {
      console.error("Error creating new thread:", error);
    }
  };

  const generateTitle = async (threadId: string, conversation: string) => {
    try {
      const response = await fetch(
        `/api/assistants/${assistantId}/threads/${threadId}/rename`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ conversation }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate title");
      }

      const data = await response.json();
      if (data.title) {
        setTitle(threadId, data.title);
      }
    } catch (error) {
      console.error("Error generating title:", error);
    }
  };

  const sendChatMessage = async (content: string) => {
    setIsLoading(true);
    try {
      let threadId = currentThreadId;

      // If there's no current thread, create one
      if (!threadId) {
        const thread = await createThread(assistantId);
        threadId = thread.thread_id;
        setCurrentThreadId(threadId);
      }

      if (!threadId) {
        throw new Error("Failed to create or get thread ID");
      }

      // Optimistically update UI with user message
      const userMessage: Message = { role: "user", content };
      setMessages((prev) => [...prev, userMessage]);

      // Stream the response
      const response = await sendMessage({
        threadId,
        assistantId,
        messageId: uuidv4(),
        message: content,
        model: "gpt-4o",
        userId,
        systemInstructions: "",
        streamMode: "messages",
      });

      if (!response) {
        throw new Error("No response stream received");
      }

      const reader = response.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = "";

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
              if (messageData?.content) {
                assistantResponse = messageData.content;
                setMessages((prev) => {
                  const lastMessage = prev[prev.length - 1];
                  if (lastMessage?.role === "assistant") {
                    return [
                      ...prev.slice(0, -1),
                      { role: "assistant", content: messageData.content },
                    ];
                  } else {
                    return [
                      ...prev,
                      { role: "assistant", content: messageData.content },
                    ];
                  }
                });
              }
            }
          } catch (e) {
            console.error("Error parsing chunk:", e, line);
          }
        }
      }

      // Generate title after first message exchange
      if (messages.length === 0 && threadId) {
        const conversation = `User: ${content}\nAssistant: ${assistantResponse}`;
        await generateTitle(threadId, conversation);
      }
    } catch (error) {
      console.error("Error sending message:", error);
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
