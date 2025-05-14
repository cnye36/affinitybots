"use client";

import React from "react";
import { MotionDiv } from "@/components/motion/MotionDiv";
import { CheckCircle } from "lucide-react";

const benefits = [
  {
    title: "Build Your Digital Agency",
    description:
      "Create a complete AI workforce with agents that handle both internal tasks and customer interactions. Each agent serves a specific purpose in your business.",
    features: [
      "Personal assistants for your own use",
      "Customer-facing agents for your website",
      "Specialized roles for specific tasks",
    ],
  },
  {
    title: "Your AI, Your Rules",
    description:
      "Full control over your AI agents. Configure exactly how they work, what they know, and how they interact with both you and your customers.",
    features: [
      "Customizable personality and tone",
      "Selective knowledge sharing",
      "Tailored tool capabilities",
    ],
  },
  {
    title: "Scale Your Operations",
    description:
      "Enhance your productivity with AI agents that work alongside you. Deploy customer-facing agents to handle inquiries while you focus on higher-level tasks.",
    features: [
      "Internal & external agents",
      "24/7 availability",
      "Cost-effective digital workforce",
    ],
  },
];

export function Benefits() {
  return (
    <section id="benefits" className="py-12 md:py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 md:mb-4">
            Your AI Workforce Hub
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Build a complete AI agency with agents that work directly with you
            behind the scenes and others that interact with your customers on
            your behalf.
          </p>
        </div>

        <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, index) => (
            <MotionDiv
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-background rounded-lg p-6 md:p-8 shadow-lg"
            >
              <h3 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4">
                {benefit.title}
              </h3>
              <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
                {benefit.description}
              </p>
              <ul className="space-y-2 md:space-y-3">
                {benefit.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <CheckCircle className="h-4 md:h-5 w-4 md:w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm md:text-base">{feature}</span>
                  </li>
                ))}
              </ul>
            </MotionDiv>
          ))}
        </div>
      </div>
    </section>
  );
}
