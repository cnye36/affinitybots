"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MotionDiv } from "@/components/motion/MotionDiv";
import AnimationHero from "@/components/home/AnimatedHero";

export function Hero() {
  return (
    <section className="relative py-12 md:py-8 md:pb-16 lg:py-12 lg:pb-20 md:min-h-[85vh] flex items-center overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-gradient" />

      {/* Animated circles in background */}
      <div className="absolute inset-0">
        <div className="absolute top-10 md:top-20 left-10 md:left-20 w-48 md:w-72 h-48 md:h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 md:bottom-20 right-10 md:right-20 w-48 md:w-72 h-48 md:h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="container mx-auto px-4 pb-8 md:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Content Section - Left Side */}
          <MotionDiv
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 text-left"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-4 md:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
              Build Your AI Workforce in Minutes
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-6 md:mb-8">
              Create custom AI agents with no coding required. Deploy intelligent
              workflows, automate complex tasks, and scale your operations—all from
              one powerful platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/pricing" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="text-base md:text-lg w-full sm:w-auto px-6 md:px-8 py-5 md:py-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  Get Started
                </Button>
              </Link>
              <Link href="/#how-it-works" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base md:text-lg w-full sm:w-auto px-6 md:px-8 py-5 md:py-6"
                >
                  See How It Works
                </Button>
              </Link>
            </div>
            
          </MotionDiv>

          {/* Workflow Animation Section - Right Side - Hidden on mobile, visible on sm and above */}
          <MotionDiv
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden sm:block relative z-10 mt-8 lg:mt-0 w-full flex justify-center lg:justify-end"
          >
            <AnimationHero />
          </MotionDiv>
        </div>
      </div>
    </section>
  );
}
