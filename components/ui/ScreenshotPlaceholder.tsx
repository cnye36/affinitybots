import React from "react";
import { ImageIcon } from "lucide-react";

interface ScreenshotPlaceholderProps {
  title: string;
  description: string;
  aspectRatio?: "video" | "square" | "portrait";
  className?: string;
}

export function ScreenshotPlaceholder({
  title,
  description,
  aspectRatio = "video",
  className = ""
}: ScreenshotPlaceholderProps) {
  const aspectClasses = {
    video: "aspect-video",
    square: "aspect-square",
    portrait: "aspect-[3/4]"
  };

  return (
    <div className={`relative ${aspectClasses[aspectRatio]} rounded-xl overflow-hidden bg-gradient-to-br from-blue-500/10 to-purple-600/10 border-2 border-dashed border-blue-500/30 ${className}`}>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 mb-4 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center border border-blue-500/30">
          <ImageIcon className="w-8 h-8 text-blue-400" />
        </div>
        <p className="text-sm font-semibold text-foreground mb-2">
          {title}
        </p>
        <p className="text-xs text-muted-foreground max-w-xs">
          {description}
        </p>
      </div>

      {/* Decorative grid pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(59, 130, 246, 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />
    </div>
  );
}
