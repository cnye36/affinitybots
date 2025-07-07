"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PitchDeckPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header with back navigation */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
            <h1 className="text-xl font-semibold">AgentHub Pitch Deck</h1>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8">
            {/* Placeholder content */}
            <div className="text-center space-y-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <ExternalLink className="h-12 w-12 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                AgentHub Pitch Deck
              </h2>
              
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our comprehensive pitch deck showcasing AgentHub's vision, market opportunity, 
                technology platform, and growth strategy for revolutionizing AI agent workflows.
              </p>

              {/* Placeholder PDF viewer area */}
              <div className="mt-8 border-2 border-dashed border-border rounded-lg p-12 bg-muted/20">
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-muted rounded-lg flex items-center justify-center">
                    <ExternalLink className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold">PDF Placeholder</h3>
                  <p className="text-muted-foreground">
                    The pitch deck PDF will be displayed here once uploaded.
                  </p>
                  <div className="flex justify-center space-x-4 mt-6">
                    <Button variant="outline" disabled>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button disabled>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </Button>
                  </div>
                </div>
              </div>

              {/* Instructions for replacement */}
              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  For Developers:
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Replace this placeholder with an embedded PDF viewer or download link. 
                  You can use libraries like react-pdf or pdf.js for PDF rendering, 
                  or simply provide a download link to your hosted PDF file.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}