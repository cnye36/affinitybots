import { Button } from "@/components/ui/button";
import { Thread } from "@langchain/langgraph-sdk";

interface ChatSidebarProps {
  threads: Thread[];
  activeThreadId: string | null;
  isLoading: boolean;
  onNewChat: () => void;
  onThreadSelect: (threadId: string) => void;
}

export function ChatSidebar({
  threads,
  activeThreadId,
  isLoading,
  onNewChat,
  onThreadSelect,
}: ChatSidebarProps) {
  return (
    <div className="w-64 border-r bg-background p-4">
      <div className="space-y-2">
        <Button className="w-full" onClick={onNewChat} disabled={isLoading}>
          New Chat
        </Button>
        <div className="space-y-1">
          {threads.map((thread) => (
            <Button
              key={thread.id}
              variant={thread.id === activeThreadId ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => onThreadSelect(thread.id)}
            >
              Chat {new Date(thread.created_at).toLocaleDateString()}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
