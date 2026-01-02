"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Loader2, Power, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/useToast"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"

interface WorkflowActiveToggleProps {
	workflowId: string
	isActive: boolean
	onToggle?: (isActive: boolean) => void
}

export function WorkflowActiveToggle({
	workflowId,
	isActive,
	onToggle,
}: WorkflowActiveToggleProps) {
	const [loading, setLoading] = useState(false)
	const [activeState, setActiveState] = useState(isActive)

	const handleToggle = async () => {
		setLoading(true)

		try {
			const response = await fetch(`/api/workflows/${workflowId}/toggle-active`, {
				method: "POST",
			})

			const data = await response.json()

			if (!response.ok) {
				if (response.status === 403 && data.message) {
					// Show subscription limit error
					toast({
						title: "Limit reached",
						description: data.message,
						variant: "destructive",
					})
				} else {
					throw new Error(data.error || "Failed to toggle workflow")
				}
				return
			}

			setActiveState(data.is_active)
			onToggle?.(data.is_active)

			toast({
				title: data.is_active ? "Workflow activated" : "Workflow deactivated",
				description: data.is_active
					? "Your workflow is now active and will run automatically"
					: "Your workflow has been deactivated",
			})
		} catch (error) {
			console.error("Error toggling workflow:", error)
			toast({
				title: "Error",
				description: "Failed to update workflow status",
				variant: "destructive",
			})
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="flex items-center gap-2">
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="flex items-center gap-2">
							{loading ? (
								<Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
							) : (
								<Switch
									checked={activeState}
									onCheckedChange={handleToggle}
									disabled={loading}
									className={cn(
										"data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-emerald-500 data-[state=checked]:to-green-500",
										"data-[state=checked]:dark:from-emerald-600 data-[state=checked]:dark:to-green-600"
									)}
								/>
							)}

							<Badge
								variant="outline"
								className={cn(
									"px-3 py-1.5 transition-all duration-200",
									activeState
										? "border-emerald-500/50 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 text-emerald-700 dark:text-emerald-400"
										: "border-gray-400/50 bg-gray-50 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400"
								)}
							>
								{activeState ? (
									<>
										<Zap className="h-3.5 w-3.5 mr-1.5" />
										Active
									</>
								) : (
									<>
										<Power className="h-3.5 w-3.5 mr-1.5" />
										Inactive
									</>
								)}
							</Badge>
						</div>
					</TooltipTrigger>
					<TooltipContent>
						<p className="text-sm">
							{activeState
								? "Workflow will run automatically when triggered"
								: "Activate to enable automatic execution"}
						</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	)
}
