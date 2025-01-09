"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Plus, MoreVertical, Pencil, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

interface ChatThread {
  id: string;
  title: string;
  created_at: string;
  last_message?: string;
}

interface ChatThreadsProps {
  agentId: string;
  currentThreadId?: string;
  onThreadSelect: (threadId: string) => void;
  onNewThread: () => void;
}

export function ChatThreads({
  agentId,
  currentThreadId,
  onThreadSelect,
  onNewThread,
}: ChatThreadsProps) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [threadToRename, setThreadToRename] = useState<ChatThread | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const loadThreads = useCallback(async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}/threads`);
      if (!response.ok) throw new Error("Failed to load chat threads");
      const data = await response.json();
      setThreads(data.threads);
    } catch (error) {
      console.error("Error loading threads:", error);
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  // Load threads initially
  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // Subscribe to thread updates
  useEffect(() => {
    const channel = supabase
      .channel("chat_threads_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_threads",
          filter: `agent_id=eq.${agentId}`,
        },
        () => {
          loadThreads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId, loadThreads]);

  const handleNewThread = () => {
    // Clear current thread selection first
    onThreadSelect("");
    // Then trigger new thread creation
    onNewThread();
  };

  const handleThreadSelect = (threadId: string) => {
    if (threadId !== currentThreadId) {
      onThreadSelect(threadId);
    }
  };

  const handleRename = async (thread: ChatThread) => {
    setThreadToRename(thread);
    setNewTitle(thread.title);
    setRenameDialogOpen(true);
  };

  const handleRenameSubmit = async () => {
    if (!threadToRename || !newTitle.trim()) return;

    try {
      const response = await fetch(
        `/api/agents/${agentId}/threads/${threadToRename.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTitle }),
        }
      );

      if (!response.ok) throw new Error("Failed to rename thread");

      setThreads(
        threads.map((t) =>
          t.id === threadToRename.id ? { ...t, title: newTitle } : t
        )
      );
      setRenameDialogOpen(false);
    } catch (error) {
      console.error("Error renaming thread:", error);
    }
  };

  const handleDelete = async (threadId: string) => {
    if (!confirm("Are you sure you want to delete this conversation?")) return;

    try {
      const response = await fetch(
        `/api/agents/${agentId}/threads/${threadId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete thread");

      setThreads(threads.filter((t) => t.id !== threadId));
      if (currentThreadId === threadId) {
        handleNewThread();
      }
    } catch (error) {
      console.error("Error deleting thread:", error);
    }
  };

  return (
    <div className="w-80 border-r flex flex-col min-h-0 bg-background">
      <div className="flex-shrink-0 p-4 border-b">
        <Button
          variant="secondary"
          className="w-full justify-start"
          onClick={handleNewThread}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {threads.map((thread) => (
            <div
              key={thread.id}
              className={cn(
                "group flex items-center gap-2 rounded-lg",
                currentThreadId === thread.id && "bg-secondary"
              )}
            >
              <Button
                variant="ghost"
                className="flex-1 justify-start text-left h-auto py-3"
                onClick={() => handleThreadSelect(thread.id)}
              >
                <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                <div className="truncate">
                  <div className="font-medium truncate">{thread.title}</div>
                </div>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 relative z-50"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-50">
                  <DropdownMenuItem onClick={() => handleRename(thread)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(thread.id)}
                    className="text-destructive"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
          {isLoading && (
            <div className="text-sm text-muted-foreground text-center py-4">
              Loading conversations...
            </div>
          )}
          {!isLoading && threads.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No conversations yet
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter new title"
            />
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleRenameSubmit}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
