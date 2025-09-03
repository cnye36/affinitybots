"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, FileText, Eye, Star, ExternalLink, Monitor, ChevronLeft, ChevronRight } from "lucide-react";
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import { Document, Page, pdfjs } from "react-pdf";

// Use locally hosted worker matching pdfjs-dist v5 (module format)
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

function PresentationPdf() {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [fileUrl, setFileUrl] = useState<string>("/pitch-deck.pdf");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const swipeStateRef = useRef<{ startX: number | null }>({ startX: null });

  // Measure container width
  useEffect(() => {
    const update = () => {
      const el = containerRef.current;
      if (el) setContainerWidth(el.clientWidth);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Resolve absolute URL on client to avoid loader issues in some environments
  useEffect(() => {
    if (typeof window !== "undefined") {
      setFileUrl(`${window.location.origin}/pitch-deck.pdf`);
    }
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const prevPage = () => setPageNumber((p) => Math.max(1, p - 1));
  const nextPage = () => setPageNumber((p) => Math.min(numPages || p, p + 1));

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevPage();
      if (e.key === "ArrowRight") nextPage();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [numPages]);

  return (
    <div className="w-full rounded-lg overflow-hidden border bg-background">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
        <div className="text-sm text-muted-foreground">Slide {pageNumber}{numPages ? ` / ${numPages}` : ""}</div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={prevPage} disabled={pageNumber <= 1} aria-label="Previous slide">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextPage} disabled={numPages > 0 ? pageNumber >= numPages : false} aria-label="Next slide">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="w-full flex items-center justify-center p-2 md:p-4 select-none"
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
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(err) => console.error("PDF load error:", err)}
          onSourceError={(err) => console.error("PDF source error:", err)}
          loading={<div className="p-8">Loading…</div>}
        >
          <Page
            pageNumber={pageNumber}
            renderAnnotationLayer={false}
            renderTextLayer={false}
            width={Math.min(Math.max(containerWidth - 16, 320), 1200)}
          />
        </Document>
      </div>
    </div>
  );
}

export default function PitchDeckPage() {
  const [isLoading, setIsLoading] = useState(false);
  

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const link = document.createElement('a');
      link.href = '/pitch-deck.pdf';
      link.download = 'AffinityBots-Pitch-Deck.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewFullscreen = () => {
    window.open('/pitch-deck.pdf', '_blank', 'width=1200,height=800');
  };
  

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-r from-blue-600/5 to-purple-600/5">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Badge variant="secondary" className="gap-2">
                  <FileText className="h-3 w-3" />
                  Pitch Deck
                </Badge>
                <Badge variant="outline" className="gap-2">
                  <Star className="h-3 w-3" />
                  Latest Version
                </Badge>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                AffinityBots Pitch Deck
              </h1>
              
              <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
                Discover how AffinityBots is revolutionizing AI agent workflows and transforming the way businesses automate their processes.
              </p>

              
            </div>
          </div>
        </section>

        <Separator />

        {/* PDF Section */}
        <section id="pdf-section" className="py-16">
          <div className="container mx-auto px-4">
            <Card className="shadow-lg max-w-4xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">AffinityBots Pitch Deck</CardTitle>
                <p className="text-muted-foreground">
                  Access our comprehensive pitch deck through multiple viewing options
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Presentation PDF Viewer */}
                <PresentationPdf />

                {/* Viewing Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4 text-center hover:shadow-md transition-shadow">
                    <Monitor className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h4 className="font-semibold mb-2">Full Screen View</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Open in a dedicated PDF viewer window
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleViewFullscreen}
                      className="w-full"
                    >
                      Open Viewer
                    </Button>
                  </Card>

                  <Card className="p-4 text-center hover:shadow-md transition-shadow">
                    <Download className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h4 className="font-semibold mb-2">Download PDF</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Save to your device for offline viewing
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? 'Downloading...' : 'Download'}
                    </Button>
                  </Card>

                  <Card className="p-4 text-center hover:shadow-md transition-shadow">
                    <ExternalLink className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h4 className="font-semibold mb-2">Direct Link</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Open PDF in your browser's built-in viewer
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('/pitch-deck.pdf', '_blank')}
                      className="w-full"
                    >
                      Open Link
                    </Button>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Quick Stats Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto text-center">
              <div>
                <div className="text-3xl font-bold text-primary mb-2">7+</div>
                <div className="text-sm text-muted-foreground">Slides</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">5 Min</div>
                <div className="text-sm text-muted-foreground">Read Time</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">2025</div>
                <div className="text-sm text-muted-foreground">Updated</div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

