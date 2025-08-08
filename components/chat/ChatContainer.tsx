"use client";

import { useState, useMemo } from "react";
import { Menu, X } from "lucide-react";
import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useCloudThreadListRuntime, AssistantCloud } from "@assistant-ui/react";

import { Assistant } from "@/types/assistant";
import { useAppLangGraphRuntime } from "./runtime-provider";

interface ChatContainerProps {
  assistant: Assistant;
  threadId?: string;
}

export default function ChatContainer({
  assistant,
}: ChatContainerProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_ASSISTANT_BASE_URL!;
  const cloud = useMemo(() => new AssistantCloud({ baseUrl, anonymous: true }), [baseUrl]);

  const runtime = useCloudThreadListRuntime({
    runtimeHook: () => useAppLangGraphRuntime(assistant.assistant_id),
    cloud,
  });

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
                  <ThreadList />
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

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium overflow-hidden">
                  {assistant.metadata.agent_avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={assistant.metadata.agent_avatar} alt={assistant.name} className="w-8 h-8 rounded-full" />
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