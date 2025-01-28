"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { PlusCircle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Thread {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
}

interface ThreadSidebarProps {
  threads: Thread[];
  activeThread: string | null;
  onThreadSelect: (threadId: string) => void;
  onNewThread: () => void;
}

export function ThreadSidebar({
  threads,
  activeThread,
  onThreadSelect,
  onNewThread,
}: ThreadSidebarProps) {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/50">
      <div className="p-4">
        <Button
          variant="secondary"
          className="w-full justify-start gap-2"
          onClick={onNewThread}
        >
          <PlusCircle className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-2 p-2">
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => onThreadSelect(thread.id)}
              className={cn(
                "flex w-full flex-col items-start rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
                activeThread === thread.id && "bg-accent"
              )}
            >
              <div className="flex w-full items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="flex-1 truncate text-left">
                  {thread.title || "New Chat"}
                </span>
              </div>
              <span className="mt-1 text-xs text-muted-foreground">
                {format(new Date(thread.updated_at), "MMM d, h:mm a")}
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
