import { Assistant } from "@/types/index";
import { Card } from "@/components/ui/card";
import Image from "next/image";

interface AgentSidebarProps {
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  assistants: Assistant[];
  loading: boolean;
  error: string | null;
}

export function AgentSidebar({
  isOpen,
  onMouseEnter,
  onMouseLeave,
  assistants = [],
  loading,
  error,
}: AgentSidebarProps) {
  const onDragStart = (event: React.DragEvent, assistant: Assistant) => {
    event.dataTransfer.setData("application/reactflow", assistant.assistant_id);
    event.dataTransfer.effectAllowed = "move";
  };

  if (!isOpen) return null;

  return (
    <div
      className="absolute right-0 top-0 h-full w-64 bg-background border-l p-4 transition-transform duration-200 ease-in-out z-10"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <h3 className="font-semibold mb-4">Available Assistants</h3>
      {loading ? (
        <div className="text-sm text-muted-foreground">
          Loading assistants...
        </div>
      ) : error ? (
        <div className="text-sm text-red-500">{error}</div>
      ) : assistants.length === 0 ? (
        <div className="text-sm text-muted-foreground">No assistants found</div>
      ) : (
        <div className="space-y-2">
          {assistants.map((assistant) => (
            <Card
              key={assistant.assistant_id}
              className="p-3 cursor-move hover:shadow-md transition-shadow"
              draggable
              onDragStart={(e) => onDragStart(e, assistant)}
            >
              <div className="flex items-center gap-2">
                {assistant.config?.configurable?.avatar ? (
                  <Image
                    src={assistant.config.configurable.avatar}
                    alt={assistant.name}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                    style={{
                      backgroundColor: `hsl(${
                        (assistant.name.length * 30) % 360
                      }, 70%, 50%)`,
                    }}
                  >
                    {assistant.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {assistant.name}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
