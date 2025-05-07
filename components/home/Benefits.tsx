"use client";

import React from "react";
import { MotionDiv } from "@/components/motion/MotionDiv";
import { CheckCircle } from "lucide-react";

const benefits = [
  {
    title: "Build In Minutes, Not Months",
    description:
      "Create customized AI agents quickly and easily. Our intuitive platform lets you deploy powerful AI employees without any coding required.",
    features: [
      "No-code agent builder",
      "Pre-built templates for common roles",
      "Instant deployment to multiple platforms",
    ],
  },
  {
    title: "Your AI, Your Rules",
    description:
      "Full control over your AI agents. Configure exactly how they work, what they know, and how they interact with users.",
    features: [
      "Customizable personality and tone",
      "Selective knowledge sharing",
      "Tailored tool capabilities",
    ],
  },
  {
    title: "Scale Your Workforce",
    description:
      "Deploy as many AI employees as you need. Each agent can handle unlimited conversations simultaneously, working 24/7 without breaks.",
    features: [
      "Unlimited conversations",
      "24/7 availability",
      "Cost-effective AI workforce",
    ],
  },
];

export function Benefits() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Why Create AI Employees?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our platform provides everything you need to build, deploy, and
            manage powerful AI agents that work for you around the clock.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <MotionDiv
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-background rounded-lg p-8 shadow-lg"
            >
              <h3 className="text-2xl font-semibold mb-4">{benefit.title}</h3>
              <p className="text-muted-foreground mb-6">
                {benefit.description}
              </p>
              <ul className="space-y-3">
                {benefit.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 mr-2 flex-shrink-0" />
                    <span>{feature}</span>
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
