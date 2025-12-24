import { Button } from "@/components/ui/button"
import { Network, Play, Bot, Link2, Sparkles, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyWorkflowStateProps {
	onAddTrigger: () => void,
}

export function EmptyWorkflowState({ onAddTrigger }: EmptyWorkflowStateProps) {
	return (
		<div className="flex flex-col items-center gap-8 p-12 text-center max-w-2xl mx-auto">
			{/* Large gradient icon */}
			<div className="relative">
				{/* Glowing background effect */}
				<div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 dark:from-blue-400/30 dark:to-cyan-400/30 blur-3xl animate-pulse" />

				{/* Icon container with gradient */}
				<div
					className={cn(
						"relative flex h-24 w-24 items-center justify-center rounded-2xl",
						"bg-gradient-to-br from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600",
						"shadow-2xl shadow-blue-500/30 dark:shadow-blue-600/20",
						"transform transition-transform hover:scale-110 hover:rotate-3 duration-300",
					)}
				>
					<Network className="h-12 w-12 text-white" />
				</div>
			</div>

			{/* Title with gradient */}
			<div className="flex flex-col gap-3">
				<h3
					className={cn(
						"text-3xl font-bold",
						"bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400",
						"bg-clip-text text-transparent",
					)}
				>
					Build Your First Workflow
				</h3>
				<p className="text-base text-muted-foreground max-w-md leading-relaxed">
					Create powerful AI-driven workflows that automate your tasks. Start by adding a
					trigger to define when your workflow runs.
				</p>
			</div>

			{/* Feature highlights */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-2">
				{/* Step 1: Start with trigger */}
				<div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20 border border-emerald-200/50 dark:border-emerald-800/30">
					<div
						className={cn(
							"flex h-12 w-12 items-center justify-center rounded-lg",
							"bg-gradient-to-br from-emerald-500 to-green-500 dark:from-emerald-600 dark:to-green-600",
							"shadow-lg shadow-emerald-500/30",
						)}
					>
						<Play className="h-6 w-6 text-white" />
					</div>
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2 justify-center">
							<div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 dark:bg-emerald-600 text-white text-xs font-bold shadow-md">
								1
							</div>
							<h4 className="text-sm font-semibold">Start with a Trigger</h4>
						</div>
						<p className="text-xs text-muted-foreground">
							Choose how your workflow starts
						</p>
					</div>
				</div>

				{/* Step 2: Add AI tasks */}
				<div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20 border border-violet-200/50 dark:border-violet-800/30">
					<div
						className={cn(
							"flex h-12 w-12 items-center justify-center rounded-lg",
							"bg-gradient-to-br from-violet-500 to-purple-500 dark:from-violet-600 dark:to-purple-600",
							"shadow-lg shadow-violet-500/30",
						)}
					>
						<Bot className="h-6 w-6 text-white" />
					</div>
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2 justify-center">
							<div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 dark:bg-violet-600 text-white text-xs font-bold shadow-md">
								2
							</div>
							<h4 className="text-sm font-semibold">Add AI Agents</h4>
						</div>
						<p className="text-xs text-muted-foreground">
							Assign agents to process data
						</p>
					</div>
				</div>

				{/* Step 3: Connect and automate */}
				<div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200/50 dark:border-blue-800/30">
					<div
						className={cn(
							"flex h-12 w-12 items-center justify-center rounded-lg",
							"bg-gradient-to-br from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600",
							"shadow-lg shadow-blue-500/30",
						)}
					>
						<Link2 className="h-6 w-6 text-white" />
					</div>
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2 justify-center">
							<div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 dark:bg-blue-600 text-white text-xs font-bold shadow-md">
								3
							</div>
							<h4 className="text-sm font-semibold">Connect & Automate</h4>
						</div>
						<p className="text-xs text-muted-foreground">
							Chain tasks for complex workflows
						</p>
					</div>
				</div>
			</div>

			{/* CTA Button */}
			<Button
				onClick={onAddTrigger}
				size="lg"
				className={cn(
					"group relative overflow-hidden mt-4",
					"bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600",
					"hover:from-blue-600 hover:to-cyan-600 dark:hover:from-blue-700 dark:hover:to-cyan-700",
					"text-white text-base font-semibold",
					"shadow-2xl shadow-blue-500/40 dark:shadow-blue-600/30",
					"transition-all duration-300 hover:shadow-3xl hover:shadow-blue-500/50 hover:scale-105",
					"px-8 py-6",
				)}
			>
				{/* Shine effect */}
				<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

				{/* Animated sparkle effect */}
				<div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
					<Sparkles className="absolute top-2 right-2 h-4 w-4 text-white/60 animate-pulse" />
					<Sparkles className="absolute bottom-2 left-2 h-3 w-3 text-white/60 animate-pulse delay-150" />
				</div>

				<div className="relative flex items-center gap-2">
					<Zap className="h-5 w-5" />
					<span>Add Trigger to Get Started</span>
				</div>
			</Button>

			{/* Additional help text */}
			<p className="text-xs text-muted-foreground max-w-sm">
				Don&apos;t worry, you can always modify your workflow later. Start simple and add
				complexity as you go.
			</p>
		</div>
	)
}
