import { Header } from "@/components/home/Header";
import { Hero } from "@/components/home/Hero";
import { DemoVideo } from "@/components/home/DemoVideo";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Benefits } from "@/components/home/Benefits";
import { Features } from "@/components/home/Features";
import { Integrations } from "@/components/home/Integrations";
import { FeaturedIn } from "@/components/home/FeaturedIn";
import { CTA } from "@/components/home/CTA";
import { Footer } from "@/components/home/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24">
        <Hero />
        <Features />
        <Integrations />
        <HowItWorks />
        <Benefits />
        <FeaturedIn />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
