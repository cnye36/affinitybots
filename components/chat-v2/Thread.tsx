"use client";

import { useEffect, useRef, useState, type FC } from "react";
import { ArrowDownIcon } from "lucide-react";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { Welcome } from "./Welcome";
import { UserMessage, AssistantMessage } from "./Message";
import { Composer } from "./Composer";
import type { Message } from "@/hooks/useLangGraphChat";

interface ThreadProps {
  messages: Message[];
  isRunning: boolean;
  onSendMessage: (content: string, attachments: any[]) => void;
  onCancel: () => void;
}

export const Thread: FC<ThreadProps> = ({
  messages,
  isRunning,
  onSendMessage,
  onCancel,
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const autoScrollRef = useRef(true);

  // Auto-scroll to bottom when new messages arrive (if already at bottom)
  useEffect(() => {
    if (!viewportRef.current || !autoScrollRef.current) return;

    const viewport = viewportRef.current;
    const scrollToBottom = () => {
      viewport.scrollTop = viewport.scrollHeight;
    };

    scrollToBottom();
  }, [messages, isRunning]);

  // Track scroll position to show/hide scroll button
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      // Show button if more than 200px from bottom
      setShowScrollButton(distanceFromBottom > 200);
      
      // Enable auto-scroll if near bottom
      autoScrollRef.current = distanceFromBottom < 100;
    };

    viewport.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => viewport.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = () => {
    if (!viewportRef.current) return;
    viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    autoScrollRef.current = true;
  };

  return (
    <div
      className="bg-background flex h-full flex-col"
      style={{
        ["--thread-max-width" as string]: "48rem",
        ["--thread-padding-x" as string]: "1rem",
      }}
    >
      <div
        ref={viewportRef}
        className="relative flex min-w-0 flex-1 flex-col gap-6 overflow-y-scroll"
        data-tutorial="agent-chat-viewport"
      >
        {messages.length === 0 ? (
          <Welcome />
        ) : (
          <>
            {messages.map((message, index) => {
              const isLastMessage = index === messages.length - 1;
              const isThinking = isLastMessage && message.role === "assistant" && isRunning;
              
              return message.role === "user" ? (
                <UserMessage key={message.id} message={message} />
              ) : (
                <AssistantMessage 
                  key={message.id} 
                  message={message} 
                  isThinking={isThinking}
                />
              );
            })}
            <div className="min-h-6 min-w-6 shrink-0" />
          </>
        )}

        {showScrollButton && (
          <TooltipIconButton
            tooltip="Scroll to bottom"
            variant="outline"
            className="dark:bg-background dark:hover:bg-accent absolute bottom-4 z-10 self-center rounded-full p-4"
            onClick={scrollToBottom}
          >
            <ArrowDownIcon />
          </TooltipIconButton>
        )}
      </div>

      <Composer
        onSend={onSendMessage}
        onCancel={onCancel}
        isRunning={isRunning}
      />
    </div>
  );
};

