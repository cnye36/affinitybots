import { Button } from "@/components/ui/button";
import { Assistant } from "@langchain/langgraph-sdk";

interface ChatHeaderProps {
  assistant: Assistant;
  onConfigureClick: () => void;
}

export function ChatHeader({ assistant, onConfigureClick }: ChatHeaderProps) {
  return (
    <header className="border-b p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div
            className="h-10 w-10 rounded-full ring-2 ring-background flex items-center justify-center text-sm font-medium text-white"
            style={{
              backgroundColor: `hsl(${
                (assistant.name.length * 30) % 360
              }, 70%, 50%)`,
            }}
          >
            {assistant.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">{assistant.name}</h1>
            <p className="text-sm text-muted-foreground">
              {assistant.metadata.description}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={onConfigureClick}>
          Configure
        </Button>
      </div>
    </header>
  );
}
