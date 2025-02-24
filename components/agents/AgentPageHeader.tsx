"use client";

import { Assistant } from "@/types/langgraph";
import { AgentConfigButton } from "@/components/configuration/AgentConfigButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

interface AgentPageHeaderProps {
  assistant: Assistant;
}

export function AgentPageHeader({ assistant }: AgentPageHeaderProps) {
  const router = useRouter();
  // Get first letter of assistant name for avatar fallback
  const avatarFallback = assistant.name.charAt(0).toUpperCase();

  const avatarUrl = assistant.config?.configurable.avatar;

  return (
    <div className="flex-none border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Agents
          </Button>
          <div className="flex items-center gap-2">
            <Avatar className="h-12 w-12">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={assistant.name} />
              ) : (
                <AvatarFallback
                  className="bg-primary/10"
                  style={{
                    backgroundColor: `hsl(${
                      (assistant.name.length * 30) % 360
                    }, 70%, 50%)`,
                  }}
                >
                  {avatarFallback}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">
                {assistant.name}
              </h1>
              {assistant.metadata &&
                typeof assistant.metadata === "object" &&
                "description" in assistant.metadata && (
                  <p className="text-sm text-muted-foreground">
                    {String(assistant.metadata.description)}
                  </p>
                )}
            </div>
          </div>
        </div>
        <div className="ml-auto pl-4">
          <AgentConfigButton assistant={assistant} />
        </div>
      </div>
    </div>
  );
}
