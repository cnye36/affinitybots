"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  SiGmail,
  SiNotion,
  SiSlack,
  SiGoogle,
  SiGithub,
  SiSupabase,
  SiHubspot,
  SiFigma,
  SiCanva,
  SiLinear,
  SiRedis,
} from "react-icons/si";

interface Tool {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

// Custom Exa logo component
const ExaLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6">
    <defs>
      <linearGradient id="exa-gradient-demo" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
    <path
      d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
      stroke="url(#exa-gradient-demo)"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);


const TOOLS: Tool[] = [
  {
    id: "gmail",
    name: "Gmail",
    icon: <SiGmail className="w-6 h-6" />,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30",
  },
  {
    id: "notion",
    name: "Notion",
    icon: <SiNotion className="w-6 h-6 text-gray-800 dark:text-white" />,
    color: "text-gray-700 dark:text-gray-200",
    bgColor: "bg-gray-50 dark:bg-gray-800/10 border-gray-200 dark:border-gray-500/30",
  },
  {
    id: "slack",
    name: "Slack",
    icon: <SiSlack className="w-6 h-6" />,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30",
  },
  {
    id: "google",
    name: "Google Drive",
    icon: <SiGoogle className="w-6 h-6" />,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30",
  },
  {
    id: "github",
    name: "GitHub",
    icon: <SiGithub className="w-6 h-6" />,
    color: "text-gray-700 dark:text-gray-200",
    bgColor: "bg-gray-50 dark:bg-gray-800/10 border-gray-200 dark:border-gray-500/30",
  },
  {
    id: "supabase",
    name: "Supabase",
    icon: <SiSupabase className="w-6 h-6" />,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    icon: <SiHubspot className="w-6 h-6" />,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30",
  },
  {
    id: "figma",
    name: "Figma",
    icon: <SiFigma className="w-6 h-6" />,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30",
  },
  {
    id: "canva",
    name: "Canva",
    icon: <SiCanva className="w-6 h-6" />,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30",
  },
  {
    id: "linear",
    name: "Linear",
    icon: <SiLinear className="w-6 h-6" />,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30",
  },
  {
    id: "exa",
    name: "Exa",
    icon: <ExaLogo />,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30",
  },
  {
    id: "redis",
    name: "Redis",
    icon: <SiRedis className="w-6 h-6" />,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30",
  },
];

export function AnimatedIntegrationDemo() {
  const [activeTools, setActiveTools] = useState<Set<string>>(new Set(["gmail", "notion"]));
  const [pulseIndex, setPulseIndex] = useState<number | null>(null);

  useEffect(() => {
    const toolIds = TOOLS.map((t) => t.id);
    
    const updateTools = () => {
      setActiveTools((prevActive) => {
        const newSet = new Set<string>();
        
        // Randomly decide how many tools should be active (between 2 and all tools)
        const minActive = 2;
        const maxActive = TOOLS.length;
        const targetActiveCount = Math.floor(Math.random() * (maxActive - minActive + 1)) + minActive;
        
        // Randomly select which tools should be active
        const shuffled = [...toolIds].sort(() => Math.random() - 0.5);
        const selectedTools = shuffled.slice(0, targetActiveCount);
        
        selectedTools.forEach((id) => {
          newSet.add(id);
        });
        
        // Find which tool was just activated (wasn't active before, is active now)
        const newlyActivated = selectedTools.find((id) => !prevActive.has(id));
        if (newlyActivated) {
          const activatedIndex = TOOLS.findIndex((t) => t.id === newlyActivated);
          setPulseIndex(activatedIndex);
          // Clear pulse after animation
          setTimeout(() => setPulseIndex(null), 600);
        }
        
        return newSet;
      });
    };
    
    // Initial update
    updateTools();
    
    // Random interval between 2.5s and 4.5s for slower, more natural feel
    const scheduleNext = () => {
      const delay = Math.random() * 2000 + 2500; // 2500-4500ms
      setTimeout(() => {
        updateTools();
        scheduleNext();
      }, delay);
    };
    
    scheduleNext();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {TOOLS.map((tool, index) => {
        const isActive = activeTools.has(tool.id);
        const isPulsing = pulseIndex !== null && pulseIndex === index && isActive;

        return (
          <motion.div
            key={tool.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: 1,
              scale: isActive ? 1 : 0.95,
            }}
            transition={{ duration: 0.3 }}
            className={`relative rounded-lg border-2 p-4 transition-all duration-300 ${index >= 6 ? 'hidden md:block' : ''} ${
              isActive
                ? `${tool.bgColor} border-opacity-60 dark:border-opacity-40 shadow-lg`
                : "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50"
            }`}
          >
            {/* Pulse effect when activating */}
            {isPulsing && (
              <motion.div
                className={`absolute inset-0 rounded-lg ${tool.bgColor}`}
                initial={{ opacity: 0.5, scale: 1 }}
                animate={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              />
            )}

            {/* Tool icon and name */}
            <div className="relative z-10 flex items-center gap-3">
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                  isActive
                    ? `${tool.color} bg-white/20 dark:bg-white/10`
                    : "text-slate-400 dark:text-slate-500 bg-slate-200 dark:bg-slate-700/50"
                }`}
              >
                {tool.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={`font-medium text-sm transition-colors duration-300 ${
                    isActive ? "text-foreground" : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {tool.name}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {isActive ? "Connected" : "Available"}
                </div>
              </div>
            </div>

            {/* Toggle switch */}
            <div className="absolute top-4 right-4">
              <motion.div
                className={`w-11 h-6 rounded-full relative cursor-pointer ${
                  isActive ? "bg-emerald-500 dark:bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                }`}
                animate={{
                  backgroundColor: isActive ? "#10b981" : undefined,
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

            {/* Active indicator glow */}
            {isActive && (
              <motion.div
                className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

