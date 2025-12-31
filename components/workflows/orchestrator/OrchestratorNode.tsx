"use client";

import { useState } from "react";
import { Handle, Position } from "reactflow";
import { Brain, Settings, PlusCircle, Play, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrchestratorNodeData } from "@/types/workflow";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

const statusConfig: Record<string, { color: string, glow: string }> = {
	idle: {
		color: "bg-gray-400 dark:bg-gray-500",
		glow: "",
	},
	running: {
		color: "bg-blue-500 dark:bg-blue-400",
		glow: "shadow-lg shadow-blue-500/50 animate-pulse",
	},
	completed: {
		color: "bg-emerald-500 dark:bg-emerald-400",
		glow: "shadow-lg shadow-emerald-500/50",
	},
	error: {
		color: "bg-red-500 dark:bg-red-400",
		glow: "shadow-lg shadow-red-500/50",
	},
	testing: {
		color: "bg-yellow-500 dark:bg-yellow-400",
		glow: "shadow-lg shadow-yellow-500/50 animate-pulse",
	},
	testSuccess: {
		color: "bg-emerald-500 dark:bg-emerald-400",
		glow: "shadow-lg shadow-emerald-500/50",
	},
	testError: {
		color: "bg-red-500 dark:bg-red-400",
		glow: "shadow-lg shadow-red-500/50",
	},
};

interface OrchestratorNodeProps {
  data: OrchestratorNodeData;
  selected?: boolean;
}

export function OrchestratorNode({ data, selected }: OrchestratorNodeProps) {
	const [testStatus, setTestStatus] = useState<"idle" | "testing" | "testSuccess" | "testError">("idle")

	const handlePlayClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		data.onConfigure()
	}

	const handleDeleteClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (data.onDelete) {
			data.onDelete()
		}
	}

	const status = data.status || "idle"
	const displayStatus = testStatus !== "idle" ? testStatus : status
	const statusInfo = statusConfig[displayStatus] || statusConfig.idle

  return (
    <div
      className="relative group"
      onDoubleClick={(e) => {
        e.stopPropagation()
        data.onConfigure()
      }}
    >
			{/* Status indicator and action buttons - positioned outside top-right */}
			<div className="absolute -top-8 right-0 flex items-center gap-2 z-20">
				{/* Play button for executing orchestrator */}
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								onClick={handlePlayClick}
								className={cn(
									"p-1.5 rounded-lg",
									"bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm",
									"hover:bg-white dark:hover:bg-gray-700",
									"transition-all duration-200 hover:scale-110",
									"shadow-md border border-gray-200 dark:border-gray-700",
									testStatus === "testing" && "opacity-50 cursor-not-allowed",
								)}
								disabled={testStatus === "testing"}
							>
								<Play className="h-3 w-3 text-gray-700 dark:text-gray-300 fill-current" />
							</button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Execute Orchestrator</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>

				{/* Status indicator dot - positioned next to play button */}
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<div
								className={cn(
									"w-3 h-3 rounded-full ring-2 ring-white dark:ring-gray-900",
									statusInfo.color,
									statusInfo.glow,
								)}
							/>
						</TooltipTrigger>
						<TooltipContent>
							<p className="capitalize">Status: {displayStatus}</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>

				{/* Delete button */}
				{data.onDelete && (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									onClick={handleDeleteClick}
									className={cn(
										"p-1.5 rounded-lg",
										"bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm",
										"hover:bg-red-50 dark:hover:bg-red-900/20",
										"transition-all duration-200 hover:scale-110",
										"shadow-md border border-gray-200 dark:border-gray-700",
									)}
								>
									<Trash2 className="h-3 w-3 text-red-600 dark:text-red-400" />
								</button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Delete Orchestrator</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)}
			</div>
      {/* Target handle on LEFT for trigger connection (horizontal flow) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !border-2 !border-white dark:!border-gray-900 !bg-emerald-500 dark:!bg-emerald-400 !shadow-[0_0_6px_rgba(16,185,129,0.5)] dark:!shadow-[0_0_8px_rgba(52,211,153,0.6)] !rounded-full"
        style={{ left: -6 }}
      />

      {/* Circular orchestrator node */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Glowing ring effect */}
        <div
          className={cn(
            "absolute inset-0 rounded-full transition-all duration-200",
            selected
              ? "ring-4 ring-emerald-500/50 shadow-2xl shadow-emerald-500/30"
              : "ring-2 ring-emerald-300/30 dark:ring-emerald-700/30 group-hover:ring-emerald-400/50 dark:group-hover:ring-emerald-600/50"
          )}
        />

        {/* Outer gradient ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 p-[3px]">
          {/* Inner background */}
          <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Animated gradient overlay */}
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-emerald-600/10",
                "group-hover:from-emerald-500/20 group-hover:via-green-500/20 group-hover:to-emerald-600/20",
                "transition-all duration-300"
              )}
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center gap-1.5">
              {/* Brain icon with pulsing effect */}
              <div
                className={cn(
                  "w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-500",
                  "flex items-center justify-center shadow-lg",
                  selected && "animate-pulse"
                )}
              >
                <Brain className="w-6 h-6 text-white" />
              </div>

              {/* Label */}
              <div className="text-center">
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
                  Manager
                </div>
                <div className="text-[8px] text-muted-foreground">
                  Orchestrator
                </div>
              </div>

              {/* Configure button - small icon overlay */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        data.onConfigure();
                      }}
                      className={cn(
                        "absolute -bottom-2 right-1/2 translate-x-1/2",
                        "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                        "p-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600",
                        "shadow-lg text-white"
                      )}
                    >
                      <Settings className="w-3 h-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Configure Orchestrator</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      {/* Add Agent Button - appears below on hover */}
      {data.onAddTask && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onAddTask?.();
          }}
          className={cn(
            "absolute -bottom-16 left-1/2 -translate-x-1/2",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            "p-2 rounded-full",
            "bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600",
            "hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700",
            "hover:shadow-lg shadow-md text-white",
            "flex items-center gap-1.5 text-xs font-medium",
            "whitespace-nowrap z-10",
          )}
          title="Add Agent"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Agent</span>
        </button>
      )}

      {/* Source handle on BOTTOM for agents (vertical flow from orchestrator to agents) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-white dark:!border-gray-900 !bg-emerald-500 dark:!bg-emerald-400 !shadow-[0_0_6px_rgba(16,185,129,0.5)] dark:!shadow-[0_0_8px_rgba(52,211,153,0.6)] !rounded-full"
        style={{ bottom: -6 }}
      />
    </div>
  );
}
