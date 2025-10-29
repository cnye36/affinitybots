"use client";

import { useState, useRef } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Assistant } from "@/types/assistant";
import { Chat } from "@/components/chat/Chat";
import ThreadSidebar, { ThreadSidebarRef } from "@/components/chat/ThreadSidebar";

interface ChatContainerProps {
  assistant: Assistant;
}

export default function ChatContainer({ assistant }: ChatContainerProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<ThreadSidebarRef>(null);
  const [threadId, setThreadId] = useState<string | null>(null);

  const handleThreadSelect = (selectedThreadId: string) => {
    setThreadId(selectedThreadId);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const handleNewThread = () => {
    setThreadId(null);
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
          </div>

          {/* Thread Chat (migrated to useStream) */}
          <div className="flex-1 overflow-hidden">
            <Chat assistantId={assistant.assistant_id} threadId={threadId} onThreadId={setThreadId} />
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

