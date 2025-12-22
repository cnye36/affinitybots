"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Send, Paperclip } from "lucide-react";
import { SiGoogledrive, SiNotion } from "react-icons/si";

const conversationExamples = [
  {
    userMessage: "Create a content plan for next month and add it to Google Drive",
    aiResponse: "I've created a comprehensive 30-day content plan with 12 posts across your channels. The plan includes 4 blog posts, 6 social media posts, and 2 email campaigns. I've saved it as 'Content_Plan_January_2026.docx' to your Google Drive in the 'Content Strategy' folder. Each piece is aligned with your KPIs and optimized for your target audience.",
  },
  {
    userMessage: "Analyze our competitor's social media approach and create 5 ways to improve our strategy, add it to our Notion Database",
    aiResponse: "I've analyzed your top 3 competitors. They're focusing heavily on video content (65% of posts) and posting 3x per week. Their engagement peaks on Tuesdays and Thursdays. I've created a strategic improvement document with 5 actionable recommendations and added it to your 'Marketing Strategy' Notion database. The document includes benchmarks, specific action items, and timeline recommendations.",
  },
  {
    userMessage: "What's the best content strategy for Q1? Save the recommendations to Google Drive",
    aiResponse: "For Q1, I recommend focusing on educational content that addresses your audience's goals. Based on your data, blog posts and video tutorials perform best during this period. I've created a detailed content strategy document with calendar templates, topic suggestions, and KPIs. The document has been saved to your Google Drive in the 'Q1_Planning' folder.",
  },
];

interface Message {
  id: number;
  type: "user" | "ai";
  text: string;
  isTyping: boolean;
}

export function AnimatedTestImplement() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [currentTypingMessageId, setCurrentTypingMessageId] = useState<number | null>(null);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let timeouts: NodeJS.Timeout[] = [];
    let cursorInterval: NodeJS.Timeout | null = null;
    let messageIdCounter = 1;
    let exampleIndex = 0;
    let isRunning = true;
    let isAnimating = false;

    const runAnimation = () => {
      if (!isRunning || isAnimating) return;
      isAnimating = true;
      
      const currentExample = conversationExamples[exampleIndex];
      
      // Clear old messages before starting each new conversation
      setMessages([]);
      messageIdCounter = 1;
      
      // Add user message and start typing
      const userMessageId = messageIdCounter++;
      setMessages((prev) => [
        ...prev,
        { id: userMessageId, type: "user", text: "", isTyping: true },
      ]);
      setCurrentTypingMessageId(userMessageId);

      // Type user message
      let userCharIndex = 0;
      const typeUserMessage = () => {
        if (!isRunning) return;
        if (userCharIndex < currentExample.userMessage.length) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === userMessageId
                ? { ...msg, text: currentExample.userMessage.slice(0, userCharIndex + 1) }
                : msg
            )
          );
          userCharIndex++;
          timeouts.push(setTimeout(typeUserMessage, 40));
        } else {
          // User message complete, mark as not typing
          setMessages((prev) =>
            prev.map((msg) => (msg.id === userMessageId ? { ...msg, isTyping: false } : msg))
          );
          setCurrentTypingMessageId(null);
          
          // Wait then add AI message
          timeouts.push(setTimeout(() => {
            if (!isRunning) return;
            const aiMessageId = messageIdCounter++;
            setMessages((prev) => [
              ...prev,
              { id: aiMessageId, type: "ai", text: "", isTyping: true },
            ]);
            setCurrentTypingMessageId(aiMessageId);
            
            // Type AI response
            let aiCharIndex = 0;
            const typeAiMessage = () => {
              if (!isRunning) return;
              if (aiCharIndex < currentExample.aiResponse.length) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, text: currentExample.aiResponse.slice(0, aiCharIndex + 1) }
                      : msg
                  )
                );
                aiCharIndex++;
                timeouts.push(setTimeout(typeAiMessage, 20));
              } else {
                // AI message complete
                setMessages((prev) =>
                  prev.map((msg) => (msg.id === aiMessageId ? { ...msg, isTyping: false } : msg))
                );
                setCurrentTypingMessageId(null);
                
                // Wait then move to next example
                timeouts.push(setTimeout(() => {
                  if (!isRunning) return;
                  isAnimating = false;
                  exampleIndex = (exampleIndex + 1) % conversationExamples.length;
                  setCurrentExampleIndex(exampleIndex);
                  // Restart animation
                  timeouts.push(setTimeout(() => runAnimation(), 500));
                }, 2000));
              }
            };
            typeAiMessage();
          }, 800));
        }
      };
      
      typeUserMessage();
    };

    // Cursor blinking
    cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);

    // Start with first example after initial delay
    timeouts.push(setTimeout(() => runAnimation(), 2000));

    return () => {
      isRunning = false;
      isAnimating = false;
      timeouts.forEach(clearTimeout);
      if (cursorInterval) clearInterval(cursorInterval);
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center p-3 md:p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-md bg-background border border-border rounded-xl shadow-xl overflow-hidden flex flex-col"
        style={{ height: "100%" }}
      >
        {/* Chat Header */}
        <div className="flex items-center gap-2 p-3 border-b border-border">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">CP</span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-foreground">Content Planner</div>
            <div className="text-xs text-muted-foreground">AI Agent</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded flex items-center justify-center bg-muted/50 border border-border">
              <SiGoogledrive className="w-4 h-4 text-foreground" />
            </div>
            <div className="w-7 h-7 rounded flex items-center justify-center bg-muted/50 border border-border">
              <SiNotion className="w-4 h-4 text-foreground" />
            </div>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  message.type === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">
                  {message.text}
                  {message.isTyping && showCursor && (
                    <span
                      className={`inline-block w-0.5 h-4 ml-1 align-middle ${
                        message.type === "user" ? "bg-primary-foreground" : "bg-foreground"
                      }`}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg border border-border px-3 py-2">
            <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Send a message..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              readOnly
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

