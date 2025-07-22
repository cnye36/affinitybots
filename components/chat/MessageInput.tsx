"use client";

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 200) + "px";
    }
  }, [message]);

  // Automatically focus the input when it becomes enabled
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "44px";
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t dark:border-gray-700 p-2 sm:p-4 bg-background"
    >
      <div className="flex items-end space-x-2 max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift + Enter for new line)"
            className="w-full resize-none rounded-lg border dark:border-gray-800 p-2 sm:p-3 pr-10 sm:pr-12 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 scrollbar-none"
            style={{
              minHeight: "40px",
              maxHeight: "160px",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
            disabled={disabled}
          />
          <button
            type="submit"
            disabled={!message.trim() || disabled}
            className="absolute right-1.5 sm:right-2 bottom-1.5 sm:bottom-2 p-1.5 sm:p-2 text-blue-500 hover:text-blue-600 disabled:opacity-50 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            aria-label="Send message"
          >
            <Send className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>
    </form>
  );
}
