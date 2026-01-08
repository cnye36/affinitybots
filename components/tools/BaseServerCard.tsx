"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { ReactNode, useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { useTheme } from "next-themes";
import type { ServerCategory } from "@/lib/mcp/officialMcpServers";

export type ServerType = "official" | "custom";

// Category labels for display
const CATEGORY_LABELS: Record<ServerCategory, string> = {
  "development": "Development",
  "productivity": "Productivity",
  "project-management": "Project Management",
  "database": "Database",
  "design": "Design",
  "automation": "Automation",
  "web-scraping": "Web Scraping",
  "search": "Search",
  "monitoring": "Monitoring",
  "ecommerce": "E-commerce",
  "seo": "SEO",
  "finance": "Finance",
  "communication": "Communication",
};

// Category color gradients - each category gets its own unique color
const CATEGORY_COLORS: Record<ServerCategory, string> = {
  "development": "from-blue-500 to-indigo-600",
  "productivity": "from-orange-500 to-amber-600",
  "project-management": "from-violet-500 to-purple-600",
  "database": "from-cyan-500 to-blue-600",
  "design": "from-pink-500 to-rose-600",
  "automation": "from-slate-500 to-gray-600",
  "web-scraping": "from-lime-500 to-green-600",
  "search": "from-sky-400 to-blue-500",
  "monitoring": "from-red-500 to-orange-600",
  "ecommerce": "from-fuchsia-500 to-pink-600",
  "seo": "from-amber-500 to-yellow-600",
  "finance": "from-teal-600 to-cyan-600",
  "communication": "from-indigo-500 to-blue-600",
};

export interface BaseServerCardProps {
  serverName: string;
  displayName: string;
  description: string;
  logoUrl?: string; // Fallback for backward compatibility
  logoUrlLight?: string; // Icon for light theme
  logoUrlDark?: string; // Icon for dark theme
  serverType: ServerType;
  category?: ServerCategory; // Category for official servers
  isConfigured?: boolean;
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
}

export function BaseServerCard({
  serverName,
  displayName,
  description,
  logoUrl,
  logoUrlLight,
  logoUrlDark,
  serverType,
  category,
  isConfigured = false,
  children,
  onClick,
  className = "",
  compact = false
}: BaseServerCardProps) {
  const [imageError, setImageError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  
  // Prevent hydration mismatch by only using theme after mount
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Determine which logo URL to use based on theme
  const getLogoUrl = () => {
    // During SSR or before mount, use fallback to avoid hydration mismatch
    if (!mounted) {
      return logoUrl || logoUrlLight || logoUrlDark;
    }
    
    const currentTheme = resolvedTheme || theme || "light";
    if (currentTheme === "dark" && logoUrlDark) {
      return logoUrlDark;
    }
    if (currentTheme === "light" && logoUrlLight) {
      return logoUrlLight;
    }
    // Fallback to logoUrl for backward compatibility
    return logoUrl || logoUrlLight || logoUrlDark;
  };
  
  const effectiveLogoUrl = getLogoUrl();
  const getTruncatedDescription = (text: string, maxWords: number = 30): string => {
    const safe = text || "";
    const words = safe.split(/\s+/).filter(Boolean);
    if (words.length === 0) return "No description provided.";
    if (words.length <= maxWords) return safe;
    return words.slice(0, maxWords).join(' ') + '...';
  };
  const getServerTypeBadge = () => {
    if (serverType === "official" && category) {
      return (
        <Badge
          variant="secondary"
          className={`absolute top-3 right-3 text-xs bg-gradient-to-r ${CATEGORY_COLORS[category]} text-white border-0 shadow-sm`}
        >
          {CATEGORY_LABELS[category]}
        </Badge>
      );
    } else if (serverType === "custom") {
      return (
        <Badge
          variant="secondary"
          className="absolute top-3 right-3 text-xs bg-gradient-to-r from-purple-500/90 to-violet-500/90 text-white border-0 shadow-sm"
        >
          Custom
        </Badge>
      );
    }
    return null;
  };

  const getFallbackEmoji = () => {
    switch (serverName) {
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
        className={`group relative overflow-hidden border border-border hover:border-teal-500/50 cursor-pointer transition-all duration-200 hover:shadow-md ${className}`}
        onClick={onClick}
      >
        <div className="relative bg-card rounded-lg">
          <div className="flex items-center gap-3 p-3">
            {/* Logo */}
            <div className="flex-shrink-0">
              {effectiveLogoUrl && !imageError ? (
                <Image
                  src={effectiveLogoUrl}
                  alt={displayName}
                  width={40}
                  height={40}
                  className="object-contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-10 h-10 flex items-center justify-center text-2xl">
                  {getFallbackEmoji()}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-semibold text-sm truncate bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  {displayName}
                </h3>
                {serverType === "official" && category ? (
                  <Badge
                    variant="secondary"
                    className={`text-xs px-1.5 py-0 h-5 bg-gradient-to-r ${CATEGORY_COLORS[category]} text-white border-0`}
                  >
                    {CATEGORY_LABELS[category]}
                  </Badge>
                ) : serverType === "custom" ? (
                  <Badge
                    variant="secondary"
                    className="text-xs px-1.5 py-0 h-5 bg-gradient-to-r from-purple-500/90 to-violet-500/90 text-white border-0"
                  >
                    Custom
                  </Badge>
                ) : null}
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
              <p className="text-xs text-muted-foreground line-clamp-1">
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
      className={`group flex flex-col h-full relative overflow-hidden border-0 shadow-lg hover:shadow-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] ${className}`}
      onClick={onClick}
    >
      {/* Gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/30 via-emerald-500/30 to-teal-500/30 dark:from-teal-500/20 dark:via-emerald-500/20 dark:to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 via-emerald-500/20 to-teal-500/0 dark:via-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />

      {/* Card content */}
      <div className="relative bg-blue-50/50 dark:bg-card border border-border rounded-lg h-full flex flex-col">
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
          {/* Logo without circle */}
          <div className="mb-3 relative">
            {effectiveLogoUrl && !imageError ? (
              <Image
                src={effectiveLogoUrl}
                alt={displayName}
                width={64}
                height={64}
                className="object-contain transition-transform duration-300 group-hover:scale-110"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="text-5xl transition-transform duration-300 group-hover:scale-110">
                {getFallbackEmoji()}
              </div>
            )}
          </div>

          {/* Title with gradient */}
          <CardTitle className="text-center text-lg font-semibold bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent group-hover:from-teal-500 group-hover:to-emerald-500 transition-all duration-300">
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
