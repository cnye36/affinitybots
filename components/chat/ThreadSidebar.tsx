import { useEffect, useCallback, useState } from "react";
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

interface Thread {
  thread_id: string;
  created_at: string;
  metadata: {
    user_id: string;
    assistant_id: string;
    title?: string;
  };
}

interface ThreadSidebarProps {
  assistantId: string;
  currentThreadId?: string;
  onThreadSelect: (threadId: string) => void;
  onNewThread: () => void;
}

export default function ThreadSidebar({
  assistantId,
  currentThreadId,
  onThreadSelect,
  onNewThread,
}: ThreadSidebarProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [threadToRename, setThreadToRename] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const fetchThreads = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/assistants/${assistantId}/threads`);
      if (!response.ok) throw new Error("Failed to fetch threads");
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
    } finally {
      setIsLoading(false);
    }
  }, [assistantId]);

  // Initial fetch
  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Refresh when currentThreadId changes
  useEffect(() => {
    if (currentThreadId) {
      fetchThreads();
    }
  }, [currentThreadId, fetchThreads]);

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
    setNewTitle(thread?.metadata?.title || "");
    setIsRenaming(true);
  };

  const handleSaveRename = async () => {
    if (!threadToRename || !newTitle.trim()) return;

    try {
      const response = await fetch(
        `/api/assistants/${assistantId}/threads/${threadToRename}/rename`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: newTitle.trim() }),
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
      setIsRenaming(false);
      setThreadToRename(null);
      setNewTitle("");
    }
  };

  const handleDelete = async (threadId: string) => {
    if (!confirm("Are you sure you want to delete this thread?")) return;

    try {
      const response = await fetch(
        `/api/assistants/${assistantId}/threads/${threadId}`,
        {
          method: "DELETE",
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
    }
  };

  return (
    <div className="w-72 h-full bg-background border-r border-gray-700 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onNewThread}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <PlusCircle className="h-5 w-5" />
          <span>New Chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span>Loading chats...</span>
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">No chats yet</p>
            <p className="text-sm text-gray-400">Start a new conversation</p>
          </div>
        ) : (
          <div className="space-y-1">
            {threads.map((thread) => (
              <div
                key={`thread-${thread.thread_id}`}
                className={`group flex items-center gap-2 w-full pr-2 rounded-lg transition-colors ${
                  currentThreadId === thread.thread_id
                    ? "bg-blue-100 dark:bg-blue-900/50"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <button
                  onClick={() => onThreadSelect(thread.thread_id)}
                  className="flex-1 px-3 py-2 text-left"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {thread.metadata?.title ||
                        `Chat ${formatDate(thread.created_at)}`}
                    </span>
                  </div>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleRename(thread.thread_id)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 dark:text-red-400"
                      onClick={() => handleDelete(thread.thread_id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={isRenaming}
        onOpenChange={(open) => !open && setIsRenaming(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter new title"
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenaming(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
