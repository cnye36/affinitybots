"use client";

import { useState } from "react";
import PitchDeck from "./pitch-deck";
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import { Download, Share2, FileText } from "lucide-react";

export default function PitchDeckPage() {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleDownloadPDF = () => {
    const link = document.createElement('a');
    link.href = '/pitch-deck/affinitybots-pitch-deck.pdf';
    link.download = 'affinitybots-pitch-deck.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewPDF = () => {
    window.open('/affinitybots-pitch-deck.pdf', '_blank');
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AffinityBots Pitch Deck',
          text: 'Check out the AffinityBots pitch deck - AI workforce platform',
          url: url,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      setShowShareMenu(!showShareMenu);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
        setShowShareMenu(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-8 pt-24 md:pt-28">
        <div className="w-full max-w-6xl">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-6 justify-center sm:justify-end">
            <button
              onClick={handleViewPDF}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">View PDF</span>
              <span className="sm:hidden">View</span>
            </button>
            
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download PDF</span>
              <span className="sm:hidden">Download</span>
            </button>
            
            <div className="relative">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              
              {showShareMenu && !navigator.share && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
                  <button
                    onClick={copyToClipboard}
                    className="w-full px-4 py-3 text-left text-sm text-white hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    {copySuccess ? '✓ Copied!' : 'Copy Link'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <PitchDeck />
        </div>
      </main>
      <Footer />
    </div>
  );
}

