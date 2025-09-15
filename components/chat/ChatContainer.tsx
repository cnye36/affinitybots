"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Thread } from "@/components/assistant-ui/thread";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { AssistantRuntimeProvider, useAssistantRuntime } from "@assistant-ui/react";
import { Assistant } from "@/types/assistant";
import { useAppLangGraphRuntime } from "./runtime-provider";
import ThreadSidebar from "./ThreadSidebar";
import { useEffect } from "react";
import { useOnboarding, agentPageTutorialSteps } from "@/hooks/useOnboarding";
import { createClient } from "@/supabase/client";

interface ChatContainerProps {
  assistant: Assistant;
  threadId?: string;
}

export default function ChatContainer({
  assistant,
}: ChatContainerProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const runtime = useAppLangGraphRuntime(assistant.assistant_id);
  const { startTour, isActive } = useOnboarding();

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const seenLocal = localStorage.getItem('onboarding-agent-page-seen')
        let completedDb = false
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('preferences')
            .eq('id', user.id)
            .single()
          completedDb = Boolean((data?.preferences as any)?.onboardingCompleted)
        }
        if (!completedDb && !seenLocal && !isActive) {
          localStorage.setItem('onboarding-agent-page-seen', 'true')
          setTimeout(() => startTour(agentPageTutorialSteps), 400)
        }
      } catch (e) {
        // Local fallback
        const seen = localStorage.getItem('onboarding-agent-page-seen')
        if (!seen && !isActive) {
          localStorage.setItem('onboarding-agent-page-seen', 'true')
          setTimeout(() => startTour(agentPageTutorialSteps), 400)
        }
      }
    })()
  }, [startTour, isActive])

  return (
    <TooltipProvider>
      <AssistantRuntimeProvider runtime={runtime}>
        <div className="flex h-full bg-background">
          {/* Sidebar */}
          <div
            className={cn(
              "border-r transition-all duration-300 flex-shrink-0",
              isSidebarOpen ? "w-64 sm:w-80" : "w-0",
              "lg:w-64 lg:block"
            )}
          >
            <div className={cn("h-full", isSidebarOpen ? "block" : "hidden lg:block")}> 
              <div className="h-full flex flex-col">
                <div className="p-3 border-b font-medium">Chats</div>
                <div className="flex-1 overflow-y-auto p-2">
                  <ThreadSidebarBridge assistantId={assistant.assistant_id} />
                </div>
              </div>
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

            {/* Thread Chat */}
            <div className="flex-1 overflow-hidden">
              <Thread />
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
      </AssistantRuntimeProvider>
    </TooltipProvider>
  );
}

function ThreadSidebarBridge({ assistantId }: { assistantId: string }) {
  const runtime = useAssistantRuntime();

  const handleThreadSelect = (threadId: string) => {
    runtime.switchToThread(threadId);
  };

  const handleNewThread = () => {
    runtime.switchToNewThread();
  };

  return (
    <ThreadSidebar
      assistantId={assistantId}
      onThreadSelect={handleThreadSelect}
      onNewThread={handleNewThread}
    />
  );
}