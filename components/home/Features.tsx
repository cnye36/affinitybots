"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  Workflow,
  Database,
  Brain,
  BarChart3,
  GitBranch,
  Zap,
  FileText,
  Cpu,
} from "lucide-react";

interface Feature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

const FEATURES: Feature[] = [
  {
    id: "multi-agent",
    name: "Multi-Agent Collaboration",
    description: "Create teams of specialized AI agents that work together seamlessly, sharing context and handing off tasks to deliver complex workflows with coordinated intelligence.",
    icon: <Users className="w-5 h-5" />,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-500/10",
    borderColor: "border-blue-200 dark:border-blue-500/40",
  },
  {
    id: "workflows",
    name: "Automated Workflows",
    description: "Build powerful automation with our visual drag-and-drop interface. Design complex processes that orchestrate multiple agents, tools, and decision points.",
    icon: <Workflow className="w-5 h-5" />,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-500/10",
    borderColor: "border-purple-200 dark:border-purple-500/40",
  },
  {
    id: "tools",
    name: "Tools & Integrations",
    description: "Connect to 70+ services via MCP servers including Google, Slack, GitHub, Supabase, and more. Extend your agents' capabilities with seamless integrations.",
    icon: <Zap className="w-5 h-5" />,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-500/10",
    borderColor: "border-yellow-200 dark:border-yellow-500/40",
  },
  {
    id: "knowledge",
    name: "Knowledge & Memory",
    description: "Upload documents, websites, and custom data to ground your agents in your domain. Enable long-term memory so conversations stay contextual over time.",
    icon: <Brain className="w-5 h-5" />,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
    borderColor: "border-emerald-200 dark:border-emerald-500/40",
  },
  {
    id: "analytics",
    name: "Analytics & Activity",
    description: "Track agent performance, workflow usage, and response quality in real-time. Monitor adoption and optimize your AI operations with comprehensive dashboards.",
    icon: <BarChart3 className="w-5 h-5" />,
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-50 dark:bg-cyan-500/10",
    borderColor: "border-cyan-200 dark:border-cyan-500/40",
  },
  {
    id: "model-agnostic",
    name: "Model Agnostic",
    description: "Choose from leading AI providers including OpenAI, Anthropic, and Google Gemini. Switch models seamlessly, compare performance, and optimize costs without vendor lock-in.",
    icon: <Cpu className="w-5 h-5" />,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-50 dark:bg-pink-500/10",
    borderColor: "border-pink-200 dark:border-pink-500/40",
  },
  {
    id: "monitoring",
    name: "Real-time Monitoring",
    description: "Get 24/7 observability into your AI operations with detailed tracing, reasoning transparency, and run-by-run insights to debug and improve workflows.",
    icon: <Database className="w-5 h-5" />,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-500/10",
    borderColor: "border-indigo-200 dark:border-indigo-500/40",
  },
  {
    id: "triggers",
    name: "Trigger-driven Execution",
    description: "Automate workflows based on events like new leads, support tickets, or form submissions. Set up event-based automation that responds instantly to changes.",
    icon: <FileText className="w-5 h-5" />,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-500/10",
    borderColor: "border-orange-200 dark:border-orange-500/40",
  },
];

export function Features() {

  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4">Features</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Everything you need to build and deploy AI agents that work for your business
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {FEATURES.map((feature, index) => {
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={`relative rounded-xl border-2 p-5 backdrop-blur-sm ${feature.bgColor} ${feature.borderColor} shadow-lg dark:shadow-xl shadow-black/5 dark:shadow-black/20 hover:shadow-xl dark:hover:shadow-2xl transition-shadow duration-300`}
              >
                {/* Gradient overlay */}
                <div className="absolute inset-0 rounded-xl opacity-10 dark:opacity-20 bg-gradient-to-br from-white dark:from-white/5 to-transparent" />

                {/* Feature content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className="mb-3">
                    <div className={`inline-flex p-2.5 rounded-lg ${feature.color} ${feature.bgColor} shadow-md dark:shadow-lg`}>
                      {feature.icon}
                    </div>
                  </div>

                  {/* Name and description */}
                  <div className="space-y-2">
                    <div className="font-semibold text-sm text-foreground">
                      {feature.name}
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      {feature.description}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
