"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MotionDiv } from "@/components/motion/MotionDiv";

export function Hero() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-gradient" />

      {/* Animated circles in background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
            Build AI Employees in Minutes, Not Months
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Ditch the hiring headaches. With AgentHub, you can instantly design,
            deploy, and manage AI-powered agents that work for you 24/7 — no
            coding required.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Request Early Access
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                See How It Works
              </Button>
            </Link>
          </div>
          <div className="mt-12 flex items-center justify-center gap-8">
            <div className="flex items-center">
              <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                5min
              </div>
              <div className="ml-2 text-sm text-muted-foreground">
                To Create
                <br />
                an Agent
              </div>
            </div>
            <div className="flex items-center">
              <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                24/7
              </div>
              <div className="ml-2 text-sm text-muted-foreground">
                Availability
                <br />
                Always On
              </div>
            </div>
            <div className="flex items-center">
              <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                100%
              </div>
              <div className="ml-2 text-sm text-muted-foreground">
                Customizable
                <br />
                Agents
              </div>
            </div>
          </div>
        </MotionDiv>
      </div>
    </section>
  );
}
