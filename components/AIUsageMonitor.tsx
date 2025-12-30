"use client"

import React, { useState, useEffect } from "react"
import { useAIUsage } from "@/hooks/useAIUsage"
import { AlertCircle, Zap } from "lucide-react"
import { usdToCredits, getPlanCredits } from "@/lib/subscription/credits"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/useToast"

interface AIUsageMonitorProps {
	userId?: string
	onLimitReached?: () => void
}

export function AIUsageMonitor({ userId, onLimitReached }: AIUsageMonitorProps) {
	const { usage, isAt75Percent, isAt90Percent, isAtLimit } = useAIUsage({
		userId,
		autoRefresh: true,
		refreshInterval: 30000,
	})

	const { toast } = useToast()
	const [show90Dialog, setShow90Dialog] = useState(false)
	const [show100Dialog, setShow100Dialog] = useState(false)
	const [has75Warning, setHas75Warning] = useState(false)
	const [has90Warning, setHas90Warning] = useState(false)

	// Show 75% warning toast (once per session)
	useEffect(() => {
		if (isAt75Percent && !has75Warning && usage) {
			setHas75Warning(true)
			const usedCredits = usdToCredits(usage.monthlyChargedCostUsd)
			const totalCredits = getPlanCredits(usage.planType)
			toast({
				title: "Approaching Usage Limit",
				description: `You've used ${usage.usagePercentage.toFixed(0)}% of your monthly AI credits (${usedCredits.toLocaleString()} of ${totalCredits.toLocaleString()} credits).`,
				variant: "default",
			})
		}
	}, [isAt75Percent, has75Warning, usage, toast])

	// Show 90% warning dialog (once per session)
	useEffect(() => {
		if (isAt90Percent && !has90Warning && usage) {
			setHas90Warning(true)
			setShow90Dialog(true)
		}
	}, [isAt90Percent, has90Warning, usage])

	// Show 100% limit dialog
	useEffect(() => {
		if (isAtLimit && usage) {
			setShow100Dialog(true)
			onLimitReached?.()
		}
	}, [isAtLimit, usage, onLimitReached])

	if (!userId || !usage) {
		return null
	}

	return (
		<>
			{/* 90% Warning Dialog */}
			<Dialog open={show90Dialog} onOpenChange={setShow90Dialog}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center space-x-2">
							<AlertCircle className="h-5 w-5 text-yellow-500" />
							<span>Running Low on AI Credits</span>
						</DialogTitle>
						<DialogDescription>
							You've used {usage.usagePercentage.toFixed(0)}% of your monthly AI budget.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
							<div className="flex justify-between items-center mb-2">
								<span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
									Current Usage
								</span>
								<span className="text-sm font-bold text-yellow-900 dark:text-yellow-100">
									{usdToCredits(usage.monthlyChargedCostUsd).toLocaleString()} / {getPlanCredits(usage.planType).toLocaleString()} credits
								</span>
							</div>
							<div className="w-full bg-yellow-200 dark:bg-yellow-900 rounded-full h-2">
								<div
									className="bg-yellow-500 h-2 rounded-full transition-all"
									style={{ width: `${Math.min(usage.usagePercentage, 100)}%` }}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<p className="text-sm text-muted-foreground">Would you like to purchase additional AI credits?</p>

							<div className="flex gap-2">
								<Button
									variant="outline"
									className="flex-1"
									onClick={() => {
										window.location.href = "/settings?tab=billing&action=upgrade"
									}}
								>
									Upgrade Plan
								</Button>
								<Button
									className="flex-1"
									onClick={() => {
										window.location.href = "/settings?tab=billing&action=buy-credits"
									}}
								>
									<Zap className="mr-2 h-4 w-4" />
									Buy Credits
								</Button>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button variant="ghost" onClick={() => setShow90Dialog(false)}>
							Continue Anyway
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 100% Limit Reached Dialog */}
			<Dialog open={show100Dialog} onOpenChange={setShow100Dialog}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center space-x-2">
							<AlertCircle className="h-5 w-5 text-red-500" />
							<span>AI Credit Limit Reached</span>
						</DialogTitle>
						<DialogDescription>
							You've reached your monthly AI usage limit. Purchase additional credits to continue.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
							<div className="flex justify-between items-center mb-2">
								<span className="text-sm font-medium text-red-900 dark:text-red-100">Monthly Credits</span>
								<span className="text-sm font-bold text-red-900 dark:text-red-100">
									{usdToCredits(usage.monthlyChargedCostUsd).toLocaleString()} / {getPlanCredits(usage.planType).toLocaleString()} credits
								</span>
							</div>
							<div className="w-full bg-red-200 dark:bg-red-900 rounded-full h-2">
								<div className="bg-red-500 h-2 rounded-full transition-all" style={{ width: "100%" }} />
							</div>
						</div>

						<div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
							<h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Your Options:</h4>
							<ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
								<li>Purchase additional AI credits</li>
								<li>Upgrade to a higher plan for more monthly credits</li>
								<li>Wait until next month when your credits reset</li>
							</ul>
						</div>
					</div>

					<DialogFooter className="flex gap-2 sm:gap-2">
						<Button
							variant="outline"
							className="flex-1"
							onClick={() => {
								window.location.href = "/settings?tab=billing&action=upgrade"
							}}
						>
							Upgrade Plan
						</Button>
						<Button
							className="flex-1"
							onClick={() => {
								window.location.href = "/settings?tab=billing&action=buy-credits"
							}}
						>
							<Zap className="mr-2 h-4 w-4" />
							Buy Credits
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
