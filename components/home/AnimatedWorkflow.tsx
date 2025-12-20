"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, FileText } from "lucide-react";

interface WorkflowNode {
  id: string;
  name: string;
  agent: string;
  color: string;
  icon: string;
  position: { x: number; y: number };
}

const nodes: WorkflowNode[] = [
  {
    id: "trigger",
    name: "Start Here",
    agent: "Manual Trigger",
    color: "from-blue-500 to-cyan-500",
    icon: "▶",
    position: { x: 2, y: 2 },
  },
  {
    id: "agent1",
    name: "Research",
    agent: "Research Agent",
    color: "from-purple-500 to-pink-500",
    icon: "🔍",
    position: { x: 25, y: 25 },
  },
  {
    id: "agent2",
    name: "Create Content",
    agent: "Content Agent",
    color: "from-emerald-500 to-teal-500",
    icon: "✍️",
    position: { x: 45, y: 50 },
  },
  {
    id: "agent3",
    name: "Review & Publish",
    agent: "Review Agent",
    color: "from-orange-500 to-yellow-500",
    icon: "✓",
    position: { x: 62, y: 76 },
  },
];

const articleTitles = [
  "The Future of AI-Powered Content Creation",
  "How Multi-Agent Workflows Transform Business Operations",
  "Building Intelligent Automation with AI Agents",
  "Content Strategy for the Modern Digital Age",
  "Leveraging AI Teams for Scalable Growth",
];

