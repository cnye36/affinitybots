import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Assistant } from "@/types/index";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface AgentSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assistant: Assistant) => void;
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select an Agent</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {assistants.map((assistant) => (
                <Button
                  key={assistant.assistant_id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onSelect(assistant)}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{assistant.name}</span>
                    {assistant.metadata?.description && (
                      <span className="text-xs text-muted-foreground line-clamp-2">
                        {assistant.metadata.description}
                      </span>
                    )}
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
