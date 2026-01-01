"use client";

import { motion } from "framer-motion";
import { useState, type FC } from "react";
import { CopyIcon, CheckIcon } from "lucide-react";
import { TooltipIconButton } from "./TooltipIconButton";
import { AttachmentUI } from "./attachments/AttachmentUI";
import type { ChatMessage as MessageType } from "@/components/chat/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { cn } from "@/lib/utils";
import { ReasoningDisplay } from "./ReasoningDisplay";
import { WebSearchResults, extractWebSearchResults } from "./WebSearchResults";

interface MessageProps {
  message: MessageType;
  isThinking?: boolean;
}

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

async function downloadUrl(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const fileName = (() => {
    try {
      const u = new URL(url);
      const last = u.pathname.split("/").filter(Boolean).pop();
      return last ? last.split("?")[0] : "image.png";
    } catch {
      return "image.png";
    }
  })();

  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

const MarkdownImage: FC<{ src?: string; alt?: string }> = ({ src, alt }) => {
  const [downloading, setDownloading] = useState(false);

  if (!src) return null;

  return (
    <div className="my-4">
      <div className="flex justify-center">
        <div className="overflow-hidden rounded-xl border bg-muted/20 w-full max-w-[520px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt || "Generated image"}
          className="w-full h-auto block"
          style={{ maxHeight: 520, objectFit: "contain" }}
        />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          className="text-xs rounded-md border px-2 py-1 hover:bg-accent disabled:opacity-50"
          disabled={downloading}
          onClick={async () => {
            try {
              setDownloading(true);
              await downloadUrl(src);
            } catch (e) {
              console.error("Download failed:", e);
            } finally {
              setDownloading(false);
            }
          }}
        >
          {downloading ? "Downloading…" : "Download"}
        </button>
        <a
          className="text-xs text-muted-foreground underline underline-offset-4"
          href={src}
          target="_blank"
          rel="noreferrer"
        >
          Open in new tab
        </a>
      </div>
    </div>
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
  
  // Extract web search results from content
  const { cleanedContent, hasWebSearch } = extractWebSearchResults(message.content);

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
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <motion.div
            variants={dotVariants}
            animate="animate"
            transition={{ ...dotVariants.animate.transition, delay: 0.2 }}
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <motion.div
            variants={dotVariants}
            animate="animate"
            transition={{ ...dotVariants.animate.transition, delay: 0.4 }}
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    );
  };

  return (
    <motion.div
      className="relative mx-auto w-full max-w-[var(--thread-max-width)] px-[var(--thread-padding-x)] py-4"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      data-role="assistant"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="text-foreground text-base leading-7 break-words">
        {isThinking && !hasContent ? (
          <ThinkingDots />
        ) : hasContent ? (
          <>
            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  h1: ({ className, children, ...props }) => (
                    <h1 className={cn("mb-4 mt-6 text-2xl font-bold text-foreground first:mt-0", className)} {...props}>
                      {children}
                    </h1>
                  ),
                  h2: ({ className, children, ...props }) => (
                    <h2 className={cn("mb-3 mt-5 text-xl font-semibold text-foreground first:mt-0", className)} {...props}>
                      {children}
                    </h2>
                  ),
                  h3: ({ className, children, ...props }) => (
                    <h3 className={cn("mb-3 mt-4 text-lg font-semibold text-foreground first:mt-0", className)} {...props}>
                      {children}
                    </h3>
                  ),
                  h4: ({ className, children, ...props }) => (
                    <h4 className={cn("mb-2 mt-4 text-base font-semibold text-foreground first:mt-0", className)} {...props}>
                      {children}
                    </h4>
                  ),
                  h5: ({ className, children, ...props }) => (
                    <h5 className={cn("mb-2 mt-3 text-base font-semibold text-foreground first:mt-0", className)} {...props}>
                      {children}
                    </h5>
                  ),
                  h6: ({ className, children, ...props }) => (
                    <h6 className={cn("mb-2 mt-3 text-sm font-semibold text-foreground first:mt-0", className)} {...props}>
                      {children}
                    </h6>
                  ),
                  p: ({ className, children, ...props }) => (
                    <p className={cn("mb-4 text-base leading-7 text-foreground first:mt-0 last:mb-0", className)} {...props}>
                      {children}
                    </p>
                  ),
                  a: ({ className, children, ...props }) => (
                    <a className={cn("text-primary font-medium underline underline-offset-4 hover:text-primary/80", className)} {...props}>
                      {children}
                    </a>
                  ),
                  img: ({ ...props }) => (
                    <MarkdownImage src={(props as any).src} alt={(props as any).alt} />
                  ),
                  ul: ({ className, children, ...props }) => (
                    <ul className={cn("my-4 ml-6 list-disc space-y-1", className)} {...props}>
                      {children}
                    </ul>
                  ),
                  ol: ({ className, children, ...props }) => (
                    <ol className={cn("my-4 ml-6 list-decimal space-y-1", className)} {...props}>
                      {children}
                    </ol>
                  ),
                  li: ({ className, children, ...props }) => (
                    <li className={cn("text-base leading-7 text-foreground", className)} {...props}>
                      {children}
                    </li>
                  ),
                  blockquote: ({ className, children, ...props }) => (
                    <blockquote className={cn("my-4 border-l-4 border-muted-foreground/30 pl-4 italic text-base text-muted-foreground", className)} {...props}>
                      {children}
                    </blockquote>
                  ),
                  hr: ({ className, ...props }) => (
                    <hr className={cn("my-6 border-border", className)} {...props} />
                  ),
                  code: ({ className, inline, children, ...props }: any) => {
                    if (inline) {
                      return (
                        <code
                          className={cn("bg-muted rounded border px-1.5 py-0.5 font-mono text-sm text-foreground", className)}
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code
                        className={cn("block bg-muted rounded-lg p-3 font-mono text-sm text-foreground overflow-x-auto", className)}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  pre: ({ className, children, ...props }) => (
                    <pre className={cn("bg-muted rounded-lg p-4 overflow-x-auto my-4 text-sm", className)} {...props}>
                      {children}
                    </pre>
                  ),
                  table: ({ className, children, ...props }) => (
                    <div className="my-4 overflow-x-auto">
                      <table className={cn("w-full border-collapse border border-border", className)} {...props}>
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ className, children, ...props }) => (
                    <th className={cn("border border-border px-4 py-2 text-left font-semibold bg-muted text-base", className)} {...props}>
                      {children}
                    </th>
                  ),
                  td: ({ className, children, ...props }) => (
                    <td className={cn("border border-border px-4 py-2 text-base", className)} {...props}>
                      {children}
                    </td>
                  ),
                  strong: ({ className, children, ...props }) => (
                    <strong className={cn("font-semibold text-foreground", className)} {...props}>
                      {children}
                    </strong>
                  ),
                  em: ({ className, children, ...props }) => (
                    <em className={cn("italic text-foreground", className)} {...props}>
                      {children}
                    </em>
                  ),
                }}
              >
                {cleanedContent}
              </ReactMarkdown>
            </div>
            {message.reasoning && <ReasoningDisplay reasoning={message.reasoning} />}
            {hasWebSearch && <WebSearchResults content={message.content} />}
          </>
        ) : null}
      </div>

      {isHovered && hasContent && (
        <div
          className="text-muted-foreground absolute right-2 top-2 flex gap-1"
        >
          <CopyButton text={message.content} />
        </div>
      )}
    </motion.div>
  );
};

