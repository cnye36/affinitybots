"use client";

import { useState, useEffect, useCallback } from "react";
import { ThreadSidebar } from "./ThreadSidebar";
import { ChatInterface } from "./ChatInterface";
import { useToastHook } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import axios from "axios";

interface AssistantChatProps {
  assistantId: string;
}

interface Thread {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
}

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  created_at: string;
}

export function AgentChat({ assistantId }: AssistantChatProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToastHook();

  // Fetch threads on mount
  const fetchThreads = useCallback(async () => {
    try {
      const response = await axios.get(
        `/api/assistants/${assistantId}/threads`
      );
      setThreads(response.data);
      if (response.data.length > 0 && !activeThread) {
        setActiveThread(response.data[0].id);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load threads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [assistantId, activeThread, toast]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Fetch messages when active thread changes
  useEffect(() => {
    if (activeThread) {
      fetchMessages(activeThread);
    } else {
      setMessages([]);
    }
  }, [activeThread]);

  const fetchMessages = async (threadId: string) => {
    try {
      const response = await axios.get(
        `/api/assistants/${assistantId}/threads/${threadId}/messages`
      );
      setMessages(response.data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  const createNewThread = async () => {
    try {
      const response = await axios.post(
        `/api/assistants/${assistantId}/threads`
      );
      const newThread = response.data;
      setThreads([newThread, ...threads]);
      setActiveThread(newThread.id);
    } catch {
      toast({
        title: "Error",
        description: "Failed to create new thread",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (content: string) => {
    if (!activeThread) return;

    try {
      const response = await axios.post(
        `/api/assistants/${assistantId}/threads/${activeThread}/messages`,
        { content }
      );

      const { messages: newMessages } = response.data;
      setMessages((prev) => [...prev, ...newMessages]);
    } catch {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full">
      <ThreadSidebar
        threads={threads}
        activeThread={activeThread}
        onThreadSelect={setActiveThread}
        onNewThread={createNewThread}
      />
      <div className="flex-1">
        {activeThread ? (
          <ChatInterface messages={messages} onSendMessage={sendMessage} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Button onClick={createNewThread}>Start New Chat</Button>
          </div>
        )}
      </div>
    </div>
  );
}
