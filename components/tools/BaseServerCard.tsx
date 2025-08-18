"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { ReactNode } from "react";

export type ServerType = "official" | "smithery" | "custom";

export interface BaseServerCardProps {
  qualifiedName: string;
  displayName: string;
  description: string;
  logoUrl?: string;
  serverType: ServerType;
  isConfigured?: boolean;
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function BaseServerCard({
  qualifiedName,
  displayName,
  description,
  logoUrl,
  serverType,
  isConfigured = false,
  children,
  onClick,
  className = ""
}: BaseServerCardProps) {
  const getServerTypeBadge = () => {
    const variants = {
      official: "default",
      smithery: "secondary", 
      custom: "outline"
    } as const;

    const labels = {
      official: "Official",
      smithery: "Smithery",
      custom: "Custom"
    };

    return (
      <Badge variant={variants[serverType]} className="absolute top-2 right-2 text-xs">
        {labels[serverType]}
      </Badge>
    );
  };

  const getFallbackEmoji = () => {
    switch (qualifiedName) {
      case 'github':
        return '🐙';
      case 'notion':
        return '📝';
      case 'supabase':
        return '🗄️';
      default:
        return '🛠️';
    }
  };

  return (
    <Card 
      className={`flex flex-col h-full shadow-lg border border-muted hover:shadow-xl cursor-pointer transition-transform hover:scale-105 relative ${className}`}
      onClick={onClick}
    >
      {getServerTypeBadge()}
      
      <CardHeader className="flex flex-col items-center pb-2">
        {logoUrl ? (
          <div className="mb-2">
            <Image
              src={logoUrl}
              alt={displayName}
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
        ) : (
          <div className="mb-2 w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl">
            {getFallbackEmoji()}
          </div>
        )}
        <CardTitle className="text-center text-lg font-semibold">
          {displayName}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex flex-col flex-1 justify-between">
        <div className="mb-4 text-sm text-muted-foreground min-h-[48px]">
          {description}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
