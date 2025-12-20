"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MotionDiv } from "@/components/motion/MotionDiv";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-background border border-border rounded-2xl p-8 md:p-10 shadow-lg">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                Ready to Build Your AI Workforce?
              </h2>
              <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8 max-w-xl mx-auto">
                Start creating intelligent agents and workflows today. No coding required.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                <Link href="/pricing">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto px-6 md:px-8 py-5 md:py-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-base md:text-lg"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto px-6 md:px-8 py-5 md:py-6 text-base md:text-lg"
                  >
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </MotionDiv>
      </div>
    </section>
  );
}
