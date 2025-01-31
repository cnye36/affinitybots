import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div
      className={`flex gap-3 p-4 ${
        role === "assistant" ? "bg-secondary/50" : ""
      }`}
    >
      <div
        className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium text-white ${
          role === "assistant" ? "bg-primary" : "bg-blue-500"
        }`}
      >
        {role === "assistant" ? "AI" : "U"}
      </div>
      <div className="flex-1 prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown
          components={{
            code({ inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <SyntaxHighlighter
                  {...props}
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code {...props} className={className}>
                  {children}
                </code>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
