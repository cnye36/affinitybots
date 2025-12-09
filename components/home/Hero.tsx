"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { MotionDiv } from "@/components/motion/MotionDiv";

export function Hero() {
  return (
    <section className="relative py-12 md:py-0 md:min-h-[80vh] flex items-center overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-gradient" />

      {/* Animated circles in background */}
      <div className="absolute inset-0">
        <div className="absolute top-10 md:top-20 left-10 md:left-20 w-48 md:w-72 h-48 md:h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 md:bottom-20 right-10 md:right-20 w-48 md:w-72 h-48 md:h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Content Section - Left Side */}
          <MotionDiv
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 text-left"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-4 md:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
              Don&apos;t Hire... Create!
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-6 md:mb-8">
              AffinityBots lets you spin up fully operational AI agents in minutes.
              Customize their skills, deploy them instantly, and let them handle
              the workload while you focus on growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/early-access" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="text-base md:text-lg w-full sm:w-auto px-6 md:px-8 py-5 md:py-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  Request Early Access
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
            <div className="mt-8 md:mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-6 md:gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 mb-2">
                  1min
                </div>
                <div className="text-sm sm:text-base md:text-sm text-muted-foreground">
                  To Create
                  <br />
                  an Agent
                </div>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 mb-2">
                  24/7
                </div>
                <div className="text-sm sm:text-base md:text-sm text-muted-foreground">
                  Availability
                  <br />
                  Always On
                </div>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 mb-2">
                  100%
                </div>
                <div className="text-sm sm:text-base md:text-sm text-muted-foreground">
                  Customizable
                  <br />
                  Agents
                </div>
              </div>
            </div>
          </MotionDiv>

          {/* Image Section - Right Side - Hidden on mobile, visible on sm and above */}
          <MotionDiv
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden sm:block relative mt-8 lg:mt-0"
          >
            <div className="relative h-[400px] md:h-[500px] lg:h-[600px] w-full">
              <Image
                src="/images/Four-bots.png"
                alt="AI Bot Assistant"
                fill
                className="object-contain"
                priority
              />
            </div>
          </MotionDiv>
        </div>
      </div>
    </section>
  );
}
