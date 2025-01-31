import { KeyboardEvent, useRef, useState, ChangeEvent } from "react";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSubmit, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSubmit(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t p-4">
      <div className="flex space-x-4">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            setMessage(e.target.value)
          }
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={disabled}
          className="flex-1 min-h-[44px] max-h-[200px] resize-none"
        />
        <button
          onClick={handleSubmit}
          disabled={!message.trim() || disabled}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}
