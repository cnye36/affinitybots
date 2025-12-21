/**
 * Usage tracking and limit enforcement
 *
 * Functions to check and update user usage limits in the database.
 */

import { createClient } from "@/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { PlanType, getPlanLimits, hasExceededLimit } from "./limits"
import { calculateCostFromLlmId } from "../llm/pricing"

export interface UserUsage {
	userId: string
	agentCount: number
	activeWorkflowCount: number
	draftWorkflowCount: number
	integrationCount: number
	monthlyTokensInput: number
	monthlyTokensOutput: number
	monthlyActualCostUsd: number
	monthlyChargedCostUsd: number
	lastMonthlyReset: string
	currentMonth: string
}

export interface UsageCheckResult {
	allowed: boolean
	reason?: string
	current: number
	limit: number | "unlimited"
	planType: PlanType
}

interface SubscriptionData {
	plan_type: PlanType
	status: "trialing" | "active" | "past_due" | "canceled" | "unpaid"
	trial_end: string | null
}

/**
 * Get user's subscription plan type
 */
export async function getUserPlanType(userId: string): Promise<PlanType> {
	const supabase = await getSupabaseAdmin()

	const { data, error } = await supabase
		.from("subscriptions")
		.select("plan_type, status, trial_end")
		.eq("user_id", userId)
		.single()

	if (error || !data) {
		console.error("Error fetching user subscription:", error)
		return "free" // Default to free if error
	}

	const subscription = data as SubscriptionData

	// Check if trial has ended for free users
	if (subscription.plan_type === "free" && subscription.trial_end) {
		const trialEnd = new Date(subscription.trial_end)
		if (trialEnd < new Date()) {
			// Trial ended, but still on free plan - treat as expired trial
			return "free"
		}
	}

	// Check subscription status
	if (subscription.status === "canceled" || subscription.status === "past_due" || subscription.status === "unpaid") {
		return "free" // Downgrade to free if subscription inactive
	}

	return subscription.plan_type
}

interface UserUsageLimitsData {
	user_id: string
	agent_count: number
	active_workflow_count: number
	draft_workflow_count: number
	integration_count: number
	monthly_tokens_input: string | number
	monthly_tokens_output: string | number
	monthly_actual_cost_usd: string | number
	monthly_charged_cost_usd: string | number
	last_monthly_reset: string
	current_month: string
}

/**
 * Get user's current usage from database
 */
export async function getUserUsage(userId: string): Promise<UserUsage | null> {
	const supabase = await getSupabaseAdmin()

	const { data, error } = await supabase
		.from("user_usage_limits")
		.select("*")
		.eq("user_id", userId)
		.single()

	if (error || !data) {
		console.error("Error fetching user usage:", error)
		return null
	}

	const usage = data as UserUsageLimitsData

	return {
		userId: usage.user_id,
		agentCount: usage.agent_count,
		activeWorkflowCount: usage.active_workflow_count,
		draftWorkflowCount: usage.draft_workflow_count,
		integrationCount: usage.integration_count,
		monthlyTokensInput: parseInt(String(usage.monthly_tokens_input)),
		monthlyTokensOutput: parseInt(String(usage.monthly_tokens_output)),
		monthlyActualCostUsd: parseFloat(String(usage.monthly_actual_cost_usd)),
		monthlyChargedCostUsd: parseFloat(String(usage.monthly_charged_cost_usd)),
		lastMonthlyReset: usage.last_monthly_reset,
		currentMonth: usage.current_month,
	}
}

/**
 * Check if user can create a new agent
 */
export async function canCreateAgent(userId: string): Promise<UsageCheckResult> {
	const planType = await getUserPlanType(userId)
	const limits = getPlanLimits(planType)
	const usage = await getUserUsage(userId)

	const current = usage?.agentCount || 0
	const allowed = !hasExceededLimit(current, limits.maxAgents)

	return {
		allowed,
		reason: allowed ? undefined : `You've reached your agent limit (${limits.maxAgents}). Upgrade to create more agents.`,
		current,
		limit: limits.maxAgents === Infinity ? "unlimited" : limits.maxAgents,
		planType,
	}
}

/**
 * Check if user can activate a workflow
 */
export async function canActivateWorkflow(userId: string): Promise<UsageCheckResult> {
	const planType = await getUserPlanType(userId)
	const limits = getPlanLimits(planType)
	const usage = await getUserUsage(userId)

	const current = usage?.activeWorkflowCount || 0
	const allowed = !hasExceededLimit(current, limits.maxActiveWorkflows)

	return {
		allowed,
		reason: allowed ? undefined : `You've reached your active workflow limit (${limits.maxActiveWorkflows}). Upgrade to activate more workflows.`,
		current,
		limit: limits.maxActiveWorkflows === Infinity ? "unlimited" : limits.maxActiveWorkflows,
		planType,
	}
}

/**
 * Check if user can add an integration
 */
export async function canAddIntegration(userId: string): Promise<UsageCheckResult> {
	const planType = await getUserPlanType(userId)
	const limits = getPlanLimits(planType)
	const usage = await getUserUsage(userId)

	const current = usage?.integrationCount || 0
	const allowed = !hasExceededLimit(current, limits.maxIntegrations)

	return {
		allowed,
		reason: allowed ? undefined : `You've reached your integration limit (${limits.maxIntegrations}). Upgrade to add more integrations.`,
		current,
		limit: limits.maxIntegrations === Infinity ? "unlimited" : limits.maxIntegrations,
		planType,
	}
}

