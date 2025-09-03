"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PresentationPdf() {
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [fileUrl, setFileUrl] = useState<string>("/pitch-deck.pdf");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const swipeStateRef = useRef<{ startX: number | null }>({ startX: null });

  useEffect(() => {
    // No-op: kept for future responsive logic if needed
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setFileUrl(`${window.location.origin}/pitch-deck.pdf`);
    }
  }, []);

  const prevPage = () => setPageNumber((p) => Math.max(1, p - 1));
  const nextPage = () => setPageNumber((p) => p + 1);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevPage();
      if (e.key === "ArrowRight") nextPage();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="w-full rounded-lg overflow-hidden border bg-background">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
        <div className="text-sm text-muted-foreground">Slide {pageNumber}</div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={prevPage} disabled={pageNumber <= 1} aria-label="Previous slide">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextPage} aria-label="Next slide">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="w-full flex items-center justify-center p-0 md:p-2 select-none"
        onTouchStart={(e) => {
          swipeStateRef.current.startX = e.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const startX = swipeStateRef.current.startX;
          const endX = e.changedTouches[0]?.clientX ?? null;
          if (startX !== null && endX !== null) {
            const delta = endX - startX;
            const threshold = 40; // px
            if (Math.abs(delta) > threshold) {
              if (delta < 0) nextPage();
              else prevPage();
            }
          }
          swipeStateRef.current.startX = null;
        }}
      >
        <iframe
          title="Pitch Deck"
          className="w-full h-[70vh] md:h-[75vh] border-0"
          src={`${fileUrl}#page=${pageNumber}&view=FitH&pagemode=none`}
        />
      </div>
    </div>
  );
}


