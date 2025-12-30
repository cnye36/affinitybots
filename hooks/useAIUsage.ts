import { useState, useEffect, useCallback } from "react"

export interface AIUsageData {
	userId: string
	planType: "free" | "starter" | "pro"
	monthlyChargedCostUsd: number
	monthlyTokenBudgetUsd: number
	usagePercentage: number
	remainingBudget: number
	agentCount: number
	maxAgents: number
	activeWorkflowCount: number
	maxActiveWorkflows: number
}

interface UseAIUsageOptions {
	userId?: string
	autoRefresh?: boolean
	refreshInterval?: number
}

export function useAIUsage({
	userId,
	autoRefresh = false,
	refreshInterval = 30000,
}: UseAIUsageOptions = {}) {
	const [usage, setUsage] = useState<AIUsageData | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const fetchUsage = useCallback(
		async (silent: boolean = false) => {
			if (!userId) {
				setUsage(null)
				setError(null)
				return
			}

			if (!silent) setLoading(true)
			setError(null)

			try {
				const response = await fetch(`/api/usage?userId=${encodeURIComponent(userId)}`)

				if (!response.ok) {
					throw new Error(`Failed to fetch usage: ${response.statusText}`)
				}

				const result = await response.json()

				if (result.success) {
					setUsage(result.data)
				} else {
					throw new Error(result.error || "Failed to fetch usage")
				}
			} catch (err) {
				console.error("AI usage fetch error:", err)
				setError(err instanceof Error ? err.message : "Unknown error")
			} finally {
				if (!silent) setLoading(false)
			}
		},
		[userId]
	)

	// Initial fetch
	useEffect(() => {
		fetchUsage()
	}, [fetchUsage])

	// Auto-refresh (optional)
	useEffect(() => {
		if (!autoRefresh || !userId) return

		const interval = setInterval(() => fetchUsage(true), refreshInterval)
		return () => clearInterval(interval)
	}, [autoRefresh, userId, refreshInterval, fetchUsage])

	// Refresh on server-signaled updates
	useEffect(() => {
		const handler = () => fetchUsage(true)
		if (typeof window !== "undefined") {
			window.addEventListener("ai-usage:updated", handler as EventListener)
		}
		return () => {
			if (typeof window !== "undefined") {
				window.removeEventListener("ai-usage:updated", handler as EventListener)
			}
		}
	}, [fetchUsage])

	// Calculate warning levels
	const isAt75Percent = usage ? usage.usagePercentage >= 75 && usage.usagePercentage < 90 : false
	const isAt90Percent = usage ? usage.usagePercentage >= 90 && usage.usagePercentage < 100 : false
	const isAtLimit = usage ? usage.usagePercentage >= 100 : false

	return {
		usage,
		loading,
		error,
		isAt75Percent,
		isAt90Percent,
		isAtLimit,
		refetch: fetchUsage,
	}
}
