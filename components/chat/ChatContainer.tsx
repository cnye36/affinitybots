"use client";

import { useState, useEffect, useRef } from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ThreadSidebar, { ThreadSidebarRef } from "./ThreadSidebar";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Assistant } from "@/types/assistant";
import { createClient } from "@/supabase/client";
import ToolCallApproval from "./ToolCallApproval";
import { useStream } from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";

interface ChatContainerProps {
  assistant: Assistant;
  threadId?: string;
}

export default function ChatContainer({
  assistant,
  threadId: propThreadId,
}: ChatContainerProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>(propThreadId);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState("U");
  const [pendingToolCalls, setPendingToolCalls] = useState<any[]>([]);
  const [isWaitingForApproval, setIsWaitingForApproval] = useState(false);
  const sidebarRef = useRef<ThreadSidebarRef>(null);

  // Simple useStream hook following the official pattern
  const thread = useStream<{ messages: Message[] }>({
    apiUrl: process.env.NEXT_PUBLIC_LANGGRAPH_URL || process.env.LANGGRAPH_URL,
    apiKey: process.env.NEXT_PUBLIC_LANGSMITH_API_KEY || process.env.LANGSMITH_API_KEY,
    assistantId: assistant.assistant_id,
    messagesKey: "messages",
    threadId: currentThreadId,
  });

  // Debug what we're getting from the stream
  useEffect(() => {
    console.log("Thread state:", {
      messages: thread.messages,
      isLoading: thread.isLoading,
      error: thread.error,
      threadId: currentThreadId,
    });
  }, [thread.messages, thread.isLoading, thread.error, currentThreadId]);

  // Convert LangGraph messages to LangChain format for display
  const displayMessages = thread.messages.map((msg: Message, index: number) => {
    if (msg.type === "human") {
      return new HumanMessage(msg.content as string);
    } else if (msg.type === "ai") {
      return new AIMessage(msg.content as string);
    }
    return new AIMessage(msg.content as string); // fallback
  });

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserAvatar(user.user_metadata?.avatar_url || null);
        setUserInitials(
          user.user_metadata?.full_name 
            ? user.user_metadata.full_name.substring(0, 2).toUpperCase()
            : user.email?.substring(0, 2).toUpperCase() || "U"
        );
      }
    };

    fetchUserData();
  }, []);

  // Update thread ID when prop changes
  useEffect(() => {
    if (propThreadId !== currentThreadId) {
      setCurrentThreadId(propThreadId);
    }
  }, [propThreadId, currentThreadId]);

  const sendChatMessage = async (content: string) => {
    try {
      console.log("Sending message:", content);
      
      // Submit message using the simple thread.submit pattern
      thread.submit({ 
        messages: [{ type: "human", content }] 
      });
      
      // If we don't have a thread ID yet, the hook will create one automatically
      // We need to watch for when the threadId becomes available
      
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Note: The useStream hook doesn't expose threadId directly
  // We'll manage thread creation differently
  // For now, we'll rely on the currentThreadId state management

  const handleNewThread = () => {
    setCurrentThreadId(undefined);
    setIsWaitingForApproval(false);
    setPendingToolCalls([]);
  };

  const handleThreadSelect = (threadId: string) => {
    setCurrentThreadId(threadId);
    setIsWaitingForApproval(false);
    setPendingToolCalls([]);
  };

  const handleApproveToolCall = async (toolCallId: string) => {
    // Tool call approval logic would go here
    setIsWaitingForApproval(false);
    setPendingToolCalls([]);
  };

  const handleDenyToolCall = async (toolCallId: string) => {
    // Tool call denial logic would go here  
    setIsWaitingForApproval(false);
    setPendingToolCalls([]);
  };

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          "border-r transition-all duration-300 flex-shrink-0",
          isSidebarOpen ? "w-64 sm:w-80" : "w-0",
          "lg:w-64 lg:block"
        )}
      >
        <div
          className={cn(
            "h-full",
            isSidebarOpen ? "block" : "hidden lg:block"
          )}
        >
          <ThreadSidebar
            ref={sidebarRef}
            assistantId={assistant.assistant_id}
            currentThreadId={currentThreadId}
            onThreadSelect={handleThreadSelect}
            onNewThread={handleNewThread}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b p-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
              {assistant.metadata.agent_avatar ? (
                <img
                  src={assistant.metadata.agent_avatar}
                  alt={assistant.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                assistant.name ? assistant.name.substring(0, 2).toUpperCase() : "A"
              )}
            </div>
            <div>
              <h2 className="font-semibold">{assistant.name}</h2>
              <p className="text-sm text-muted-foreground">
                {assistant.metadata.description || "AI Assistant"}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <MessageList
            messages={displayMessages}
            agentAvatar={assistant.metadata.agent_avatar}
            agentInitials={
              assistant.name ? assistant.name.substring(0, 2).toUpperCase() : "A"
            }
            userAvatar={userAvatar || undefined}
            userInitials={userInitials}
            isThinking={thread.isLoading}
            threadId={currentThreadId}
          />
        </div>

        {/* Tool Call Approval */}
        {isWaitingForApproval && pendingToolCalls.length > 0 && (
          <ToolCallApproval
            toolCalls={pendingToolCalls}
            onApprove={handleApproveToolCall}
            onDeny={handleDenyToolCall}
            onApproveAll={() => {}}
            onDenyAll={() => {}}
          />
        )}

        {/* Input */}
        <div className="border-t p-4">
          <MessageInput
            onSend={sendChatMessage}
            disabled={thread.isLoading || isWaitingForApproval}
          />
        </div>

        {/* Stop Button */}
        {thread.isLoading && (
          <div className="border-t p-4">
            <Button
              variant="outline"
              onClick={() => thread.stop()}
              className="w-full"
            >
              Stop Generation
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}