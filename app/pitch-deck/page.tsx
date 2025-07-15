"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, FileText, Eye, Star, ExternalLink, Monitor } from "lucide-react";
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";

export default function PitchDeckPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const link = document.createElement('a');
      link.href = '/pitch-deck.pdf';
      link.download = 'AgentHub-Pitch-Deck.pdf';
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

  const togglePdfViewer = () => {
    setShowPdfViewer(!showPdfViewer);
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
                AgentHub Pitch Deck
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Discover how AgentHub is revolutionizing AI agent workflows and transforming the way businesses automate their processes.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <Button
                  size="lg"
                  onClick={handleViewFullscreen}
                  className="gap-2"
                >
                  <Monitor className="h-5 w-5" />
                  View Pitch Deck
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleDownload}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <Download className="h-5 w-5" />
                  {isLoading ? 'Downloading...' : 'Download PDF'}
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => document.getElementById('pdf-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="gap-2"
                >
                  <Eye className="h-5 w-5" />
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* PDF Section */}
        <section id="pdf-section" className="py-16">
          <div className="container mx-auto px-4">
            <Card className="shadow-lg max-w-4xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">AgentHub Pitch Deck</CardTitle>
                <p className="text-muted-foreground">
                  Access our comprehensive pitch deck through multiple viewing options
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* PDF Preview Image/Info */}
                <div className="aspect-[16/9] w-full rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                  <div className="text-center p-8">
                    <FileText className="h-24 w-24 text-primary mx-auto mb-4" />
                    <h3 className="text-2xl font-semibold mb-2">AgentHub Pitch Deck</h3>
                    <p className="text-muted-foreground mb-6">
                      7 slides • 5 min read • Updated 2025
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        onClick={handleViewFullscreen}
                        className="gap-2 w-full sm:w-auto"
                      >
                        <Monitor className="h-4 w-4" />
                        Open PDF Viewer
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleDownload}
                        disabled={isLoading}
                        className="gap-2 w-full sm:w-auto"
                      >
                        <Download className="h-4 w-4" />
                        {isLoading ? 'Downloading...' : 'Download PDF'}
                      </Button>
                    </div>
                  </div>
                </div>

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

                {/* Alternative: Show direct link prominently */}
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Having trouble viewing? Access the PDF directly:
                  </p>
                  <code className="bg-muted px-3 py-1 rounded text-sm">
                    <a 
                      href="/pitch-deck.pdf" 
                      target="_blank" 
                      className="text-primary hover:underline"
                    >
                      localhost:3000/pitch-deck.pdf
                    </a>
                  </code>
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

