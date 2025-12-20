"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Zap,
  BarChart3,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface Metric {
  id: string;
  label: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "neutral";
  icon: React.ReactNode;
  color: string;
  borderColor: string;
}

export function AnimatedMonitorImprove() {
  const [completedRuns, setCompletedRuns] = useState(1247);
  const [activeWorkflows, setActiveWorkflows] = useState(8);
  const [avgLatency, setAvgLatency] = useState(1.2);
  const [successRate, setSuccessRate] = useState(98.5);
  const [chartData, setChartData] = useState<number[]>([]);
  
  const isRunningRef = useRef(true);

  // Initialize chart data
  useEffect(() => {
    const initialData = Array.from({ length: 12 }, () => Math.random() * 40 + 60);
    setChartData(initialData);
  }, []);

  useEffect(() => {
    let timeouts: NodeJS.Timeout[] = [];
    let runsInterval: NodeJS.Timeout | null = null;
    let latencyInterval: NodeJS.Timeout | null = null;

    // Continuously increment runs (slowly, randomly)
    runsInterval = setInterval(() => {
      if (!isRunningRef.current) return;
      
      setCompletedRuns((prev) => {
        // Randomly increment by 1, with occasional increments of 2
        // Update every 3-6 seconds on average
        const shouldIncrement = Math.random() > 0.7; // 30% chance each interval
        if (shouldIncrement) {
          const increment = Math.random() > 0.8 ? 2 : 1; // 20% chance of +2, 80% chance of +1
          return prev + increment;
        }
        return prev;
      });
    }, 3000); // Check every 3 seconds

    // Continuously update latency (small fluctuations)
    latencyInterval = setInterval(() => {
      if (!isRunningRef.current) return;
      
      setAvgLatency((prev) => {
        // Small random change between -0.1 and +0.1
        const change = (Math.random() - 0.5) * 0.2;
        const newValue = prev + change;
        // Keep between 1.0 and 1.3
        return Math.max(1.0, Math.min(1.3, newValue));
      });
    }, 2000); // Update every 2 seconds

    // Update other metrics less frequently
    const updateOtherMetrics = () => {
      if (!isRunningRef.current) return;
      
      // Animate active workflows (fluctuating between 6-12)
      setActiveWorkflows((prev) => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const newValue = prev + change;
        return Math.max(6, Math.min(12, newValue));
      });

      // Animate success rate (fluctuating between 96-99.5%)
      setSuccessRate((prev) => {
        const change = (Math.random() - 0.5) * 0.3;
        const newValue = prev + change;
        return Math.max(96, Math.min(99.5, newValue));
      });

      // Update chart data (shift left and add new point)
      setChartData((prev) => {
        const newData = [...prev.slice(1)];
        const lastValue = prev[prev.length - 1] || 70;
        const change = (Math.random() - 0.5) * 8;
        newData.push(Math.max(50, Math.min(100, lastValue + change)));
        return newData;
      });
    };

    // Update other metrics every 4-6 seconds
    const scheduleUpdate = () => {
      const delay = Math.random() * 2000 + 4000; // 4000-6000ms
      timeouts.push(setTimeout(() => {
        if (isRunningRef.current) {
          updateOtherMetrics();
          scheduleUpdate();
        }
      }, delay));
    };

    scheduleUpdate();

    return () => {
      isRunningRef.current = false;
      timeouts.forEach(clearTimeout);
      if (runsInterval) clearInterval(runsInterval);
      if (latencyInterval) clearInterval(latencyInterval);
    };
  }, []);

  const metrics: Metric[] = [
    {
      id: "runs",
      label: "Completed Runs",
      value: completedRuns,
      unit: "",
      trend: "up",
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: "from-emerald-500 to-teal-500",
      borderColor: "border-emerald-500/30",
    },
    {
      id: "workflows",
      label: "Active Workflows",
      value: activeWorkflows,
      unit: "",
      trend: "neutral",
      icon: <Zap className="w-4 h-4" />,
      color: "from-blue-500 to-cyan-500",
      borderColor: "border-blue-500/30",
    },
    {
      id: "latency",
      label: "Avg Latency",
      value: avgLatency,
      unit: "s",
      trend: avgLatency < 1.5 ? "down" : "up",
      icon: <Clock className="w-4 h-4" />,
      color: "from-purple-500 to-pink-500",
      borderColor: "border-purple-500/30",
    },
    {
      id: "success",
      label: "Success Rate",
      value: successRate,
      unit: "%",
      trend: successRate > 98 ? "up" : "neutral",
      icon: <TrendingUp className="w-4 h-4" />,
      color: "from-orange-500 to-yellow-500",
      borderColor: "border-orange-500/30",
    },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center p-3 md:p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative w-full h-full bg-background border border-border rounded-xl shadow-xl overflow-hidden flex flex-col"
      >
        {/* Dashboard Header */}
        <div className="border-b border-border p-2.5 md:p-3 bg-muted/30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="text-sm md:text-base font-semibold text-foreground">Analytics Dashboard</h3>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-400">Live</span>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-3 md:space-y-4">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-lg border-2 p-3 md:p-4 bg-gradient-to-br ${metric.color} bg-opacity-5 ${metric.borderColor}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md bg-gradient-to-br ${metric.color} text-white`}>
                      {metric.icon}
                    </div>
                    <div className="text-xs text-foreground/80">{metric.label}</div>
                  </div>
                  {metric.trend !== "neutral" && (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                      className={`flex items-center gap-0.5 ${
                        metric.trend === "up" ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {metric.trend === "up" ? (
                        <ArrowUp className="w-3 h-3" />
                      ) : (
                        <ArrowDown className="w-3 h-3" />
                      )}
                    </motion.div>
                  )}
                </div>
                <motion.div
                  key={`${metric.id}-${metric.value}`}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-xl md:text-2xl font-bold text-foreground"
                >
                  {metric.value.toFixed(metric.id === "latency" ? 1 : metric.id === "success" ? 1 : 0)}
                  <span className="text-sm md:text-base text-muted-foreground ml-1">{metric.unit}</span>
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Activity Chart */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-xs md:text-sm font-medium text-foreground">Activity (Last 12 Runs)</span>
              </div>
              <span className="text-xs text-muted-foreground">Performance</span>
            </div>
            <div className="relative h-24 md:h-32 bg-muted/30 rounded-lg p-2 md:p-3 border border-border">
              {/* Chart Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between p-2 md:p-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-px bg-border/50" />
                ))}
              </div>
              
              {/* Chart Bars */}
              <div className="relative h-full flex items-end justify-between gap-1">
                {chartData.map((value, index) => {
                  const height = `${value}%`;
                  const isLatest = index === chartData.length - 1;
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ height: 0 }}
                      animate={{ height }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className={`flex-1 rounded-t ${
                        isLatest
                          ? "bg-gradient-to-t from-primary to-primary/60"
                          : "bg-gradient-to-t from-primary/40 to-primary/20"
                      }`}
                      style={{ minHeight: "4px" }}
                    >
                      {isLatest && (
                        <motion.div
                          className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary"
                          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-2 pb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-xs md:text-sm font-medium text-foreground">Recent Activity</span>
            </div>
            <div className="space-y-1.5">
              {[
                { id: 1, text: "Workflow 'Content Pipeline' completed", time: "2s ago", status: "success" },
                { id: 2, text: "Agent 'Research Bot' processing", time: "5s ago", status: "processing" },
                { id: 3, text: "Workflow 'Data Analysis' started", time: "8s ago", status: "info" },
              ].map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/30 border border-border"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.status === "success"
                          ? "bg-emerald-500"
                          : activity.status === "processing"
                          ? "bg-blue-500 animate-pulse"
                          : "bg-primary"
                      }`}
                    />
                    <span className="text-xs text-foreground truncate">{activity.text}</span>
                  </div>
                  <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{activity.time}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

