import { AgentState } from "@/types/langgraph";
import { useEffect, useRef, useState, ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

interface MessageListProps {
  messages: AgentState["messages"];
}

export default function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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
        messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message instanceof HumanMessage ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[90%] sm:max-w-[85%] rounded-lg px-3 sm:px-4 py-2 sm:py-3 shadow-sm text-sm sm:text-base ${
                message instanceof AIMessage
                  ? "bg-blue-200 dark:bg-blue-600"
                  : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
              }`}
              role="document"
              aria-label={
                message instanceof HumanMessage
                  ? "User message"
                  : "Assistant message"
              }
            >
              <div
                className={`prose dark:prose-invert prose-sm sm:prose-base ${
                  message instanceof HumanMessage
                    ? "prose-white"
                    : "prose-gray dark:prose-gray-light"
                } max-w-none [&_pre]:!mt-0 [&_pre]:!mb-0 [&_p]:!mt-0 [&_p]:!mb-2 last:[&_p]:!mb-0`}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    ...components,
                    code(
                      props: ComponentPropsWithoutRef<"code"> & {
                        inline?: boolean;
                      }
                    ) {
                      const { inline, className, children } = props;
                      const match = /language-(\w+)/.exec(className || "");
                      const code = String(children).replace(/\n$/, "");

                      if (!inline && match) {
                        return (
                          <div className="relative group">
                            <button
                              onClick={() => copyToClipboard(code)}
                              className="absolute right-1 sm:right-2 top-1 sm:top-2 p-1.5 sm:p-2 rounded bg-gray-800 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Copy code"
                            >
                              {copiedCode === code ? (
                                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              )}
                            </button>
                            <SyntaxHighlighter
                              {...props}
                              style={oneDark}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-md text-xs sm:text-sm !mt-0 !mb-0"
                              customStyle={{
                                padding: "0.75rem",
                                margin: 0,
                              }}
                            >
                              {code}
                            </SyntaxHighlighter>
                          </div>
                        );
                      }
                      return (
                        <code
                          className="rounded bg-gray-200 dark:bg-gray-800 px-1 py-0.5 text-sm sm:text-base"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {message.content.toString()}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
