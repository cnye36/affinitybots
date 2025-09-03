"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, FileText, Eye, Star, ExternalLink, Monitor } from "lucide-react";
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import dynamic from "next/dynamic";
const PresentationPdf = dynamic(() => import("@/components/pdf/PresentationPdf"), { ssr: false });
const SlideCarousel = dynamic(() => import("@/components/presentation/SlideCarousel"), { ssr: false });

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
                {/* Presentation Image Carousel (uses images if present) */}
                {/* Replace the array below with your actual slide image paths under /public */}
                <SlideCarousel images={[
                  "/slides/AffinityBots-Pitch-Deck-Page-1.jpg",
                  "/slides/AffinityBots-Pitch-Deck-Page-2.jpg",
                  "/slides/AffinityBots-Pitch-Deck-Page-3.jpg",
                  "/slides/AffinityBots-Pitch-Deck-Page-4.jpg",
                  "/slides/AffinityBots-Pitch-Deck-Page-5.jpg",
                  "/slides/AffinityBots-Pitch-Deck-Page-6.jpg",
                  "/slides/AffinityBots-Pitch-Deck-Page-7.jpg",
                  "/slides/AffinityBots-Pitch-Deck-Page-8.jpg",
                ]} />

                {/* Fallback: PDF Viewer (kept available) */}
                {/* <PresentationPdf /> */}

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

