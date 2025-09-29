"use client";

import React from "react";
import { MotionDiv } from "@/components/motion/MotionDiv";

export function FeaturedIn() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h3 className="text-lg font-semibold text-muted-foreground mb-8">
            Featured In
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-8">
            <a 
              href="https://aiagentsdirectory.com/agent/affinitybots?utm_source=badge&utm_medium=referral&utm_campaign=free_listing&utm_content=affinitybots" 
              target="_blank" 
              className="transition-opacity hover:opacity-80"
            >
              <img 
                src="https://aiagentsdirectory.com/featured-badge.svg?v=2024" 
                alt="AffinityBots - Featured AI Agent on AI Agents Directory" 
                width="200" 
                height="50" 
                className="h-auto"
              />
            </a>
            <a 
              href="https://dang.ai/" 
              target="_blank" 
              className="transition-opacity hover:opacity-80"
            >
              <img 
                src="https://cdn.prod.website-files.com/63d8afd87da01fb58ea3fbcb/6487e2868c6c8f93b4828827_dang-badge.png" 
                alt="Dang.ai" 
                width="150" 
                height="54" 
                className="h-auto"
              />
            </a>
            <a 
              href="https://goodaitools.com" 
              target="_blank" 
              className="transition-opacity hover:opacity-80"
            >
              <img 
                src="https://goodaitools.com/assets/images/badge.png" 
                alt="Good AI Tools" 
                height="54" 
                className="h-auto"
              />
            </a>
            {/* Add more featured badges here as you get featured in other places */}
          </div>
        </MotionDiv>
      </div>
    </section>
  );
}
