"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type SlideCarouselProps = {
  images: string[];
  startIndex?: number;
};

export default function SlideCarousel({ images, startIndex = 0 }: SlideCarouselProps) {
  const [index, setIndex] = useState<number>(startIndex);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const swipe = useRef<{ startX: number | null }>({ startX: null });

  const total = images.length;

  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  if (total === 0) {
    return (
      <div className="w-full rounded-lg border bg-muted/50 p-6 text-center text-sm text-muted-foreground">
        No slide images found. Add images to public and pass their paths to the carousel.
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg overflow-hidden border bg-background">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
        <div className="text-sm text-muted-foreground">Slide {index + 1} / {total}</div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={prev} aria-label="Previous slide">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={next} aria-label="Next slide">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full h-[70vh] md:h-[75vh] bg-black flex items-center justify-center select-none"
        onTouchStart={(e) => {
          swipe.current.startX = e.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const startX = swipe.current.startX;
          const endX = e.changedTouches[0]?.clientX ?? null;
          if (startX !== null && endX !== null) {
            const dx = endX - startX;
            if (Math.abs(dx) > 40) {
              if (dx < 0) next();
              else prev();
            }
          }
          swipe.current.startX = null;
        }}
      >
        <img
          src={images[index]}
          alt={`Slide ${index + 1}`}
          className="max-h-full max-w-full object-contain"
        />

        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 w-2 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}


