"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { ReactNode, useState } from "react";
import { CheckCircle2 } from "lucide-react";

export type ServerType = "official" | "custom";

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
  compact?: boolean;
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
  className = "",
  compact = false
}: BaseServerCardProps) {
  const [imageError, setImageError] = useState(false);
  const getTruncatedDescription = (text: string, maxWords: number = 30): string => {
    const safe = text || "";
    const words = safe.split(/\s+/).filter(Boolean);
    if (words.length === 0) return "No description provided.";
    if (words.length <= maxWords) return safe;
    return words.slice(0, maxWords).join(' ') + '...';
  };
  const getServerTypeBadge = () => {
    if (serverType === "official") {
      return (
        <Badge
          variant="secondary"
          className="absolute top-3 right-3 text-xs bg-gradient-to-r from-blue-500/90 to-cyan-500/90 text-white border-0 shadow-sm"
        >
          Official
        </Badge>
      );
    } else {
      return (
        <Badge
          variant="secondary"
          className="absolute top-3 right-3 text-xs bg-gradient-to-r from-purple-500/90 to-violet-500/90 text-white border-0 shadow-sm"
        >
          Custom
        </Badge>
      );
    }
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

  // Compact list view
  if (compact) {
    return (
      <Card
        className={`group relative overflow-hidden border border-border hover:border-amber-500/50 cursor-pointer transition-all duration-200 hover:shadow-md ${className}`}
        onClick={onClick}
      >
        <div className="relative bg-card rounded-lg">
          <div className="flex items-center gap-3 p-3">
            {/* Logo */}
            <div className="flex-shrink-0">
              {logoUrl && !imageError ? (
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center overflow-hidden border border-border">
                  <Image
                    src={logoUrl}
                    alt={displayName}
                    width={32}
                    height={32}
                    className="object-contain p-1"
                    onError={() => setImageError(true)}
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center text-lg border border-border">
                  {getFallbackEmoji()}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-semibold text-sm truncate bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  {displayName}
                </h3>
                <Badge
                  variant="secondary"
                  className={`text-xs px-1.5 py-0 h-5 ${
                    serverType === "official"
                      ? "bg-gradient-to-r from-blue-500/90 to-cyan-500/90 text-white border-0"
                      : "bg-gradient-to-r from-purple-500/90 to-violet-500/90 text-white border-0"
                  }`}
                >
                  {serverType === "official" ? "Official" : "Custom"}
                </Badge>
                {isConfigured && (
                  <Badge
                    variant="secondary"
                    className="text-xs px-1.5 py-0 h-5 bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Configured
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {description || "No description provided."}
              </p>
            </div>
          </div>
          {children}
        </div>
      </Card>
    );
  }

  // Full card view
  return (
    <Card
      className={`group flex flex-col h-full relative overflow-hidden border-0 shadow-lg hover:shadow-2xl cursor-pointer transition-all duration-300 hover:scale-[1.03] ${className}`}
      onClick={onClick}
    >
      {/* Gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-orange-500/10 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />

      {/* Card content */}
      <div className="relative bg-card border border-border rounded-lg h-full flex flex-col">
        {getServerTypeBadge()}
        {isConfigured && (
          <Badge
            variant="secondary"
            className="absolute top-3 left-3 text-xs bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-sm flex items-center gap-1 animate-in fade-in duration-300"
          >
            <CheckCircle2 className="h-3 w-3" />
            Configured
          </Badge>
        )}

        <CardHeader className="flex flex-col items-center pb-2 pt-12">
          {/* Logo with gradient ring */}
          <div className="mb-3 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-300" />
            <div className="relative p-1 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full ring-2 ring-amber-500/30 group-hover:ring-amber-500/60 transition-all duration-300">
              {logoUrl && !imageError ? (
                <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center overflow-hidden">
                  <Image
                    src={logoUrl}
                    alt={displayName}
                    width={56}
                    height={56}
                    className="object-contain p-2"
                    onError={() => setImageError(true)}
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center text-3xl backdrop-blur-sm">
                  {getFallbackEmoji()}
                </div>
              )}
            </div>
          </div>

          {/* Title with gradient */}
          <CardTitle className="text-center text-lg font-semibold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent group-hover:from-amber-500 group-hover:to-orange-500 transition-all duration-300">
            {displayName}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col flex-1 justify-between pt-2">
          <div className="mb-4 text-sm text-muted-foreground min-h-[60px] line-clamp-3">
            {getTruncatedDescription(description, 30)}
          </div>
          {children}
        </CardContent>
      </div>
    </Card>
  );
}
