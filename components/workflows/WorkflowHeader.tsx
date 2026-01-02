import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Zap, Loader2, Brain, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { WorkflowActiveToggle } from "./WorkflowActiveToggle"

type ViewMode = "editor" | "executions"

interface WorkflowHeaderProps {
	workflowName: string,
	setWorkflowName: (name: string) => void,
	onNameBlur?: () => void,
	onExecute: () => void,
	onBack: () => void,
	executing: boolean,
	workflowId?: string,
	mode?: ViewMode,
	onModeChange?: (mode: ViewMode) => void,
	workflowType?: "sequential" | "orchestrator",
	isActive?: boolean,
	onActiveToggle?: (isActive: boolean) => void,
}

export function WorkflowHeader({
	workflowName,
	setWorkflowName,
	onNameBlur,
	onExecute,
	onBack,
	executing,
	workflowId,
	mode = "editor",
	onModeChange,
	workflowType = "sequential",
	isActive = false,
	onActiveToggle,
}: WorkflowHeaderProps) {
	return (
		<div className="relative bg-gradient-to-br from-blue-50/80 via-cyan-50/60 to-indigo-50/80 dark:from-blue-950/30 dark:via-cyan-950/20 dark:to-indigo-950/30 border-b border-blue-200/50 dark:border-blue-800/30 backdrop-blur-sm">
			{/* Subtle gradient overlay for depth */}
			<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent dark:via-white/5 pointer-events-none" />

			<div className="relative flex items-center justify-between p-4 gap-4">
				{/* Left Section */}
				<div className="flex items-center gap-4 flex-1 min-w-0">
					{/* Back Button with gradient hover */}
					<Button
						variant="ghost"
						onClick={onBack}
						className="group flex items-center gap-2 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-cyan-500/10 dark:hover:from-blue-400/10 dark:hover:to-cyan-400/10 transition-all duration-200"
					>
						<ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
						<span className="hidden sm:inline">Back to Workflows</span>
					</Button>

					{/* Workflow Type Badge */}
					<Badge
						variant="outline"
						className={cn(
							"capitalize font-medium px-3 py-1.5 flex items-center gap-1.5",
							workflowType === "orchestrator"
								? "border-purple-500/50 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 text-purple-700 dark:text-purple-400"
								: "border-blue-500/50 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 text-blue-700 dark:text-blue-400"
						)}
					>
						{workflowType === "orchestrator" ? (
							<>
								<Brain className="h-3.5 w-3.5" />
								Orchestrator
							</>
						) : (
							<>
								<ArrowRight className="h-3.5 w-3.5" />
								Sequential
							</>
						)}
					</Badge>

					{/* Workflow Name Input with gradient focus and auto-save */}
					<div className="relative flex-1 max-w-md">
						<Input
							placeholder="Enter workflow name"
							value={workflowName}
							onChange={(e) => setWorkflowName(e.target.value)}
							onBlur={onNameBlur}
							className={cn(
								"text-base font-medium bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm",
								"border-2 border-blue-200/50 dark:border-blue-800/50",
								"focus:border-transparent focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-cyan-400/50",
								"transition-all duration-200",
								"placeholder:text-gray-400 dark:placeholder:text-gray-500",
							)}
						/>
					</div>
				</div>

				{/* Right Section */}
				<div className="flex gap-2 items-center flex-shrink-0">
					
					{/* Active Status Toggle */}
					{workflowId && (
						<WorkflowActiveToggle
							workflowId={workflowId}
							isActive={isActive}
							onToggle={onActiveToggle}
						/>
					)}
					
					{/* Mode Toggle with gradient active state */}
					{workflowId && (
						<div className="rounded-lg border-2 border-blue-200/50 dark:border-blue-800/50 p-1 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
							<div className="flex gap-1">
								<Button
									variant={mode === "editor" ? "default" : "ghost"}
									size="sm"
									onClick={() => onModeChange?.("editor")}
									className={cn(
										"transition-all duration-200",
										mode === "editor" && [
											"bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600",
											"hover:from-blue-600 hover:to-cyan-600 dark:hover:from-blue-700 dark:hover:to-cyan-700",
											"text-white shadow-md shadow-blue-500/30 dark:shadow-blue-600/20",
										],
									)}
								>
									Editor
								</Button>
								<Button
									variant={mode === "executions" ? "default" : "ghost"}
									size="sm"
									onClick={() => onModeChange?.("executions")}
									className={cn(
										"transition-all duration-200",
										mode === "executions" && [
											"bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600",
											"hover:from-blue-600 hover:to-cyan-600 dark:hover:from-blue-700 dark:hover:to-cyan-700",
											"text-white shadow-md shadow-blue-500/30 dark:shadow-blue-600/20",
										],
									)}
								>
									Executions
								</Button>
							</div>
						</div>
					)}

					{/* Execute Button with emerald gradient */}
					<Button
						onClick={onExecute}
						disabled={executing}
						className={cn(
							"group relative overflow-hidden",
							"bg-gradient-to-r from-emerald-500 to-green-500 dark:from-emerald-600 dark:to-green-600",
							"hover:from-emerald-600 hover:to-green-600 dark:hover:from-emerald-700 dark:hover:to-green-700",
							"text-white shadow-lg shadow-emerald-500/30 dark:shadow-emerald-600/20",
							"transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/40 dark:hover:shadow-emerald-600/30",
							"disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
						)}
					>
						{/* Shine effect on hover */}
						<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

						<div className="relative flex items-center gap-2">
							{executing ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									<span className="hidden sm:inline">Executing...</span>
									<span className="sm:hidden">Running</span>
								</>
							) : (
								<>
									<Zap className="h-4 w-4" />
									<span className="hidden sm:inline">Execute Workflow</span>
									<span className="sm:hidden">Execute</span>
								</>
							)}
						</div>
					</Button>
				</div>
			</div>
		</div>
	)
}
