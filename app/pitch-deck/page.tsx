"use client";

import { useState } from "react";
import PitchDeck from "./pitch-deck";
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import { Download, Share2, FileText } from "lucide-react";

export default function PitchDeckPage() {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const handleDownloadPDF = async () => {
    try {
      const response = await fetch('/affinitybots-pitch-deck.pdf');
      if (!response.ok) throw new Error('PDF not found');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'affinitybots-pitch-deck.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Unable to download PDF. Please try again or contact support.');
    }
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
          {/* Mobile View - Centered Buttons Only */}
          <div className="md:hidden flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              AffinityBots Pitch Deck
            </h1>
            <button
              onClick={handleViewPDF}
              className="flex items-center gap-3 px-8 py-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-base font-medium w-64 justify-center shadow-lg"
            >
              <FileText className="w-5 h-5" />
              View PDF
            </button>
            
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-3 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-base font-medium w-64 justify-center shadow-lg"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
            
            <div className="relative">
              <button
                onClick={handleShare}
                className="flex items-center gap-3 px-8 py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors text-base font-medium w-64 justify-center shadow-lg"
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>
              
              {showShareMenu && !navigator.share && (
                <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
                  <button
                    onClick={copyToClipboard}
                    className="w-full px-4 py-3 text-center text-sm text-white hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    {copySuccess ? '✓ Copied!' : 'Copy Link'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Desktop View - Buttons and Deck */}
          <div className="hidden md:block">
            <div className="flex flex-wrap gap-3 mb-6 justify-end">
              <button
                onClick={handleViewPDF}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <FileText className="w-4 h-4" />
                View PDF
              </button>
              
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download PDF
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
        </div>
      </main>
      <Footer />
    </div>
  );
}

