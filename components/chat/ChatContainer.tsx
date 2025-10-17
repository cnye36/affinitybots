"use client";

import { useState, useRef } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Assistant } from "@/types/assistant";
import { useLangGraphChat } from "@/hooks/useLangGraphChat";
import ThreadSidebar, { ThreadSidebarRef } from "@/components/chat/ThreadSidebar";
import { Thread } from "./Thread";

interface ChatContainerProps {
  assistant: Assistant;
}

export default function ChatContainer({ assistant }: ChatContainerProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<ThreadSidebarRef>(null);
  
  const {
    threadId,
    messages,
    isRunning,
    error,
    sendMessage,
    cancel,
    switchToNewThread,
    switchToThread,
  } = useLangGraphChat({
    assistantId: assistant.assistant_id,
    onThreadCreated: (newThreadId) => {
      console.log("Thread created:", newThreadId);
      // Force refresh the sidebar when a new thread is created
      setTimeout(() => {
        sidebarRef.current?.refreshThreads();
      }, 200);
    },
  });

  const handleThreadSelect = (selectedThreadId: string) => {
    switchToThread(selectedThreadId);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const handleNewThread = () => {
    switchToNewThread();
    setIsSidebarOpen(false); // Close sidebar on mobile after creating new thread
  };

  return (
    <TooltipProvider>
      <div className="flex h-full bg-background">
        {/* Sidebar */}
        <div
          className={cn(
            "border-r transition-all duration-300 flex-shrink-0 overflow-hidden",
            isSidebarOpen ? "w-64 sm:w-80" : "w-0 lg:w-64"
          )}
        >
          <div className="h-full w-64 sm:w-80 lg:w-64">
            <ThreadSidebar
              ref={sidebarRef}
              assistantId={assistant.assistant_id}
              currentThreadId={threadId || undefined}
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
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            {error && (
              <div className="text-sm text-destructive">
                Error: {error}
              </div>
            )}
          </div>

          {/* Thread Chat */}
          <div className="flex-1 overflow-hidden">
            <Thread
              messages={messages}
              isRunning={isRunning}
              onSendMessage={sendMessage}
              onCancel={cancel}
            />
          </div>
        </div>

        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

