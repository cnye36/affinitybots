"use client";

import { useState, useRef, useEffect, type FC, type KeyboardEvent } from "react";
import { ArrowUpIcon, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AttachmentComposer } from "./attachments/AttachmentComposer";
import { useAttachments } from "./attachments/useAttachments";

interface ComposerProps {
  onSend: (content: string, attachments: any[]) => void;
  onCancel?: () => void;
  isRunning: boolean;
  disabled?: boolean;
}

export const Composer: FC<ComposerProps> = ({
  onSend,
  onCancel,
  isRunning,
  disabled = false,
}) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { attachments, addAttachment, removeAttachment, clearAttachments } = useAttachments();

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [input]);

  const handleSend = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput && attachments.length === 0) return;
    if (disabled || isRunning) return;

    onSend(trimmedInput, attachments);
    setInput("");
    clearAttachments();
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCancel = () => {
    onCancel?.();
  };

  return (
    <div className="bg-background relative mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 px-[var(--thread-padding-x)] pb-4 md:pb-6" data-tutorial="agent-composer">
      <div className="focus-within:ring-offset-2 relative flex w-full flex-col rounded-2xl focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-white">
        <textarea
          ref={textareaRef}
          placeholder="Send a message..."
          className="bg-muted border-border dark:border-muted-foreground/15 focus:outline-primary placeholder:text-muted-foreground max-h-[calc(50dvh)] min-h-16 w-full resize-none rounded-t-2xl border-x border-t px-4 pt-2 pb-3 text-base outline-none"
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoFocus
          aria-label="Message input"
        />
        
        <div className="bg-muted border-border dark:border-muted-foreground/15 relative flex items-center justify-between rounded-b-2xl border-x border-b p-2" data-tutorial="agent-attachments">
          <AttachmentComposer
            attachments={attachments}
            onAddAttachment={addAttachment}
            onRemoveAttachment={removeAttachment}
          />

          {!isRunning ? (
            <Button
              type="submit"
              variant="default"
              className="dark:border-muted-foreground/90 border-muted-foreground/60 hover:bg-primary/75 size-8 rounded-full border"
              aria-label="Send message"
              onClick={handleSend}
              disabled={disabled || (!input.trim() && attachments.length === 0)}
            >
              <ArrowUpIcon className="size-5" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="default"
              className="dark:border-muted-foreground/90 border-muted-foreground/60 hover:bg-primary/75 size-8 rounded-full border"
              aria-label="Stop generating"
              onClick={handleCancel}
            >
              <Square className="size-3.5 fill-white dark:size-4 dark:fill-black" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

