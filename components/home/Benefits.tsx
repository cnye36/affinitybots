"use client";

import React from "react";
import { MotionDiv } from "@/components/motion/MotionDiv";
import { CheckCircle } from "lucide-react";

const benefits = [
  {
    title: "Rapid Development",
    description:
      "Build and deploy AI workflows in minutes, not months. Our visual builder and pre-built components accelerate your development cycle.",
    features: [
      "Drag-and-drop workflow builder",
      "Pre-configured AI agent templates",
      "Real-time testing and validation",
    ],
  },
  {
    title: "Enterprise-Grade Security",
    description:
      "Rest easy knowing your AI workflows are secure. We provide enterprise-level security features and compliance standards.",
    features: [
      "End-to-end encryption",
      "Role-based access control",
      "Audit logging and compliance",
    ],
  },
  {
    title: "Scalable Architecture",
    description:
      "Our platform grows with your needs. Scale from prototype to production without worrying about infrastructure.",
    features: [
      "Auto-scaling infrastructure",
      "High availability deployment",
      "Load balancing and failover",
    ],
  },
];

export function Benefits() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Why Choose AgentHub?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our platform provides everything you need to build, deploy, and
            scale AI workflows with confidence.
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
