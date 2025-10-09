"use client";

import PitchDeck from "./claude-affinitybots-deck";
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";

export default function PitchDeckPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-8 pt-24 md:pt-28">
        <div className="w-full max-w-6xl">
          <PitchDeck />
        </div>
      </main>
      <Footer />
    </div>
  );
}

