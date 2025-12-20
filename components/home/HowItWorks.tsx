"use client";

import React from "react";
import { MotionDiv } from "@/components/motion/MotionDiv";
import Image from "next/image";
import { AnimatedAgentCreation } from "@/components/home/AnimatedAgentCreation";
import { AnimatedToolsKnowledge } from "@/components/home/AnimatedToolsKnowledge";
import { AnimatedTestImplement } from "@/components/home/AnimatedTestImplement";
import { AnimatedWorkflow } from "@/components/home/AnimatedWorkflow";
import { AnimatedMonitorImprove } from "@/components/home/AnimatedMonitorImprove";

const steps = [
  {
    number: "01",
    title: "Design Your Agent",
    description:
      "Create an AI agent with the personality and skills you need. Define whether it will be a personal assistant or customer-facing representative. Customize its behavior, tone, and capabilities to match your specific use case.",
    image: "/images/affinitybots-homepage-agent-graphic.png",
  },
  {
    number: "02",
    title: "Add Knowledge & Tools",
    description:
      "Equip your agent with knowledge bases, documents, and powerful tools to help it accomplish tasks. Configure memory options to make it even smarter.",
    image: null, // Will be added later
  },
  {
    number: "03",
    title: "Test & Implement",
    description:
      "Test your agent in a sandbox environment, then use it privately within your workspace or deploy it externally to interact with customers.",
    image: null, // Will be added later
  },
  {
    number: "04",
    title: "Create Workflows & Agent Teams",
    description:
      "Chain multiple agents together in powerful workflows. Create agent teams that collaborate, share context, and automate complex multi-step processes.",
    image: null, // Will be added later
  },
  {
    number: "05",
    title: "Monitor & Improve",
    description:
      "Track your agent's performance, review conversations, and continuously improve its capabilities based on real interactions.",
    image: null, // Will be added later
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Build your AI workforce in five simple steps. Create agents that
            work directly with you or deploy them to handle customer
            interactions automatically.
          </p>
        </div>

        {/* Step 1: Design Your Agent - Graphic on right, content on left */}
        <MotionDiv
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20 md:mb-32"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Content Side - Left */}
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/30 mb-6">
                <span className="text-sm font-semibold text-blue-400">{steps[0].number}</span>
                <span className="text-xs text-muted-foreground">Step 1</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                {steps[0].title}
              </h3>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                {steps[0].description}
              </p>
            </div>

            {/* Graphic Side - Right */}
            <div className="order-1 lg:order-2 relative">
              <div className="relative w-full max-w-lg mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl blur-2xl" />
                <div className="relative rounded-2xl overflow-hidden border border-border bg-background/50 backdrop-blur-sm shadow-2xl h-[340px] sm:h-[360px] md:h-[400px]">
                  <AnimatedAgentCreation />
                </div>
              </div>
            </div>
          </div>
        </MotionDiv>

        {/* Step 2: Add Knowledge & Tools - Graphic on left, content on right */}
        <MotionDiv
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="mb-20 md:mb-32"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Graphic Side - Left */}
            <div className="order-1 relative">
              <div className="relative w-full max-w-lg mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-2xl blur-2xl" />
                <div className="relative rounded-2xl overflow-hidden border border-border bg-background/50 backdrop-blur-sm shadow-2xl h-[340px] sm:h-[360px] md:h-[400px]">
                  <AnimatedToolsKnowledge />
                </div>
              </div>
            </div>

            {/* Content Side - Right */}
            <div className="order-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-600/20 border border-purple-500/30 mb-6">
                <span className="text-sm font-semibold text-purple-400">{steps[1].number}</span>
                <span className="text-xs text-muted-foreground">Step 2</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-600">
                {steps[1].title}
              </h3>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                {steps[1].description}
              </p>
            </div>
          </div>
        </MotionDiv>

        {/* Step 3: Test & Implement - Graphic on right, content on left */}
        <MotionDiv
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="mb-20 md:mb-32"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Content Side - Left */}
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 mb-6">
                <span className="text-sm font-semibold text-emerald-400">{steps[2].number}</span>
                <span className="text-xs text-muted-foreground">Step 3</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-600">
                {steps[2].title}
              </h3>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                {steps[2].description}
              </p>
            </div>

            {/* Graphic Side - Right */}
            <div className="order-1 lg:order-2 relative">
              <div className="relative w-full max-w-lg mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-2xl blur-2xl" />
                <div className="relative rounded-2xl overflow-hidden border border-border bg-background/50 backdrop-blur-sm shadow-2xl h-[340px] sm:h-[360px] md:h-[400px]">
                  <AnimatedTestImplement />
                </div>
              </div>
            </div>
          </div>
        </MotionDiv>

        {/* Step 4: Create Workflows & Agent Teams - Graphic on left, content on right */}
        <MotionDiv
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mb-20 md:mb-32"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Graphic Side - Left */}
            <div className="order-1 relative">
              <div className="relative w-full max-w-lg mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-2xl blur-2xl" />
                <div className="relative rounded-2xl overflow-hidden border border-border bg-background/50 backdrop-blur-sm shadow-2xl h-[340px] sm:h-[360px] md:h-[400px]">
                  <AnimatedWorkflow />
                </div>
              </div>
            </div>

            {/* Content Side - Right */}
            <div className="order-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 mb-6">
                <span className="text-sm font-semibold text-indigo-400">{steps[3].number}</span>
                <span className="text-xs text-muted-foreground">Step 4</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                {steps[3].title}
              </h3>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                {steps[3].description}
              </p>
            </div>
          </div>
        </MotionDiv>

        {/* Step 5: Monitor & Improve - Content on left, graphic on right */}
        <MotionDiv
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mb-20 md:mb-32"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Content Side - Left */}
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-yellow-600/20 border border-orange-500/30 mb-6">
                <span className="text-sm font-semibold text-orange-400">{steps[4].number}</span>
                <span className="text-xs text-muted-foreground">Step 5</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-yellow-600">
                {steps[4].title}
              </h3>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                {steps[4].description}
              </p>
            </div>

            {/* Graphic Side - Right */}
            <div className="order-1 lg:order-2 relative">
              <div className="relative w-full max-w-lg mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-yellow-600/20 rounded-2xl blur-2xl" />
                <div className="relative rounded-2xl overflow-hidden border border-border bg-background/50 backdrop-blur-sm shadow-2xl h-[340px] sm:h-[360px] md:h-[400px]">
                  <AnimatedMonitorImprove />
                </div>
              </div>
            </div>
          </div>
        </MotionDiv>
      </div>
    </section>
  );
}
