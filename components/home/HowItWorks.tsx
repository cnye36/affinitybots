"use client";

import React from "react";
import { MotionDiv } from "@/components/motion/MotionDiv";

const steps = [
  {
    number: "01",
    title: "Create Your Agents",
    description:
      "Design and configure AI agents with specific capabilities tailored to your needs. Choose from various AI models and customize their behavior.",
    icon: "🤖",
  },
  {
    number: "02",
    title: "Build Workflows",
    description:
      "Connect your agents in a visual workflow builder. Define how they interact, share data, and work together to achieve your goals.",
    icon: "🔄",
  },
  {
    number: "03",
    title: "Test & Deploy",
    description:
      "Validate your workflows in a safe environment, then deploy them to production with confidence. Monitor and optimize performance in real-time.",
    icon: "🚀",
  },
  {
    number: "04",
    title: "Scale & Optimize",
    description:
      "Automatically scale your AI workflows based on demand. Continuously improve performance with built-in analytics and optimization tools.",
    icon: "📈",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get started with AI-Automated in four simple steps. Our platform
            makes it easy to create, deploy, and manage AI workflows.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <MotionDiv
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-card rounded-lg p-6 h-full border border-border hover:border-primary transition-colors">
                <div className="text-4xl mb-4">{step.icon}</div>
                <div className="text-sm text-muted-foreground mb-2">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 text-muted-foreground">
                  →
                </div>
              )}
            </MotionDiv>
          ))}
        </div>
      </div>
    </section>
  );
}
