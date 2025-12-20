"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const baseText = "I need an agent that can help me";

const textOptions = [
  "with my marketing research and synthesize industry trends, competitor moves, and market size.",
  "with my content strategy and turn goals and audience data into channel plans and editorial calendars.",
  "analyze customer support tickets, identify patterns and trends, and provide actionable recommendations to improve response times.",
  "manage my social media presence by creating engaging posts, scheduling content across platforms, and analyzing performance metrics.",
  "conduct financial analysis, track expenses, generate reports, and provide insights on budget optimization and investment opportunities.",
];

// Helper function to get first 25-30 words (including base text)
const getShortenedText = (option: string): string => {
  const fullText = baseText + " " + option;
  const words = fullText.split(" ");
  // Take first 28 words (base text is 8 words, so we add ~20 more)
  const shortenedWords = words.slice(0, 28);
  return shortenedWords.join(" ");
};

export function AnimatedAgentCreation() {
  const [displayText, setDisplayText] = useState("");
  const [currentOptionIndex, setCurrentOptionIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [isErasing, setIsErasing] = useState(false);
  const [showEllipsis, setShowEllipsis] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const currentFullText = getShortenedText(textOptions[currentOptionIndex]);
    const baseTextWithSpace = baseText + " ";

    if (isTyping && !isErasing) {
      // Typing phase
      if (displayText.length < currentFullText.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentFullText.slice(0, displayText.length + 1));
        }, 30); // Typing speed
      } else {
        // Finished typing, add ellipsis
        if (!showEllipsis) {
          setShowEllipsis(true);
          setDisplayText(currentFullText + "...");
        } else {
          // Show ellipsis for a moment, then start erasing
          timeout = setTimeout(() => {
            setIsTyping(false);
            setIsErasing(true);
          }, 1500); // Pause after showing ellipsis
        }
      }
    } else if (isErasing) {
      // Erasing phase
      if (displayText.length > baseTextWithSpace.length) {
        // Erase one character at a time (including ellipsis)
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 20); // Erasing speed (slightly faster)
      } else {
        // Finished erasing, move to next option
        setIsErasing(false);
        setIsTyping(true);
        setShowEllipsis(false);
        setCurrentOptionIndex((prev) => (prev + 1) % textOptions.length);
        // Reset to base text with space for next option
        setDisplayText(baseTextWithSpace);
      }
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [displayText, currentOptionIndex, isTyping, isErasing, showEllipsis]);

  // Initialize with base text
  useEffect(() => {
    setDisplayText(baseText + " ");
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-md bg-background border border-border rounded-xl shadow-xl overflow-hidden"
      >
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Description Field */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm md:text-base font-medium text-foreground">
                Describe Your AI Agent
              </label>
              <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">
              Tell us what you want your AI agent to do. We'll infer the best agent profile,
              craft a strong system prompt, and set sensible defaults.
            </p>
            <div className="relative">
              <textarea
                value={displayText}
                placeholder="Example: I need an agent that can help me with my marketing research."
                className="w-full h-32 md:h-40 px-3 py-2 bg-background border border-border rounded-lg text-sm md:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                readOnly
              />
              <motion.div
                className="absolute bottom-2 right-2 w-0.5 h-4 bg-primary"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
