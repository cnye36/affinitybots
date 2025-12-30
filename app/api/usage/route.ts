import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/supabase/server"
import { getUserUsageStats } from "@/lib/subscription/usage"

export const runtime = "nodejs"

/**
 * GET /api/usage
 * Get user's current AI usage statistics
 */
export async function GET(request: NextRequest) {
	try {
		const supabase = await createClient()
		const {
			data: { user },
		} = await supabase.auth.getUser()

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		// Get userId from query param (for admin access) or use authenticated user
		const url = new URL(request.url)
		const requestedUserId = url.searchParams.get("userId")
		const userId = requestedUserId === user.id ? user.id : user.id

		const stats = await getUserUsageStats(userId)

		// Handle missing usage data gracefully (shouldn't happen for admins, but handle it)
		if (!stats.usage) {
			// Return defaults for admins or users without records
			return NextResponse.json({
				success: true,
				data: {
					userId,
					planType: stats.planType,
					monthlyChargedCostUsd: 0,
					monthlyTokenBudgetUsd: stats.limits.monthlyTokenBudgetUsd === Infinity ? "unlimited" : stats.limits.monthlyTokenBudgetUsd,
					usagePercentage: 0,
					remainingBudget: stats.limits.monthlyTokenBudgetUsd === Infinity ? "unlimited" : stats.limits.monthlyTokenBudgetUsd,
					agentCount: 0,
					maxAgents: stats.limits.maxAgents === Infinity ? "unlimited" : stats.limits.maxAgents,
					activeWorkflowCount: 0,
					maxActiveWorkflows: stats.limits.maxActiveWorkflows === Infinity ? "unlimited" : stats.limits.maxActiveWorkflows,
				},
			})
		}

		// Calculate usage percentage (handle Infinity for admin plan)
		const budgetLimit = stats.limits.monthlyTokenBudgetUsd
		const usagePercentage = budgetLimit === Infinity 
			? 0 
			: (stats.usage.monthlyChargedCostUsd / budgetLimit) * 100
		const remainingBudget = budgetLimit === Infinity 
			? "unlimited" 
			: Math.max(0, budgetLimit - stats.usage.monthlyChargedCostUsd)

		return NextResponse.json({
			success: true,
			data: {
				userId: stats.usage.userId,
				planType: stats.planType,
				monthlyChargedCostUsd: stats.usage.monthlyChargedCostUsd,
				monthlyTokenBudgetUsd: budgetLimit === Infinity ? "unlimited" : budgetLimit,
				usagePercentage: Math.min(100, usagePercentage),
				remainingBudget,
				agentCount: stats.usage.agentCount,
				maxAgents: stats.limits.maxAgents === Infinity ? "unlimited" : stats.limits.maxAgents,
				activeWorkflowCount: stats.usage.activeWorkflowCount,
				maxActiveWorkflows: stats.limits.maxActiveWorkflows === Infinity ? "unlimited" : stats.limits.maxActiveWorkflows,
			},
		})
	} catch (error) {
		console.error("Error fetching usage:", error)
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Internal server error",
			},
			{ status: 500 }
		)
	}
}
