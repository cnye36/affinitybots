"use client";

import { motion } from "framer-motion";
import { useState, type FC } from "react";
import { CopyIcon, CheckIcon } from "lucide-react";
import { TooltipIconButton } from "./TooltipIconButton";
import { AttachmentUI } from "./attachments/AttachmentUI";
import type { Message as MessageType } from "@/hooks/useLangGraphChat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MessageProps {
  message: MessageType;
  isThinking?: boolean;
}

const StarIcon = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 0L9.79611 6.20389L16 8L9.79611 9.79611L8 16L6.20389 9.79611L0 8L6.20389 6.20389L8 0Z"
      fill="currentColor"
    />
  </svg>
);

const CopyButton: FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <TooltipIconButton tooltip="Copy" onClick={handleCopy}>
      {copied ? <CheckIcon /> : <CopyIcon />}
    </TooltipIconButton>
  );
};

export const UserMessage: FC<MessageProps> = ({ message }) => {
  return (
    <div className="w-full flex justify-end px-[var(--thread-padding-x)] py-4">
      <motion.div
        className="max-w-[80%] flex flex-col items-end gap-3"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role="user"
      >
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex w-full flex-row gap-3 justify-end">
            {message.attachments.map((attachment) => (
              <AttachmentUI key={attachment.id} attachment={attachment} />
            ))}
          </div>
        )}

        <div className="bg-muted text-foreground rounded-3xl px-5 py-2.5 break-words">
          {message.content}
        </div>
      </motion.div>
    </div>
  );
};

export const AssistantMessage: FC<MessageProps> = ({ message, isThinking = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Filter out attachment placeholders and empty content
  const shouldShowContent = (text: string) => {
    if (!text || typeof text !== "string") return false;
    if (text.startsWith("<attachment ")) return false;
    const trimmed = text.trim();
    if (trimmed === "{}" || trimmed === "[]" || trimmed === "null") return false;
    return true;
  };

  const hasContent = shouldShowContent(message.content);

  // Thinking animation component
  const ThinkingDots = () => {
    const dotVariants = {
      animate: {
        y: ["0%", "-100%", "0%"],
        scale: [1, 1.2, 1],
        transition: {
          duration: 0.6,
          ease: "easeOut",
          repeat: Infinity,
        },
      },
    };

    return (
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground font-medium">Thinking</span>
        <div className="flex items-center gap-1">
          <motion.div
            variants={dotVariants}
            animate="animate"
            className="w-2 h-2 bg-blue-500 rounded-full"
          />
          <motion.div
            variants={dotVariants}
            animate="animate"
            transition={{ ...dotVariants.animate.transition, delay: 0.2 }}
            className="w-2 h-2 bg-blue-500 rounded-full"
          />
          <motion.div
            variants={dotVariants}
            animate="animate"
            transition={{ ...dotVariants.animate.transition, delay: 0.4 }}
            className="w-2 h-2 bg-blue-500 rounded-full"
          />
        </div>
      </div>
    );
  };

  return (
    <motion.div
      className="relative mx-auto grid w-full max-w-[var(--thread-max-width)] grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] px-[var(--thread-padding-x)] py-4"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      data-role="assistant"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cn(
        "bg-background col-start-1 row-start-1 flex size-8 shrink-0 items-center justify-center rounded-full ring-1",
        isThinking 
          ? "ring-blue-500 bg-blue-50 dark:bg-blue-950" 
          : "ring-border"
      )}>
        <StarIcon size={14} />
      </div>

      <div className="text-foreground col-span-2 col-start-2 row-start-1 ml-4 leading-7 break-words">
        {isThinking && !hasContent ? (
          <ThinkingDots />
        ) : hasContent ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            className="prose dark:prose-invert max-w-none"
            components={{
              h1: ({ className, ...props }) => (
                <h1 className={cn("mb-8 scroll-m-20 text-4xl font-extrabold tracking-tight last:mb-0", className)} {...props} />
              ),
              h2: ({ className, ...props }) => (
                <h2 className={cn("mb-4 mt-8 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0 last:mb-0", className)} {...props} />
              ),
              h3: ({ className, ...props }) => (
                <h3 className={cn("mb-4 mt-6 scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0 last:mb-0", className)} {...props} />
              ),
              p: ({ className, ...props }) => (
                <p className={cn("mb-5 mt-5 leading-7 first:mt-0 last:mb-0", className)} {...props} />
              ),
              a: ({ className, ...props }) => (
                <a className={cn("text-primary font-medium underline underline-offset-4", className)} {...props} />
              ),
              ul: ({ className, ...props }) => (
                <ul className={cn("my-5 ml-6 list-disc [&>li]:mt-2", className)} {...props} />
              ),
              ol: ({ className, ...props }) => (
                <ol className={cn("my-5 ml-6 list-decimal [&>li]:mt-2", className)} {...props} />
              ),
              code: ({ className, inline, ...props }: any) => (
                <code
                  className={cn(
                    inline ? "bg-muted rounded border px-1 py-0.5 font-mono text-sm" : "block",
                    className
                  )}
                  {...props}
                />
              ),
              pre: ({ className, ...props }) => (
                <pre className={cn("bg-muted rounded-lg p-4 overflow-x-auto my-4", className)} {...props} />
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        ) : null}
      </div>

      {isHovered && hasContent && (
        <div
          className="text-muted-foreground col-start-3 row-start-2 mt-3 ml-3 flex gap-1"
        >
          <CopyButton text={message.content} />
        </div>
      )}
    </motion.div>
  );
};

