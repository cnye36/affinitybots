"use client";

import React from "react";
import { MotionDiv } from "@/components/motion/MotionDiv";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for trying out AI-Automated",
    features: [
      "Up to 3 AI agents",
      "Basic workflow builder",
      "Community support",
      "1 concurrent workflow",
      "Standard templates",
    ],
    cta: "Get Started",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "per month",
    description: "For professionals and growing teams",
    features: [
      "Unlimited AI agents",
      "Advanced workflow builder",
      "Priority support",
      "10 concurrent workflows",
      "Custom templates",
      "API access",
      "Advanced analytics",
    ],
    cta: "Start Free Trial",
    href: "/signup?plan=pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations with custom needs",
    features: [
      "Everything in Pro",
      "Custom AI model integration",
      "Dedicated support",
      "Unlimited concurrent workflows",
      "Custom security features",
      "SLA guarantee",
      "On-premise deployment",
    ],
    cta: "Contact Sales",
    href: "/contact",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that best fits your needs. All plans include a
            14-day free trial.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <MotionDiv
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className={`relative rounded-lg p-8 ${
                plan.highlighted
                  ? "bg-gradient-to-b from-blue-500 to-purple-600 text-white shadow-xl scale-105"
                  : "bg-card border border-border"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span
                      className={`text-sm ${
                        plan.highlighted
                          ? "text-blue-100"
                          : "text-muted-foreground"
                      }`}
                    >
                      {plan.period}
                    </span>
                  )}
                </div>
                <p
                  className={`${
                    plan.highlighted ? "text-blue-100" : "text-muted-foreground"
                  }`}
                >
                  {plan.description}
                </p>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check
                      className={`h-5 w-5 mr-2 flex-shrink-0 ${
                        plan.highlighted ? "text-blue-200" : "text-primary"
                      }`}
                    />
                    <span className={plan.highlighted ? "text-blue-100" : ""}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <Link href={plan.href}>
                <Button
                  className={`w-full ${
                    plan.highlighted
                      ? "bg-white text-primary hover:bg-blue-50"
                      : "bg-primary"
                  }`}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </Link>
            </MotionDiv>
          ))}
        </div>
      </div>
    </section>
  );
}
