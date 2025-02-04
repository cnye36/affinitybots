"use client";

import { Assistant } from "@/types";
import { AgentConfigButton } from "@/components/configuration/AgentConfigButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AgentPageHeaderProps {
  assistant: Assistant;
}

export function AgentPageHeader({ assistant }: AgentPageHeaderProps) {
  // Get first letter of assistant name for avatar fallback
  const avatarFallback = assistant.name.charAt(0).toUpperCase();

  return (
    <div className="flex-none border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center px-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            {assistant.config.configurable.avatar ? (
              <AvatarImage
                src={assistant.config.configurable.avatar}
                alt={assistant.name}
              />
            ) : (
              <AvatarFallback className="bg-primary/10">
                {avatarFallback}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
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
        <div className="ml-auto">
          <AgentConfigButton assistant={assistant} />
        </div>
      </div>
    </div>
  );
}
