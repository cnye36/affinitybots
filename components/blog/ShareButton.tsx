"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

interface ShareButtonProps {
  title: string;
  excerpt: string;
  url: string;
}

export function ShareButton({ title, excerpt, url }: ShareButtonProps) {
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: excerpt,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        // You could add a toast notification here
        console.log('URL copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <Button 
      variant="outline" 
      className="border-gray-600 text-gray-300 hover:bg-gray-700"
      onClick={handleShare}
    >
      <Share2 className="h-4 w-4 mr-2" />
      Share Article
    </Button>
  );
}