export function AnimatedWorkflow() {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [completedNodeIds, setCompletedNodeIds] = useState<Set<string>>(new Set());
  const [showDocument, setShowDocument] = useState(false);
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  const isRunningRef = useRef(true);
  const isAnimatingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use Intersection Observer to detect when component is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Only run animation when visible
    if (!isVisible) return;

    let timeouts: NodeJS.Timeout[] = [];

    const runWorkflow = () => {
      // Reset animation state if stuck
      if (isAnimatingRef.current) {
        isAnimatingRef.current = false;
      }
      
      if (!isRunningRef.current || isAnimatingRef.current) return;
      isAnimatingRef.current = true;

      // Reset
      setActiveNodeId(null);
      setCompletedNodeIds(new Set());
      setShowDocument(false);

      // Start with trigger
      timeouts.push(setTimeout(() => {
        if (!isRunningRef.current) return;
        setActiveNodeId("trigger");
      }, 500));

      // Complete trigger and move to agent 1
      timeouts.push(setTimeout(() => {
        if (!isRunningRef.current) return;
        setCompletedNodeIds(new Set(["trigger"]));
        setActiveNodeId("agent1");
      }, 2000));

      // Complete agent 1 and move to agent 2
      timeouts.push(setTimeout(() => {
        if (!isRunningRef.current) return;
        setCompletedNodeIds(new Set(["trigger", "agent1"]));
        setActiveNodeId("agent2");
      }, 4000));

      // Complete agent 2 and move to agent 3
      timeouts.push(setTimeout(() => {
        if (!isRunningRef.current) return;
        setCompletedNodeIds(new Set(["trigger", "agent1", "agent2"]));
        setActiveNodeId("agent3");
      }, 6000));

      // Complete agent 3 and show document
      timeouts.push(setTimeout(() => {
        if (!isRunningRef.current) return;
        setCompletedNodeIds(new Set(["trigger", "agent1", "agent2", "agent3"]));
        setActiveNodeId(null);
        setShowDocument(true);
      }, 8000));

      // Hide document and move to next article, then loop
      timeouts.push(setTimeout(() => {
        if (!isRunningRef.current) return;
        setShowDocument(false);
        setCurrentArticleIndex((prev) => (prev + 1) % articleTitles.length);
        isAnimatingRef.current = false;
        // Restart after brief pause
        timeouts.push(setTimeout(() => {
          if (isRunningRef.current && isVisible) {
            runWorkflow();
          }
        }, 1000));
      }, 11000));
    };

    // Reset animation state when visibility changes
    if (isVisible) {
      isAnimatingRef.current = false;
      // Start with first example after a brief delay
      timeouts.push(setTimeout(() => {
        if (isRunningRef.current && isVisible) {
          runWorkflow();
        }
      }, 500));
    } else {
      // Reset state when not visible
      isAnimatingRef.current = false;
      setActiveNodeId(null);
      setCompletedNodeIds(new Set());
      setShowDocument(false);
    }

    return () => {
      isRunningRef.current = false;
      isAnimatingRef.current = false;
      timeouts.forEach(clearTimeout);
    };
  }, [isVisible]);

  const getNodeState = (nodeId: string) => {
    if (activeNodeId === nodeId) return "processing";
    if (completedNodeIds.has(nodeId)) return "completed";
    return "idle";
  };

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center p-4 md:p-6 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative w-full h-full bg-background border border-border rounded-xl shadow-xl overflow-hidden"
      >
        {/* Grid background */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(148, 163, 184, 0.3) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(148, 163, 184, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: "20px 20px",
            }}
          />
        </div>


        {/* Nodes */}
        <div className="relative w-full h-full">
          {nodes.map((node) => {
            const state = getNodeState(node.id);
            const isActive = state === "processing";
            const isCompleted = state === "completed";

            return (
              <motion.div
                key={node.id}
                className="absolute"
                style={{
                  left: `${node.position.x}%`,
                  top: `${node.position.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                {/* Glow effect when active */}
                {isActive && (
                  <motion.div
                    className={`absolute inset-0 rounded-xl bg-gradient-to-br ${node.color} opacity-40 blur-xl`}
                    animate={{ opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}

                <div
                  className={`relative rounded-lg border-2 p-2.5 min-w-[140px] max-w-[160px] transition-all duration-500 ${
                    isActive
                      ? `border-primary shadow-lg shadow-primary/30 bg-gradient-to-br ${node.color} bg-opacity-10`
                      : "border-border bg-muted/30"
                  }`}
                >
                  {/* Icon and status */}
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                        isActive
                          ? `bg-gradient-to-br ${node.color} text-white`
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isActive ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <span className="text-xs">{node.icon}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-xs font-semibold leading-tight ${
                          isActive ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {node.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground leading-tight">{node.agent}</div>
                    </div>
                  </div>

                  {/* Status badge */}
                  {isActive && (
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] px-1 py-0.5 rounded bg-primary/20 text-primary">
                        processing
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Animated Document - Finished Article */}
        <AnimatePresence>
          {showDocument && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute inset-4 md:inset-6 bg-background border-2 border-primary/30 rounded-xl shadow-2xl overflow-hidden z-20"
            >
              {/* Document header */}
              <div className="border-b border-border p-4 bg-muted/30">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">Generated Article</span>
                  <div className="ml-auto flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-emerald-400">Published</span>
                  </div>
                </div>
              </div>

              {/* Document content */}
              <div className="p-6 md:p-8 overflow-y-auto h-full">
                {/* Article title */}
                <motion.h1
                  key={currentArticleIndex}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-2xl md:text-3xl font-bold text-foreground mb-6 leading-tight"
                >
                  {articleTitles[currentArticleIndex]}
                </motion.h1>

                {/* Skeleton content */}
                <div className="space-y-4">
                  {/* Paragraph 1 */}
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-5/6" />
                    <div className="h-4 bg-muted rounded w-4/6" />
                  </div>

                  {/* Paragraph 2 */}
                  <div className="space-y-2 pt-2">
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </div>

                  {/* Subheading */}
                  <div className="pt-4">
                    <div className="h-5 bg-muted/60 rounded w-2/5 mb-3" />
                  </div>

                  {/* Paragraph 3 */}
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-5/6" />
                    <div className="h-4 bg-muted rounded w-4/5" />
                  </div>

                  {/* Bullet points */}
                  <div className="space-y-2 pt-2 pl-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                      <div className="h-4 bg-muted rounded w-3/4" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                      <div className="h-4 bg-muted rounded w-4/5" />
                    </div>
                  </div>

                  {/* Paragraph 4 */}
                  <div className="space-y-2 pt-4">
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-5/6" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

