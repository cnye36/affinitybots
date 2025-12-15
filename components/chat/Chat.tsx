"use client";

import { useStream } from "@langchain/langgraph-sdk/react";
import { Thread } from "@/components/chat/Thread";
import type { ChatMessage } from "@/components/chat/types";
import { useRef, useEffect } from "react";

export function Chat({ assistantId, threadId, onThreadId }: { assistantId: string, threadId?: string | null, onThreadId?: (id: string) => void }) {
  // Resolve relative base to absolute URL to avoid URL constructor errors in SDK
  const base = process.env.NEXT_PUBLIC_LANGGRAPH_PROXY_BASE || "/api/chat";
  const resolvedApiUrl =
    typeof window !== "undefined" && base.startsWith("/")
      ? `${window.location.origin}${base}`
      : base;

  const hasTitledRef = useRef<Set<string>>(new Set());
  const renameRequestedRef = useRef<boolean>(false);
  const renameTextRef = useRef<string | null>(null);
  const lastThreadIdRef = useRef<string | null>(null);
  const pendingFirstMessageRef = useRef<string | null>(null);

  // Auto-generate title for new threads after first user message
  const generateTitleForThread = async (threadId: string, userMessage: string) => {
    if (!threadId || hasTitledRef.current.has(threadId)) {
      console.log("Skipping title generation:", { threadId, hasThreadId: !!threadId, alreadyTitled: hasTitledRef.current.has(threadId) });
      return;
    }

    try {
      hasTitledRef.current.add(threadId);
      console.log("Generating title for thread:", { threadId, assistantId, userMessage: userMessage.substring(0, 50) });

      const url = `/api/agents/${assistantId}/threads/${threadId}/rename`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation: userMessage,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Successfully generated title for thread:", { threadId, title: result.title });
        // Dispatch event to refresh sidebar
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("threads:refresh"));
        }
      } else {
        const errorText = await response.text();
        console.error("Failed to generate title for thread:", { threadId, status: response.status, error: errorText });
        // Remove from titled set so we can retry
        hasTitledRef.current.delete(threadId);
      }
    } catch (error) {
      console.error("Error generating title:", { threadId, error: error instanceof Error ? error.message : String(error) });
      hasTitledRef.current.delete(threadId);
    }
  };

  // Track thread changes to reset titling state
  useEffect(() => {
    if (threadId && threadId !== lastThreadIdRef.current) {
      lastThreadIdRef.current = threadId;
      // Don't clear pendingFirstMessageRef here for new threads - we need it for title generation
      // Only clear if we're switching to an existing thread
      if (hasTitledRef.current.has(threadId)) {
        pendingFirstMessageRef.current = null;
      }
    }
  }, [threadId]);

  const thread = useStream<{ messages: any[] }>({
    apiUrl: resolvedApiUrl,
    assistantId,
    messagesKey: "messages",
    reconnectOnMount: true,
    threadId: threadId ?? undefined,
    onThreadId: (newThreadId) => {
      onThreadId?.(newThreadId);
      
      // Generate title immediately when a new thread is created and we have a pending message
      if (newThreadId && pendingFirstMessageRef.current && !hasTitledRef.current.has(newThreadId)) {
        console.log("New thread created, generating title:", newThreadId, pendingFirstMessageRef.current);
        // Small delay to ensure thread is fully created before updating metadata
        setTimeout(() => {
          if (pendingFirstMessageRef.current) {
            generateTitleForThread(newThreadId, pendingFirstMessageRef.current);
            pendingFirstMessageRef.current = null;
          }
        }, 1000);
      }
    },
  });

  // Map SDK messages to our UI message type
  const uiMessages: ChatMessage[] = (thread.messages as any[])
    .filter((m) => m.type === "human" || m.type === "ai" || m.type === "tool")
    .map((m, idx) => ({
      id: m.id || `m-${idx}`,
      role: m.type === "human" ? "user" : "assistant",
      content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      createdAt: new Date(),
    }));

  
  const handleSend = (text: string) => {
    const newMessage = { type: "human" as const, content: text };
    const isFirstMessage = uiMessages.length === 0;

    thread.submit(
      { messages: [newMessage] },
      {
        streamResumable: true,
        // Do not pass a synthetic threadId; allow server to assign to prevent 409
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

    // Store the first message for potential title generation
    if (isFirstMessage) {
      pendingFirstMessageRef.current = text;
    }
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
    </div>
  );
}
