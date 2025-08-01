import { AgentState } from "@/types/langgraph";
import { useEffect, useRef, useState, ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import AttachmentCard from "./AttachmentCard";
import { useThreadAttachments } from "@/hooks/useThreadAttachments";

interface MessageListProps {
  messages: AgentState["messages"];
  agentAvatar?: string;
  userAvatar?: string;
  userInitials?: string;
  agentInitials?: string;
  isThinking?: boolean;
  threadId?: string;
}

export default function MessageList({
  messages,
  agentAvatar,
  userAvatar,
  userInitials = "U",
  agentInitials = "A",
  isThinking,
  threadId,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { attachments, getThumbnailUrl } = useThreadAttachments(threadId);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const copyToClipboard = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const components = {
    code(props: ComponentPropsWithoutRef<"code"> & { inline?: boolean }) {
      const { inline, className, children } = props;
      const match = /language-(\w+)/.exec(className || "");
      const code = String(children).replace(/\n$/, "");

      if (!inline && match) {
        return (
          <div className="relative group">
            <button
              onClick={() => copyToClipboard(code)}
              className="absolute right-2 top-2 p-2 rounded bg-gray-800 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Copy code"
            >
              {copiedCode === code ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            <SyntaxHighlighter
              {...props}
              style={oneDark}
              language={match[1]}
              PreTag="div"
              className="rounded-md !mt-0"
            >
              {code}
            </SyntaxHighlighter>
          </div>
        );
      }
      return (
        <code
          className="rounded bg-gray-200 dark:bg-gray-800 px-1 py-0.5"
          {...props}
        >
          {children}
        </code>
      );
    },
  };

  return (
    <div
      className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-4 sm:space-y-6 min-h-0"
      aria-live="polite"
    >
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">
          Start a conversation by typing a message below.
        </div>
      ) : (
        messages.map((message, index) => {
          const isUser = message instanceof HumanMessage;
          const isLastUserMessage = isUser && index === messages.length - 1;
          
          // Get attachments for the current message (only show on the last user message)
          const messageAttachments = isLastUserMessage ? attachments : [];
          
          return (
            <div key={index} className="space-y-2">
              {/* Attachment cards (show above the last user message) */}
              {messageAttachments.length > 0 && (
                <div className="flex justify-end">
                  <div className="max-w-[90%] sm:max-w-[85%] space-y-2">
                    {messageAttachments.map((attachment) => (
                      <AttachmentCard
                        key={attachment.id}
                        fileName={attachment.original_filename}
                        fileSize={attachment.file_size}
                        attachmentType={attachment.attachment_type}
                        processingStatus={attachment.processing_status}
                        thumbnailUrl={getThumbnailUrl(attachment)}
                        className="ml-auto"
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* The actual message */}
              <div
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                {/* Avatar */}
                {!isUser && (
                  <div className="flex-shrink-0 mr-2">
                    <Avatar className="h-8 w-8">
                      {agentAvatar ? (
                        <AvatarImage src={agentAvatar} alt="Agent" />
                      ) : (
                        <AvatarFallback>{agentInitials}</AvatarFallback>
                      )}
                    </Avatar>
                  </div>
                )}
                <div
                  className={`max-w-[90%] sm:max-w-[85%] rounded-lg px-3 sm:px-4 py-2 sm:py-3 shadow-sm text-sm sm:text-base ${
                    isUser
                      ? "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                      : "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600"
                  }`}
                  role="document"
                  aria-label={isUser ? "User message" : "Assistant message"}
                >
                  <div
                    className={`prose dark:prose-invert prose-sm sm:prose-base max-w-none [&_pre]:!mt-0 [&_pre]:!mb-0 [&_p]:!mt-0 [&_p]:!mb-2 last:[&_p]:!mb-0`}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={components}
                    >
                      {message.content.toString()}
                    </ReactMarkdown>
                  </div>
                </div>
                {/* User Avatar */}
                {isUser && (
                  <div className="flex-shrink-0 ml-2">
                    <Avatar className="h-8 w-8">
                      {userAvatar ? (
                        <AvatarImage src={userAvatar} alt="User" />
                      ) : (
                        <AvatarFallback>{userInitials}</AvatarFallback>
                      )}
                    </Avatar>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
      {/* Thinking indicator */}
      {isThinking && (
        <div className="flex justify-start">
          <div className="flex-shrink-0 mr-2">
            <Avatar className="h-8 w-8">
              {agentAvatar ? (
                <AvatarImage src={agentAvatar} alt="Agent" />
              ) : (
                <AvatarFallback>{agentInitials}</AvatarFallback>
              )}
            </Avatar>
          </div>
          <div className="max-w-[85%] rounded-lg px-3 py-2 shadow-sm text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center">
            <span className="italic text-gray-500 dark:text-gray-400">
              Thinking…
            </span>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
