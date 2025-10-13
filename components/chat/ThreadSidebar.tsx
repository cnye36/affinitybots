import { useEffect, useCallback, useState, useImperativeHandle, forwardRef } from "react";
import {
  PlusCircle,
  MessageSquare,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Thread } from "@langchain/langgraph-sdk";

interface ThreadSidebarProps {
  assistantId: string;
  currentThreadId?: string;
  onThreadSelect: (threadId: string) => void;
  onNewThread: () => void;
  refreshTrigger?: number; // Add this prop to trigger refreshes
}

export interface ThreadSidebarRef {
  refreshThreads: () => void;
}

const ThreadSidebar = forwardRef<ThreadSidebarRef, ThreadSidebarProps>(({
  assistantId,
  currentThreadId,
  onThreadSelect,
  onNewThread,
  refreshTrigger,
}, ref) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [threadToRename, setThreadToRename] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const fetchThreads = useCallback(async () => {
    setIsLoading(true);
    let timeout: any;
    try {
      const controller = new AbortController();
      timeout = setTimeout(() => controller.abort("timeout"), 15000);
      const response = await fetch(`/api/agents/${assistantId}/threads`, { signal: controller.signal });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Thread fetch failed:", response.status, errorText);
        throw new Error(`Failed to fetch threads: ${response.status}`);
      }
      const data = await response.json();
      const validThreads = Array.isArray(data.threads)
        ? data.threads.filter(
            (thread: Thread) =>
              thread &&
              thread.thread_id &&
              thread.metadata?.assistant_id === assistantId
          )
        : [];
      setThreads(validThreads);
    } catch (error) {
      console.error("Error fetching threads:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch threads");
      // Keep existing threads if available, don't clear them on error
      // This prevents the UI from showing "No chats yet" when there's a network error
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
    }
  }, [assistantId]);

  // Expose the refresh method to parent component
  useImperativeHandle(ref, () => ({
    refreshThreads: fetchThreads,
  }));

  // Initial fetch when component mounts or assistantId changes
  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Refresh when refreshTrigger prop changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      fetchThreads();
    }
  }, [refreshTrigger, fetchThreads]);

  // Listen for global refresh events triggered after auto-title
  useEffect(() => {
    const handler = () => fetchThreads();
    if (typeof window !== "undefined") {
      window.addEventListener("threads:refresh", handler as EventListener);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("threads:refresh", handler as EventListener);
      }
    };
  }, [fetchThreads]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    }
  };

  const handleRename = async (threadId: string) => {
    const thread = threads.find((t) => t.thread_id === threadId);
    setThreadToRename(threadId);
    setNewTitle(thread?.metadata?.title as string || "");
    setIsRenaming(true);
  };

  const handleSaveRename = async () => {
    if (!threadToRename || !newTitle.trim()) return;

    let timeout: any;
    try {
      const controller = new AbortController();
      timeout = setTimeout(() => controller.abort("timeout"), 10000);
      const response = await fetch(
        `/api/agents/${assistantId}/threads/${threadToRename}/rename`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: newTitle.trim() }),
          signal: controller.signal,
        }
      );

      if (!response.ok) throw new Error("Failed to rename thread");

      setThreads((prevThreads) =>
        prevThreads.map((thread) =>
          thread.thread_id === threadToRename
            ? {
                ...thread,
                metadata: {
                  ...thread.metadata,
                  title: newTitle.trim(),
                },
              }
            : thread
        )
      );
    } catch (error) {
      console.error("Error renaming thread:", error);
    } finally {
      clearTimeout(timeout);
      setIsRenaming(false);
      setThreadToRename(null);
      setNewTitle("");
    }
  };

  const handleDelete = async (threadId: string) => {
    if (!confirm("Are you sure you want to delete this thread?")) return;

    let timeout: any;
    try {
      const controller = new AbortController();
      timeout = setTimeout(() => controller.abort("timeout"), 10000);
      const response = await fetch(
        `/api/agents/${assistantId}/threads/${threadId}`,
        {
          method: "DELETE",
          signal: controller.signal,
        }
      );

      if (!response.ok) throw new Error("Failed to delete thread");

      setThreads((prevThreads) =>
        prevThreads.filter((t) => t.thread_id !== threadId)
      );
      if (currentThreadId === threadId) {
        onNewThread();
      }
    } catch (error) {
      console.error("Error deleting thread:", error);
    } finally {
      clearTimeout(timeout);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-2 sm:p-4 border-b" data-tutorial="agent-new-chat">
        <Button
          onClick={onNewThread}
          className="w-full py-2 px-3 sm:px-4 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border hover:border-border/80 rounded-lg flex items-center justify-center gap-2 transition-all text-sm sm:text-base shadow-sm"
        >
          <PlusCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>New Chat</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>Loading chats...</span>
          </div>
        ) : error ? (
          <div className="text-center py-6 px-2">
            <MessageSquare className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Connection error</p>
            <p className="text-xs text-muted-foreground/70 mb-2">
              {error}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setError(null);
                fetchThreads();
              }}
            >
              Retry
            </Button>
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-6 px-2">
            <MessageSquare className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No chats yet</p>
            <p className="text-xs text-muted-foreground/70">
              Start a new conversation
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {threads.map((thread) => (
              <div
                key={`thread-${thread.thread_id}`}
                className={`group flex items-center w-full rounded-lg transition-colors ${
                  currentThreadId === thread.thread_id
                    ? "bg-accent"
                    : "hover:bg-accent/50"
                }`}
              >
                <button
                  onClick={() => onThreadSelect(thread.thread_id)}
                  className="flex-1 px-2 py-1.5 text-left min-w-0"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate text-sm">
                      {(thread.metadata?.title as string) ||
                        `Chat ${formatDate(thread.created_at)}`}
                    </span>
                  </div>
                </button>
                <div className="flex-shrink-0 px-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent/50">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                      <DropdownMenuItem
                        onClick={() => handleRename(thread.thread_id)}
                        className="text-sm"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive text-sm"
                        onClick={() => handleDelete(thread.thread_id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isRenaming} onOpenChange={setIsRenaming}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full text-sm"
              placeholder="Enter chat title"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRenaming(false)}
              className="text-sm"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveRename} className="text-sm">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

ThreadSidebar.displayName = "ThreadSidebar";

export default ThreadSidebar;

