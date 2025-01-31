import { Message } from "@langchain/langgraph-sdk";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
}

export function ChatContainer({
  messages = [],
  isLoading,
  onSendMessage,
}: ChatContainerProps) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Start a conversation by typing a message below.
          </div>
        ) : (
          messages.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              content={message.content}
            />
          ))
        )}
      </div>
      <ChatInput onSubmit={onSendMessage} disabled={isLoading} />
    </div>
  );
}
