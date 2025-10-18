"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface Attachment {
  id: string;
  type: "image" | "document";
  name: string;
  file?: File;
  content?: Array<{ type: string; image?: string; text?: string }>;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
  createdAt: Date;
}

export interface ChatState {
  threadId: string | null;
  messages: Message[];
  isRunning: boolean;
  error: string | null;
}

interface UseLangGraphChatOptions {
  assistantId: string;
  onThreadCreated?: (threadId: string) => void;
}

export function useLangGraphChat({ assistantId, onThreadCreated }: UseLangGraphChatOptions) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasAutoTitledRef = useRef<boolean>(false);
  const renameAbortRef = useRef<AbortController | null>(null);

  // Create a new thread
  const createThread = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort("timeout"), 15000);
      
      const res = await fetch(`/api/agents/${assistantId}/threads`, {
        method: "POST",
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to create thread: ${res.status} ${text}`);
      }
      
      const json = await res.json();
      setThreadId(json.thread_id);
      hasAutoTitledRef.current = false;
      onThreadCreated?.(json.thread_id);

      // Sidebar refresh will be triggered after title generation completes
      // No need to refresh immediately since thread won't have a proper title yet

      return json.thread_id;
    } catch (err) {
      console.error("Failed to create thread:", err);
      setError(err instanceof Error ? err.message : "Failed to create thread");
      return null;
    }
  }, [assistantId, onThreadCreated]);

  // Load thread state
  const loadThread = useCallback(async (targetThreadId: string) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort("timeout"), 15000);
      
      const res = await fetch(`/api/agents/${assistantId}/threads/${targetThreadId}/state`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      if (!res.ok) {
        throw new Error(`Failed to load thread: ${res.status}`);
      }
      
      const state = await res.json();
      const threadMessages = state.values?.messages || [];
      
      // Convert LangGraph messages to our format
      // Filter out system messages (internal context like knowledge base) - only show human and ai messages
      const convertedMessages: Message[] = threadMessages
        .filter((msg: any) => msg.type === "human" || msg.type === "ai")
        .map((msg: any, index: number) => ({
          id: msg.id || `msg-${index}`,
          role: msg.type === "human" ? "user" : "assistant",
          content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
          createdAt: new Date(),
        }));
      
      setThreadId(targetThreadId);
      setMessages(convertedMessages);
      hasAutoTitledRef.current = convertedMessages.length > 0;
      setError(null);
    } catch (err) {
      console.error("Failed to load thread:", err);
      setError(err instanceof Error ? err.message : "Failed to load thread");
    }
  }, [assistantId]);

  // Switch to a new thread
  const switchToNewThread = useCallback(async () => {
    setMessages([]);
    setThreadId(null);
    setError(null);
    hasAutoTitledRef.current = false;
    await createThread();
  }, [createThread]);

  // Switch to existing thread
  const switchToThread = useCallback(async (targetThreadId: string) => {
    await loadThread(targetThreadId);
  }, [loadThread]);

  // Auto-title logic with retry mechanism
  const triggerAutoTitle = useCallback((firstUserText: string, targetThreadId?: string, retryCount = 0) => {
    const effectiveThreadId = targetThreadId || threadId;
    console.log("triggerAutoTitle called:", { effectiveThreadId, hasAutoTitled: hasAutoTitledRef.current, retryCount, firstUserText: firstUserText?.slice(0, 50) });

    if (!effectiveThreadId) {
      console.log("No threadId, skipping title generation");
      return;
    }
    
    if (hasAutoTitledRef.current) {
      console.log("Already titled, skipping title generation");
      return;
    }
    
    const maxRetries = 2;
    const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s
    
    try {
      // Abort any previous rename request
      if (renameAbortRef.current) {
        renameAbortRef.current.abort("superseded");
      }
      
      const controller = new AbortController();
      renameAbortRef.current = controller;
      const timeout = setTimeout(() => controller.abort("timeout"), 10000);

      // Set the flag only after starting the request
      hasAutoTitledRef.current = true;
      console.log("Starting title generation request...");

      fetch(`/api/agents/${assistantId}/threads/${effectiveThreadId}/rename`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation: firstUserText.slice(0, 160) }),
        signal: controller.signal,
      })
        .then((response) => {
          console.log("Title generation response:", response.status, response.ok);
          if (!response.ok) {
            throw new Error(`Title generation failed: ${response.status}`);
          }
          console.log("Title generation successful!");
          if (typeof window !== "undefined") {
            // Single refresh after title generation completes
            // Delay slightly to ensure LangGraph has persisted the update
            setTimeout(() => {
              console.log("Dispatching threads:refresh event (after title generation)");
              window.dispatchEvent(new CustomEvent("threads:refresh"));
            }, 500);
          }
        })
        .catch((err) => {
          if (err?.name !== "AbortError") {
            console.error("Auto-title generation failed:", err);
            
            // Retry logic
            if (retryCount < maxRetries) {
              console.log(`Retrying title generation in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries + 1})`);
              hasAutoTitledRef.current = false;
              setTimeout(() => {
                triggerAutoTitle(firstUserText, effectiveThreadId, retryCount + 1);
              }, retryDelay);
            } else {
              console.error("Auto-title generation failed after all retries");
              hasAutoTitledRef.current = false;
            }
          }
        })
        .finally(() => {
          clearTimeout(timeout);
          if (renameAbortRef.current === controller) {
            renameAbortRef.current = null;
          }
        });
    } catch (err) {
      console.error("Auto-title scheduling failed:", err);
      // Reset the flag on failure to allow retry
      hasAutoTitledRef.current = false;
    }
  }, [assistantId, threadId]);

  // Send a message with streaming
  const sendMessage = useCallback(async (content: string, attachments?: Attachment[]) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return;
    
    try {
      setIsRunning(true);
      setError(null);
      
      // Create thread if needed
      let currentThreadId = threadId;
      if (!currentThreadId) {
        currentThreadId = await createThread();
        if (!currentThreadId) {
          throw new Error("Failed to create thread");
        }
      }
      
      // Build message content with attachments
      let messageContent: any = content;
      if (attachments && attachments.length > 0) {
        messageContent = [{ type: "text", text: content }];
        
        for (const attachment of attachments) {
          if (attachment.content) {
            messageContent.push(...attachment.content);
          }
        }
      }
      
      // Add user message to UI immediately
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        attachments,
        createdAt: new Date(),
      };
      
      setMessages((prev) => {
        const newMessages = [...prev, userMessage];

        // Trigger auto-title for first message in thread (regardless of when thread was created)
        if (prev.length === 0) {
          console.log("First message detected, triggering auto-title");
          // Trigger title generation after a short delay to ensure thread is set
          setTimeout(() => {
            triggerAutoTitle(content, currentThreadId);
          }, 100);
        }

        return newMessages;
      });

      // Set up a fallback check to ensure title is generated for first message
      if (messages.length === 0) {
        setTimeout(() => {
          // Check if thread still needs a title after 5 seconds
          if (currentThreadId && !hasAutoTitledRef.current) {
            console.log("Fallback: Retrying title generation for thread", currentThreadId);
            triggerAutoTitle(content, currentThreadId);
          }
        }, 5000);
      }

      // Sidebar refresh is handled by title generation success
      // No need to refresh here as title generation will trigger the refresh
      
      // Prepare streaming request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      
      // Send messages in application format (role: "user"/"assistant")
      // The API will convert them to LangGraph format (type: "human"/"ai")
      const messagesToSend = [
        ...messages,
        {
          role: "user",
          content: messageContent,
        },
      ];
      
      const response = await fetch(`/api/agents/${assistantId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: currentThreadId,
          messages: messagesToSend,
        }),
        signal: abortController.signal,
      });
      
      if (!response.ok || !response.body) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`Failed to send message: ${response.status} ${errorText}`);
      }
      
      // Stream the response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const assistantMessageId = `assistant-${Date.now()}`;
      let currentContent = "";
      let hasAddedMessage = false;
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Split on newline and process complete JSON objects
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const parsed = JSON.parse(line);
            const eventName = parsed.event || "";
            const data = parsed.data;
            
            // Handle message streaming events from LangGraph
            // streamMode: ["messages-tuple"] sends: messages-tuple/partial (streaming) and messages-tuple/complete
            // streamMode: ["messages"] sends: messages/partial (streaming) and messages/complete
            if (eventName.includes("message")) {
              
              // Handle messages-tuple format: data is [message, metadata]
              let messagesToProcess = [];
              if (eventName.includes("tuple")) {
                // messages-tuple format: data is [message, metadata]
                if (Array.isArray(data) && data.length > 0) {
                  const msg = data[0]; // First element is the message
                  messagesToProcess = Array.isArray(msg) ? msg : [msg];
                }
              } else {
                // Standard messages format: data is array of messages or single message
                messagesToProcess = Array.isArray(data) ? data : [data];
              }
              
              // Find the LAST AI message in the array (most recent)
              let aiMessage = null;
              for (let i = messagesToProcess.length - 1; i >= 0; i--) {
                const msg = messagesToProcess[i];
                if (msg && (msg.type === "ai" || msg.type === "assistant" || msg.role === "assistant")) {
                  aiMessage = msg;
                  break;
                }
              }
              
              if (aiMessage) {
                // Extract content chunk from this event
                let contentChunk = "";
                if (typeof aiMessage.content === "string") {
                  contentChunk = aiMessage.content;
                } else if (Array.isArray(aiMessage.content)) {
                  contentChunk = aiMessage.content
                    .filter((c: any) => c.type === "text" || typeof c === "string")
                    .map((c: any) => typeof c === "string" ? c : c.text || "")
                    .join("");
                }
                
                // ACCUMULATE content instead of replacing
                currentContent += contentChunk;
                
                if (!hasAddedMessage) {
                  // Add the message for the first time (even if content is empty initially)
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: assistantMessageId,
                      role: "assistant",
                      content: currentContent,
                      createdAt: new Date(),
                    },
                  ]);
                  hasAddedMessage = true;
                } else {
                  // Update the existing message with accumulated content
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: currentContent }
                        : m
                    )
                  );
                }
              }
            }
          } catch (error) {
            console.warn("Failed to parse event line:", line, error);
          }
        }
      }
      
      // Process any remaining data in buffer
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer);
          // Process final event if needed
        } catch {}
      }
      
      // Ensure assistant message was added with content
      if (!hasAddedMessage && currentContent) {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMessageId,
            role: "assistant",
            content: currentContent,
            createdAt: new Date(),
          },
        ]);
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        console.log("Message sending cancelled");
      } else {
        console.error("Failed to send message:", err);
        setError(err instanceof Error ? err.message : "Failed to send message");
      }
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  }, [assistantId, threadId, messages, createThread, triggerAutoTitle]);

  // Cancel streaming
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsRunning(false);
  }, []);

  return {
    threadId,
    messages,
    isRunning,
    error,
    sendMessage,
    cancel,
    switchToNewThread,
    switchToThread,
    triggerAutoTitle, // Expose for manual triggering if needed
  };
}

