"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Upload, 
  CheckCircle2, 
  FileText, 
  File,
  ChevronDown,
} from "lucide-react";
import {
    SiGmail,
    SiNotion,
    SiSlack,
  } from "react-icons/si";

const tools = [
  { name: "Gmail", icon: <SiGmail className="w-4 h-4" />, color: "from-red-500 to-red-600" },
  { name: "Notion", icon: <SiNotion className="w-4 h-4" />, color: "from-gray-700 to-gray-800" },
  { name: "Slack", icon: <SiSlack className="w-4 h-4" />, color: "from-purple-500 to-purple-600" },
];

const knowledgeFiles = [
  { name: "AI-Agents-Build-Specs.txt", type: "text" },
  { name: "Business_Plan.pdf", type: "pdf" },
];

export function AnimatedToolsKnowledge() {
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);
  const [activeToolIndex, setActiveToolIndex] = useState(0);
  const [contentScale, setContentScale] = useState(1);

  useEffect(() => {
    let timeouts: NodeJS.Timeout[] = [];
    let interval: NodeJS.Timeout | null = null;

    const runAnimation = () => {
      // Start: Show collapsed state
      setIsToolsExpanded(false);
      setContentScale(1);
     
      setActiveToolIndex(0);

      // After 1s: Expand tools section and scale down content
      timeouts.push(setTimeout(() => {
        setIsToolsExpanded(true);
        setContentScale(0.75); // Scale down to fit everything and keep "Add Tools" visible
      }, 1000));

      // After 3s: Start cycling through active tools
      timeouts.push(setTimeout(() => {
        interval = setInterval(() => {
          setActiveToolIndex((prev) => (prev + 1) % tools.length);
        }, 1500);
      }, 3000));

      // After 10s: Reset and loop
      timeouts.push(setTimeout(() => {
        if (interval) clearInterval(interval);
        setIsToolsExpanded(false);
        setContentScale(1);
        setActiveToolIndex(0);
        // Restart after brief pause
        setTimeout(() => runAnimation(), 1500);
      }, 10000));
    };

    runAnimation();

    return () => {
      timeouts.forEach(clearTimeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center p-3 md:p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-md bg-background border border-border rounded-xl shadow-xl overflow-hidden"
      >
        <motion.div
          animate={{ scale: contentScale }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="p-3 md:p-4 space-y-2 origin-center"
        >
          {/* Add Tools Section */}
          <div className="space-y-2">
            <motion.button
              onClick={() => setIsToolsExpanded(!isToolsExpanded)}
              className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-lg border border-border transition-colors"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-foreground" />
                <span className="text-sm font-medium text-foreground">Add Tools</span>
              </div>
              <motion.div
                animate={{ rotate: isToolsExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {isToolsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1.5 pt-1.5">
                    {tools.map((tool, index) => {
                      const isActive = index === activeToolIndex;
                      return (
                        <motion.div
                          key={tool.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ 
                            opacity: 1, 
                            x: 0,
                            scale: isActive ? 1.02 : 1,
                          }}
                          transition={{ delay: index * 0.1 }}
                          className={`relative p-2 rounded-lg border-2 transition-all ${
                            isActive
                              ? "border-primary bg-primary/5 shadow-md"
                              : "border-border bg-muted/30"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center text-lg`}>
                                {tool.icon}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-foreground">{tool.name}</div>
                                <div className="text-xs text-muted-foreground">Official MCP server</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                  Official
                                </span>
                                <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Configured
                                </span>
                              </div>
                              <motion.div
                                className={`w-11 h-6 rounded-full relative cursor-pointer ${
                                  isActive ? "bg-emerald-500" : "bg-slate-600"
                                }`}
                                animate={{
                                  backgroundColor: isActive ? "#10b981" : "#475569",
                                }}
                                transition={{ duration: 0.3 }}
                              >
                                <motion.div
                                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                                  animate={{
                                    x: isActive ? 20 : 0,
                                  }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 30,
                                  }}
                                />
                              </motion.div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Add Knowledge Section */}
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-lg border border-border transition-colors">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-foreground" />
                <span className="text-sm font-medium text-foreground">Add Knowledge</span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Knowledge Files */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              className="space-y-2"
            >
              <div className="text-xs font-medium text-muted-foreground px-1">
                Queued files ({knowledgeFiles.length})
              </div>
              {knowledgeFiles.map((file, index) => (
                <motion.div
                  key={file.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2 + index * 0.2 }}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border"
                >
                  <div className="w-8 h-8 rounded flex items-center justify-center bg-primary/10">
                    {file.type === "pdf" ? (
                      <FileText className="w-4 h-4 text-primary" />
                    ) : (
                      <File className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{file.name}</div>
                    <div className="text-xs text-muted-foreground">Queued</div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