/**
 * Check if user can make an AI request (budget check)
 */
export async function canMakeAIRequest(
	userId: string,
	llmId: string,
	estimatedInputTokens: number = 1000,
	estimatedOutputTokens: number = 500
): Promise<UsageCheckResult & { estimatedCost: number }> {
	const planType = await getUserPlanType(userId)
	const limits = getPlanLimits(planType)
	const usage = await getUserUsage(userId)

	const current = usage?.monthlyChargedCostUsd || 0
	const { chargedCost: estimatedCost } = calculateCostFromLlmId(llmId, estimatedInputTokens, estimatedOutputTokens)
	const projectedCost = current + estimatedCost

	const allowed = !hasExceededLimit(projectedCost, limits.monthlyTokenBudgetUsd)

	return {
		allowed,
		reason: allowed
			? undefined
			: `You've exceeded your monthly AI usage budget ($${limits.monthlyTokenBudgetUsd.toFixed(2)}). Upgrade or wait until next month.`,
		current,
		limit: limits.monthlyTokenBudgetUsd,
		planType,
		estimatedCost,
	}
}

/**
 * Increment agent count (call after successful agent creation)
 */
export async function incrementAgentCount(userId: string): Promise<void> {
	const supabase = await getSupabaseAdmin()

	const { error } = await (supabase.rpc as any)("increment_agent_count", { p_user_id: userId })

	if (error) {
		console.error("Error incrementing agent count:", error)
	}
}

/**
 * Decrement agent count (call after agent deletion)
 */
export async function decrementAgentCount(userId: string): Promise<void> {
	const supabase = await getSupabaseAdmin()

	const { error } = await (supabase.rpc as any)("decrement_agent_count", { p_user_id: userId })

	if (error) {
		console.error("Error decrementing agent count:", error)
	}
}

/**
 * Increment active workflow count (call after workflow activation)
 */
export async function incrementActiveWorkflowCount(userId: string): Promise<void> {
	const supabase = await getSupabaseAdmin()

	const { error } = await (supabase.rpc as any)("increment_active_workflow_count", { p_user_id: userId })

	if (error) {
		console.error("Error incrementing workflow count:", error)
	}
}

/**
 * Decrement active workflow count (call after workflow deactivation/deletion)
 */
export async function decrementActiveWorkflowCount(userId: string): Promise<void> {
	const supabase = await getSupabaseAdmin()

	const { error } = await (supabase.rpc as any)("decrement_active_workflow_count", { p_user_id: userId })

	if (error) {
		console.error("Error decrementing workflow count:", error)
	}
}

/**
 * Record AI usage (call after successful AI request)
 */
export async function recordAIUsage(params: {
	userId: string
	modelId: string
	llmId: string
	inputTokens: number
	outputTokens: number
	agentId?: string
	workflowRunId?: string
	sessionId?: string
	requestType?: string
	success?: boolean
	errorMessage?: string
}): Promise<void> {
	const supabase = await getSupabaseAdmin()

	const { actualCost, chargedCost } = calculateCostFromLlmId(params.llmId, params.inputTokens, params.outputTokens)

	// Insert into ai_usage_logs
	const { error: logError } = await ((supabase.from("ai_usage_logs") as any).insert({
		user_id: params.userId,
		model_id: params.modelId,
		llm_id: params.llmId,
		input_tokens: params.inputTokens,
		output_tokens: params.outputTokens,
		actual_cost_usd: actualCost,
		charged_cost_usd: chargedCost,
		agent_id: params.agentId,
		workflow_run_id: params.workflowRunId,
		session_id: params.sessionId,
		request_type: params.requestType || "chat",
		success: params.success !== false,
		error_message: params.errorMessage,
	}))

	if (logError) {
		console.error("Error logging AI usage:", logError)
	}

	// Update user_usage_limits
	const { error: updateError } = await (supabase.rpc as any)("update_ai_usage", {
		p_user_id: params.userId,
		p_input_tokens: params.inputTokens,
		p_output_tokens: params.outputTokens,
		p_actual_cost: actualCost,
		p_charged_cost: chargedCost,
	})

	if (updateError) {
		console.error("Error updating usage limits:", updateError)
	}
}

/**
 * Get user's usage statistics for display
 */
export async function getUserUsageStats(userId: string): Promise<{
	planType: PlanType
	limits: ReturnType<typeof getPlanLimits>
	usage: UserUsage | null
	percentages: {
		agents: number
		workflows: number
		budget: number
	}
}> {
	const planType = await getUserPlanType(userId)
	const limits = getPlanLimits(planType)
	const usage = await getUserUsage(userId)

	const agentPercent = limits.maxAgents === Infinity ? 0 : ((usage?.agentCount || 0) / limits.maxAgents) * 100
	const workflowPercent =
		limits.maxActiveWorkflows === Infinity
			? 0
			: ((usage?.activeWorkflowCount || 0) / limits.maxActiveWorkflows) * 100
	const budgetPercent = ((usage?.monthlyChargedCostUsd || 0) / limits.monthlyTokenBudgetUsd) * 100

	return {
		planType,
		limits,
		usage,
		percentages: {
			agents: Math.min(100, agentPercent),
			workflows: Math.min(100, workflowPercent),
			budget: Math.min(100, budgetPercent),
		},
	}
}
