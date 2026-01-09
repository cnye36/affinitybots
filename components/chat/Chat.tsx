"use client";

import { useStream } from "@langchain/langgraph-sdk/react";
import { Thread } from "@/components/chat/Thread";
import type { ChatMessage } from "@/components/chat/types";
import { useRef, useEffect, useState, useMemo } from "react";
import { saveToolApproval } from "@/lib/toolApproval";
import { createBrowserClient } from "@supabase/ssr";

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

  // Tool approval state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentUserId(data.user.id);
      }
    });
  }, []);

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
  const allMessages = thread.messages as any[];

  // Log ALL messages to see the full flow
  console.log("[CHAT] All messages from thread:", allMessages.map((m, i) => ({
    index: i,
    type: m.type,
    id: m.id,
    hasToolCalls: !!(m.tool_calls && m.tool_calls.length > 0),
    toolCallsCount: m.tool_calls?.length || 0,
    isToolMessage: m.type === "tool",
    toolCallId: m.tool_call_id,
  })));

  // Create a map of tool results by tool_call_id
  const toolResultsMap = new Map<string, any>();
  allMessages
    .filter((m) => m.type === "tool")
    .forEach((toolMsg) => {
      if (toolMsg.tool_call_id) {
        toolResultsMap.set(toolMsg.tool_call_id, toolMsg.content);
      }
    });

  const uiMessages: ChatMessage[] = allMessages
    .filter((m) => m.type === "human" || m.type === "ai")
    .map((m, idx) => {
      // Log full message structure for AI messages to debug reasoning tokens
      if (m.type === "ai") {
        console.log("[CHAT] AI Message Structure:", {
          messageId: m.id || `m-${idx}`,
          allKeys: Object.keys(m),
          fullMessage: JSON.stringify(m, null, 2),
          hasReasoningContent: !!m.reasoning_content,
          hasResponseMetadata: !!m.response_metadata,
          responseMetadataKeys: m.response_metadata ? Object.keys(m.response_metadata) : [],
          responseMetadata: m.response_metadata ? JSON.stringify(m.response_metadata, null, 2) : null,
          hasToolCalls: !!(m.tool_calls || m.additional_kwargs?.tool_calls),
          toolCalls: m.tool_calls || m.additional_kwargs?.tool_calls,
        });
      }

      // Extract tool calls from AI messages
      let toolCalls: any[] | undefined;
      if (m.type === "ai") {
        const rawToolCalls = m.tool_calls || m.additional_kwargs?.tool_calls;

        // Only log if there are actually tool calls to see
        if (rawToolCalls && rawToolCalls.length > 0) {
          console.log("[CHAT] FOUND MESSAGE WITH TOOL CALLS:", {
            messageId: m.id || `m-${idx}`,
            toolCallsCount: rawToolCalls.length,
            rawToolCalls: JSON.stringify(rawToolCalls, null, 2),
            toolResultsAvailable: Array.from(toolResultsMap.keys()),
          });
        }

        if (rawToolCalls && Array.isArray(rawToolCalls) && rawToolCalls.length > 0) {
          toolCalls = rawToolCalls.map((tc: any) => ({
            id: tc.id,
            name: tc.name || tc.function?.name,
            args: tc.args || tc.function?.arguments,
            arguments: tc.args || tc.function?.arguments,
            // Try to find the result from tool messages
            result: tc.id ? toolResultsMap.get(tc.id) : undefined,
          }));
          console.log("[CHAT] Successfully extracted tool calls for UI:", toolCalls);
        }
      }

      return {
        id: m.id || `m-${idx}`,
        role: m.type === "human" ? "user" : "assistant",
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
        createdAt: new Date(),
        // Extract reasoning from response metadata (for models like o1/o3)
        reasoning: m.type === "ai" ? (
          m.reasoning_content ||
          m.response_metadata?.reasoning_content ||
          m.response_metadata?.reasoning ||
          m.reasoning ||
          undefined
        ) : undefined,
        toolCalls,
      };
    });

  
  const handleSend = (text: string, attachments: any[], webSearchEnabled: boolean) => {
    const newMessage = { type: "human" as const, content: text };
    const isFirstMessage = uiMessages.length === 0;

    thread.submit(
      { messages: [newMessage] },
      {
        streamResumable: true,
        // Request full message data including tool_calls
        streamMode: ["messages", "messages-tuple"],
        // Do not pass a synthetic threadId; allow server to assign to prevent 409
        ...(threadId ? { threadId } : {}),
        // Add metadata for thread creation
        metadata: {
          assistant_id: assistantId,
        },
        config: {
          configurable: {
            web_search_enabled: webSearchEnabled,
          },
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

  // Handle tool approval
  const handleToolApproval = async (
    approvedTools: any[],
    approvalType: "once" | "always-tool" | "always-integration"
  ) => {
    if (!currentUserId) return;

    // Save approval preferences if needed
    if (approvalType === "always-tool") {
      for (const tool of approvedTools) {
        await saveToolApproval(currentUserId, assistantId, "tool", tool.name);
      }
    } else if (approvalType === "always-integration") {
      // Get unique MCP servers from approved tools
      const mcpServers = Array.from(new Set(approvedTools.map(t => t.mcpServer).filter(Boolean)));
      for (const server of mcpServers) {
        await saveToolApproval(currentUserId, assistantId, "integration", server);
      }
    }

    // Submit resume command
    thread.submit(null, {
      command: {
        resume: {
          approved: approvedTools.map(t => t.id),
        },
      },
    });
  };

  // Handle tool denial
  const handleToolDenial = () => {
    // Resume with denial
    thread.submit(null, {
      command: {
        resume: {
          approved: [],
        },
      },
    });
  };

  // Add approval message if there's an interrupt
  const displayMessages = useMemo(() => {
    const messages = [...uiMessages];

    // Log interrupt state for debugging
    console.log("[CHAT] Interrupt state:", {
      hasInterrupt: !!thread.interrupt,
      interrupt: thread.interrupt,
      interruptKeys: thread.interrupt ? Object.keys(thread.interrupt) : [],
    });

    // Check if there's an interrupt requiring approval
    if (thread.interrupt) {
      // Try different ways the tool calls might be structured
      let toolCalls: any[] = [];

      if (Array.isArray(thread.interrupt.value)) {
        toolCalls = thread.interrupt.value;
      } else if (thread.interrupt.value && typeof thread.interrupt.value === "object") {
        // Tool calls might be nested
        if (Array.isArray((thread.interrupt.value as any).tool_calls)) {
          toolCalls = (thread.interrupt.value as any).tool_calls;
        } else if ((thread.interrupt.value as any).messages) {
          // Extract from messages
          const lastMessage = Array.isArray((thread.interrupt.value as any).messages)
            ? (thread.interrupt.value as any).messages[(thread.interrupt.value as any).messages.length - 1]
            : null;
          if (lastMessage && Array.isArray(lastMessage.tool_calls)) {
            toolCalls = lastMessage.tool_calls;
          }
        }
      }

      if (toolCalls.length > 0) {
        console.log("[CHAT] Interrupt detected with tool calls:", toolCalls);

        messages.push({
          id: "approval-pending",
          role: "approval" as const,
          content: "",
          createdAt: new Date(),
          pendingApproval: {
            toolCalls,
            onApprove: handleToolApproval,
            onDeny: handleToolDenial,
          },
        });
      }
    }

    return messages;
  }, [uiMessages, thread.interrupt]);
  

  return (
    <div className="bg-background flex h-full flex-col relative" style={{ ["--thread-max-width" as string]: "48rem", ["--thread-padding-x" as string]: "1rem" }}>
      <div className="flex-1 overflow-hidden">
        <Thread
          messages={displayMessages}
          isRunning={thread.isLoading}
          onSendMessage={(content, attachments, webSearchEnabled) => handleSend(content, attachments, webSearchEnabled)}
          onCancel={() => thread.stop()}
        />
      </div>
    </div>
  );
}
