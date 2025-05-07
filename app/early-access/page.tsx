import React from "react";
import { EarlyAccessForm } from "@/components/home/EarlyAccessForm";
import { Header } from "@/components/home/Header";

export default function EarlyAccessPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-6">
            Join AgentHub Early Access
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            We&apos;re currently in closed beta. Fill out this form to request
            early access and we&apos;ll get back to you soon.
          </p>
          <EarlyAccessForm />
        </div>
      </main>
    </div>
  );
}
