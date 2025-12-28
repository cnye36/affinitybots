"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Assistant } from "@/types/assistant";
import { cn } from "@/lib/utils";

interface AgentSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assistant: Assistant) => void | Promise<void>;
  assistants: Assistant[];
  loading: boolean;
  onCreateAgent?: () => void;
  highlightAssistantId?: string;
}

export function AgentSelectModal({
  isOpen,
  onClose,
  onSelect,
  assistants,
  loading,
  onCreateAgent,
  highlightAssistantId,
}: AgentSelectModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-xl">Select an Agent</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCreateAgent?.()}
              disabled={!onCreateAgent}
              aria-label="Create new agent"
              title="Create new agent"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="h-[500px] -mx-6">
            <div className="px-6 space-y-3">
              {assistants
                .filter((assistant) => assistant?.assistant_id && assistant?.name)
                .map((assistant: Assistant) => {
                  const name = assistant.name || "Unnamed Agent"
                  const nameLength = name.length || 0
                  return (
                    <Button
                      key={assistant.assistant_id}
                      variant="outline"
                      className={cn(
                        "w-full justify-start px-4 py-3 h-auto transition-all hover:bg-accent hover:shadow-sm group",
                        highlightAssistantId === assistant.assistant_id &&
                          "border-primary bg-primary/5"
                      )}
                      data-highlighted={
                        highlightAssistantId === assistant.assistant_id || undefined
                      }
                      onClick={() => onSelect(assistant)}
                    >
                      <div className="flex items-start gap-4 w-full">
                        <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-background">
                          <AvatarImage
                            src={assistant.metadata?.agent_avatar || ""}
                            alt={name}
                          />
                          <AvatarFallback
                            style={{
                              backgroundColor: `hsl(${
                                (nameLength * 30) % 360
                              }, 70%, 50%)`,
                            }}
                            className="text-base font-medium text-white"
                          >
                            {name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start text-left flex-1 min-w-0 py-1">
                          <span className="font-semibold text-base group-hover:text-primary">
                            {name}
                          </span>
                          {assistant.metadata?.description && (
                            <p className="text-sm text-muted-foreground mt-1 break-words whitespace-normal pr-4">
                              {String(assistant.metadata.description)}
                            </p>
                          )}
                        </div>
                      </div>
                    </Button>
                  )
                })}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
