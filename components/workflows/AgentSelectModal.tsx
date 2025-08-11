import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Agent } from "@/types/agent";
import { Assistant } from "@/types/assistant";

interface AgentSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assistant: Assistant) => void | Promise<void>;
  assistants: Assistant[];
  loading: boolean;
}

export function AgentSelectModal({
  isOpen,
  onClose,
  onSelect,
  assistants,
  loading,
}: AgentSelectModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">Select an Agent</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="h-[500px] -mx-6">
            <div className="px-6 space-y-3">
              {assistants.map((assistant: Assistant) => (
                <Button
                  key={assistant.assistant_id}
                  variant="outline"
                  className="w-full justify-start px-4 py-3 h-auto transition-all hover:bg-accent hover:shadow-sm group"
                  onClick={() => onSelect(assistant)}
                >
                  <div className="flex items-start gap-4 w-full">
                    <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-background">
                      <AvatarImage
                        src={assistant.metadata.agent_avatar || ""}
                        alt={assistant.name}
                      />
                      <AvatarFallback
                        style={{
                          backgroundColor: `hsl(${
                            (assistant.name.length * 30) % 360
                          }, 70%, 50%)`,
                        }}
                        className="text-base font-medium text-white"
                      >
                        {assistant.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left flex-1 min-w-0 py-1">
                      <span className="font-semibold text-base group-hover:text-primary">
                        {assistant.name}
                      </span>
                      {assistant.metadata.description && (
                        <p className="text-sm text-muted-foreground mt-1 break-words whitespace-normal pr-4">
                          {String(assistant.metadata.description)}
                        </p>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
