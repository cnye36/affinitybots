"use client";

import { useEffect, useRef, useState, type FC } from "react";
import { ArrowDownIcon } from "lucide-react";
import { TooltipIconButton } from "./TooltipIconButton";
import { Welcome } from "./Welcome";
import { UserMessage, AssistantMessage } from "./Message";
import { Composer } from "./Composer";
import type { ChatMessage as Message } from "@/components/chat/types";

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
      const hasScroll = scrollHeight > clientHeight;

      // Show button only if content is scrollable AND user has scrolled up more than 200px from bottom
      setShowScrollButton(hasScroll && distanceFromBottom > 200);

      // Enable auto-scroll if near bottom
      autoScrollRef.current = distanceFromBottom < 100;
    };

    viewport.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => viewport.removeEventListener("scroll", handleScroll);
  }, [messages]);

  const scrollToBottom = () => {
    if (!viewportRef.current) return;
    viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    autoScrollRef.current = true;
  };

  return (
    <div
      className="bg-background flex h-full flex-col relative"
      style={{
        ["--thread-max-width" as string]: "48rem",
        ["--thread-padding-x" as string]: "1rem",
      }}
    >
      <div
        ref={viewportRef}
        className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto"
        data-tutorial="chat-messages"
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

            {/* Show thinking indicator when waiting for assistant response */}
            {isRunning && messages.length > 0 && messages[messages.length - 1].role === "user" && (
              <AssistantMessage
                message={{
                  id: "thinking",
                  role: "assistant",
                  content: "",
                  createdAt: new Date()
                }}
                isThinking={true}
              />
            )}
            <div className="min-h-6 min-w-6 shrink-0" />
          </>
        )}
      </div>

      {showScrollButton && (
        <TooltipIconButton
          tooltip="Scroll to bottom"
          variant="outline"
          className="dark:bg-background dark:hover:bg-accent absolute bottom-24 z-10 left-1/2 transform -translate-x-1/2 rounded-full p-2 shadow-lg border"
          onClick={scrollToBottom}
        >
          <ArrowDownIcon className="h-4 w-4" />
        </TooltipIconButton>
      )}

      <div data-tutorial="chat-composer">
        <Composer
          onSend={onSendMessage}
          onCancel={onCancel}
          isRunning={isRunning}
        />
      </div>
    </div>
  );
};

