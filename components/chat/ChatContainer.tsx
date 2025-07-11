"use client";

import { useState, useEffect, useRef } from "react";
import { AgentState } from "@/types/langgraph";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ThreadSidebar, { ThreadSidebarRef } from "./ThreadSidebar";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Agent } from "@/types/agent";
import { createClient } from "@/supabase/client";

interface ChatContainerProps {
  agent: Agent;
  threadId?: string;
}

export default function ChatContainer({
  agent,
  threadId: initialThreadId,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<AgentState["messages"]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>(
    initialThreadId
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | undefined>(undefined);
  const [userInitials, setUserInitials] = useState<string>("U");
  const threadSidebarRef = useRef<ThreadSidebarRef>(null);

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
          `/api/agents/${agent.id}/threads/${currentThreadId}/state`
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
  }, [currentThreadId, agent.id]);

  // Fetch user profile for avatar/initials
  useEffect(() => {
    async function loadUserProfile() {
      try {
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (authUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, email, avatar_url")
            .eq("id", authUser.id)
            .single();
          const authMetadata = authUser.user_metadata || {};
          const name =
            profile?.name ||
            authMetadata.full_name ||
            authMetadata.name ||
            authUser.email?.split("@")[0] ||
            "User";
          setUserInitials(name.substring(0, 2).toUpperCase());
          setUserAvatar(
            profile?.avatar_url ||
              authMetadata.avatar_url ||
              authMetadata.picture
          );
        }
      } catch (err) {
        // fallback to default
        setUserInitials("U");
        setUserAvatar(undefined);
      }
    }
    loadUserProfile();
  }, []);

  const handleThreadSelect = (threadId: string) => {
    if (threadId !== currentThreadId) {
      setCurrentThreadId(threadId);
    }
  };

  const handleNewThread = async () => {
    try {
      const response = await fetch(`/api/agents/${agent.id}/threads`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to create thread");
      const data = await response.json();
      setCurrentThreadId(data.thread_id);
      setMessages([]);

      // Generate title immediately after creating a new thread
      try {
        const titleResponse = await fetch(
          `/api/agents/${agent.id}/threads/${data.thread_id}/rename`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              conversation: `New Chat`,
            }),
          }
        );
        if (!titleResponse.ok) {
          console.error("Failed to generate title");
        }
        // Refresh sidebar to show the new thread with title
        threadSidebarRef.current?.refreshThreads();
      } catch (error) {
        console.error("Error generating title:", error);
      }
    } catch (error) {
      console.error("Error creating new thread:", error);
    }
  };

  const sendChatMessage = async (content: string) => {
    setIsLoading(true);
    let threadId = currentThreadId;
    try {
      if (!threadId) {
        const response = await fetch(`/api/agents/${agent.id}/threads`, {
          method: "POST",
        });
        if (!response.ok) throw new Error("Failed to create thread");
        const data = await response.json();
        threadId = data.thread_id;
        setCurrentThreadId(threadId);

        // Generate title immediately after creating a new thread
        try {
          const titleResponse = await fetch(
            `/api/agents/${agent.id}/threads/${threadId}/rename`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ conversation: `User: ${content}` }),
            }
          );
          if (!titleResponse.ok) {
            console.error("Failed to generate title");
          }
          // Refresh sidebar to show the new thread with title
          threadSidebarRef.current?.refreshThreads();
        } catch (error) {
          console.error("Error generating title:", error);
        }
      } else if (messages.length === 0) {
        // If this is the first message in an existing thread, also generate title
        try {
          const titleResponse = await fetch(
            `/api/agents/${agent.id}/threads/${threadId}/rename`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ conversation: `User: ${content}` }),
            }
          );
          if (!titleResponse.ok) {
            console.error("Failed to generate title");
          }
          // Refresh sidebar to show the updated title
          threadSidebarRef.current?.refreshThreads();
        } catch (error) {
          console.error("Error generating title:", error);
        }
      }
      // Optimistically add user message
      const userMessage = new HumanMessage(content);
      setMessages((prev) => [...prev, userMessage]);
      // Show 'Thinking...' indicator
      setIsLoading(true);
      // Stream the response
      const response = await fetch(
        `/api/agents/${agent.id}/threads/${threadId}/runs`,
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
      let agentMessageAdded = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(Boolean);
        for (const line of lines) {
          try {
            if (line.startsWith("data: ")) {
              const jsonString = line.slice(6).trim();
              
              // Skip empty data lines
              if (!jsonString) continue;
              
              const jsonData = JSON.parse(jsonString);
              
              // Handle different event formats
              if (Array.isArray(jsonData)) {
                // Handle array format (normal messages)
                if (jsonData.length > 0) {
                  const messageData = jsonData[0];
                  
                  // Check for error events
                  if (messageData?.event === "error") {
                    console.error("Stream error:", messageData.data);
                    continue;
                  }
                  
                  // Check for message content
                  if (messageData?.content !== undefined) {
                    fullResponse = messageData.content;
                    setMessages((prev) => {
                      // Only add the agent message once, or update it if already present
                      const newMessages = [...prev];
                      if (
                        agentMessageAdded &&
                        newMessages[newMessages.length - 1] instanceof AIMessage
                      ) {
                        newMessages[newMessages.length - 1] = new AIMessage(
                          messageData.content
                        );
                      } else {
                        newMessages.push(new AIMessage(messageData.content));
                        agentMessageAdded = true;
                      }
                      return newMessages;
                    });
                  }
                }
              } else if (jsonData?.content !== undefined) {
                // Handle direct object format (fallback)
                fullResponse = jsonData.content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  if (
                    agentMessageAdded &&
                    newMessages[newMessages.length - 1] instanceof AIMessage
                  ) {
                    newMessages[newMessages.length - 1] = new AIMessage(
                      jsonData.content
                    );
                  } else {
                    newMessages.push(new AIMessage(jsonData.content));
                    agentMessageAdded = true;
                  }
                  return newMessages;
                });
              }
            }
          } catch (e) {
            // Only log if it's not an empty line or common non-JSON line
            if (line.trim() && !line.match(/^(event:|id:|retry:)/)) {
              console.warn("Skipping unparseable chunk:", { error: e, line });
            }
          }
        }
      }
      // We no longer need to generate a title here as we do it immediately after thread creation
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
          ref={threadSidebarRef}
          agentId={agent.id}
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
        <MessageList
          messages={messages}
          agentAvatar={agent.agent_avatar}
          agentInitials={
            agent.name ? agent.name.substring(0, 2).toUpperCase() : "A"
          }
          userAvatar={userAvatar}
          userInitials={userInitials}
          isThinking={isLoading}
        />
        <MessageInput onSend={sendChatMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
