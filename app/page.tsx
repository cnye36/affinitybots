import { Header } from "@/components/home/Header";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Benefits } from "@/components/home/Benefits";
import { Features } from "@/components/home/Features";
import { CTA } from "@/components/home/CTA";
import { Footer } from "@/components/home/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24">
        <Hero />
        <div className="container mx-auto px-4 py-20">
          <Features />
        </div>
        <HowItWorks />
        <Benefits />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
