import React from "react";
import { EarlyAccessForm } from "@/components/emails/EarlyAccessForm";
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";

export default function EarlyAccessPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-32 pb-16 flex flex-col items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              Join AffinityBots Early Access
            </h1>
            <p className="text-muted-foreground text-lg">
              We&apos;re currently in closed beta. Fill out this form to request
              early access and we&apos;ll get back to you soon.
            </p>
          </div>
          <EarlyAccessForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
