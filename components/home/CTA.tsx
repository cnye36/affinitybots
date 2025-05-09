"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MotionDiv } from "@/components/motion/MotionDiv";

export function CTA() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10" />
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
            Ready to Create Your AI Workforce?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create a complete digital workforce with agents that work directly
            with you and others that serve your customers. Build your
            personalized AI hub today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/early-access">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Request Early Access
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Contact Sales
              </Button>
            </Link>
          </div>
        </MotionDiv>
      </div>
    </section>
  );
}
