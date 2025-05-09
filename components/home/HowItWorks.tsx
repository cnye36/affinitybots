"use client";

import React from "react";
import { MotionDiv } from "@/components/motion/MotionDiv";

const steps = [
  {
    number: "01",
    title: "Design Your Agent",
    description:
      "Create an AI agent with the personality and skills you need. Define whether it will be a personal assistant or customer-facing representative.",
    icon: "🧠",
  },
  {
    number: "02",
    title: "Add Knowledge & Tools",
    description:
      "Equip your agent with knowledge bases, documents, and powerful tools to help it accomplish tasks. Configure memory options to make it even smarter.",
    icon: "🛠️",
  },
  {
    number: "03",
    title: "Test & Implement",
    description:
      "Test your agent in a sandbox environment, then use it privately within your workspace or deploy it externally to interact with customers.",
    icon: "🚀",
  },
  {
    number: "04",
    title: "Monitor & Improve",
    description:
      "Track your agent's performance, review conversations, and continuously improve its capabilities based on real interactions.",
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
            Build your AI workforce in four simple steps. Create agents that
            work directly with you or deploy them to handle customer
            interactions automatically.
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
