"use client";

import {
  useState,
  useRef,
  useEffect,
  FormEvent,
  KeyboardEvent,
} from "react";
import { Send, Paperclip, X } from "lucide-react";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      // reset to allow same file reselect
      e.target.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (disabled || (!message.trim() && files.length === 0)) return;

    let finalMessage = message.trim();

    if (files.length > 0) {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch("/api/chat-files", {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            if (data.url) {
              finalMessage += `\n[${file.name}](${data.url})`;
            }
          }
        } catch (err) {
          console.error("File upload failed", err);
        }
      }
    }

    if (finalMessage) {
      onSend(finalMessage);
    }

    setMessage("");
    setFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
      textareaRef.current.focus();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
            disabled={(!message.trim() && files.length === 0) || disabled}
            className="absolute right-1.5 sm:right-2 bottom-1.5 sm:bottom-2 p-1.5 sm:p-2 text-blue-500 hover:text-blue-600 disabled:opacity-50 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            aria-label="Send message"
          >
            <Send className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="chat-file-input"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="absolute right-10 bottom-1.5 sm:right-11 sm:bottom-2 p-1.5 sm:p-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
            aria-label="Attach file"
          >
            <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center bg-muted rounded px-2 py-1 text-sm"
            >
              <span className="mr-1 truncate max-w-[10rem]">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
