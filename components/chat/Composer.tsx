"use client";

import { useState, useRef, useEffect, type FC, type KeyboardEvent } from "react";
import { ArrowUpIcon, Square, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AttachmentComposer } from "./attachments/AttachmentComposer";
import { useAttachments } from "./attachments/useAttachments";
import { TooltipIconButton } from "./TooltipIconButton";

interface ComposerProps {
  onSend: (content: string, attachments: any[], webSearchEnabled: boolean) => void;
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
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
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

    onSend(trimmedInput, attachments, webSearchEnabled);
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
    <div className="bg-background relative mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-2 px-[var(--thread-padding-x)] pb-4 md:pb-6" data-tutorial="agent-composer">
      <div className="focus-within:ring-offset-2 relative flex w-full items-center gap-2 rounded-full focus-within:ring-2 focus-within:ring-blue-500 dark:focus-within:ring-blue-500 bg-muted border-border dark:border-muted-foreground/15 border px-4 py-2">
        <TooltipIconButton
          className={`size-8 p-2 transition-all flex-shrink-0 ${
            webSearchEnabled
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "hover:bg-accent"
          }`}
          tooltip={webSearchEnabled ? "Web search enabled" : "Enable web search"}
          variant="ghost"
          onClick={() => setWebSearchEnabled(!webSearchEnabled)}
          aria-label="Toggle web search"
          data-tutorial="web-search-toggle"
        >
          <Globe className={webSearchEnabled ? "size-4" : "size-4 opacity-70"} />
        </TooltipIconButton>

        <AttachmentComposer
          attachments={attachments}
          onAddAttachment={addAttachment}
          onRemoveAttachment={removeAttachment}
        />

        <textarea
          ref={textareaRef}
          placeholder="Send a message..."
          className="bg-transparent placeholder:text-muted-foreground placeholder:text-left flex-1 resize-none text-base outline-none max-h-[120px] min-h-[24px] text-left align-top"
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoFocus
          aria-label="Message input"
        />

        {!isRunning ? (
          <Button
            type="submit"
            variant="default"
            className="dark:border-muted-foreground/90 border-muted-foreground/60 hover:bg-primary/75 size-8 rounded-full border flex-shrink-0"
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
            className="dark:border-muted-foreground/90 border-muted-foreground/60 hover:bg-primary/75 size-8 rounded-full border flex-shrink-0"
            aria-label="Stop generating"
            onClick={handleCancel}
          >
            <Square className="size-3.5 fill-white dark:size-4 dark:fill-black" />
          </Button>
        )}
      </div>
    </div>
  );
};

