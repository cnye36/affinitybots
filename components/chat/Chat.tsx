"use client";

import { useStream } from "@langchain/langgraph-sdk/react";
import { Thread } from "@/components/chat/Thread";
import type { ChatMessage } from "@/components/chat/types";
import { Message } from "@langchain/langgraph-sdk";
import { useRef } from "react";

export function Chat({ assistantId, threadId, onThreadId }: { assistantId: string, threadId?: string | null, onThreadId?: (id: string) => void }) {
  // Resolve relative base to absolute URL to avoid URL constructor errors in SDK
  const base = process.env.NEXT_PUBLIC_LANGGRAPH_PROXY_BASE || "/api/chat";
  const resolvedApiUrl =
    typeof window !== "undefined" && base.startsWith("/")
      ? `${window.location.origin}${base}`
      : base;

  // Refs used to ensure we title ONLY the newly created thread
  const firstUserTextRef = useRef<string | null>(null);
  const createdThreadIdRef = useRef<string | null>(threadId || null);
  const didAutonameRef = useRef<boolean>(false);

  const thread = useStream<{ messages: any[] }>({
    apiUrl: resolvedApiUrl,
    assistantId,
    messagesKey: "messages",
    reconnectOnMount: true,
    threadId: threadId ?? undefined,
    onThreadId: (newThreadId) => {
      createdThreadIdRef.current = newThreadId;
      onThreadId?.(newThreadId);
      // Trigger sidebar refresh when a new thread is created
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("threads:refresh"));
        }, 500);
      }
    },
    onFinish: async () => {
      const text = firstUserTextRef.current?.trim();
      const newId = createdThreadIdRef.current;
      if (!didAutonameRef.current && !threadId && text && newId) {
        try {
          didAutonameRef.current = true;
          const res = await fetch(`/api/threads/${newId}/autoname`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversation: text.slice(0, 160) }),
          });
          if (!res.ok) {
            console.warn("autoname failed", res.status);
          } else if (typeof window !== "undefined") {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent("threads:refresh"));
            }, 300);
          }
        } catch (e) {
          console.error("autoname error", e);
        } finally {
          firstUserTextRef.current = null;
        }
      }
    },
  });

  // Map SDK messages to our UI message type
  const uiMessages: ChatMessage[] = (thread.messages as any[])
    .filter((m) => m.type === "human" || m.type === "ai")
    .map((m, idx) => ({
      id: m.id || `m-${idx}`,
      role: m.type === "human" ? "user" : "assistant",
      content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      createdAt: new Date(),
    }));

  const handleSend = (text: string) => {
    const newMessage = { type: "human" as const, content: text };

    // Capture first user text for brand-new threads so we can autoname on finish
    const isFirstInView = (thread.messages as any[]).length === 0;
    if (!threadId && isFirstInView) {
      firstUserTextRef.current = text;
      didAutonameRef.current = false;
    }
    thread.submit(
      { messages: [newMessage] },
      {
        streamResumable: true,
        ...(threadId ? { threadId } : {}),
        // Add metadata for thread creation
        metadata: {
          assistant_id: assistantId,
        },
        optimisticValues(prev) {
          const prevMessages = (prev as any).messages ?? [];
          const newMessages = [...prevMessages, newMessage];
          return { ...(prev as any), messages: newMessages } as any;
        },
      }
    );
  };
  

  return (
    <div className="bg-background flex h-full flex-col relative" style={{ ["--thread-max-width" as string]: "48rem", ["--thread-padding-x" as string]: "1rem" }}>
      <div className="flex-1 overflow-hidden">
        <Thread
          messages={uiMessages}
          isRunning={thread.isLoading}
          onSendMessage={(content) => handleSend(content)}
          onCancel={() => thread.stop()}
        />
      </div>
      {/* Composer is rendered inside Thread; keep here if needed */}
    </div>
  );
}


