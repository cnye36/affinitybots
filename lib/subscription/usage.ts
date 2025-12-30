/**
 * Usage tracking and limit enforcement
 *
 * Functions to check and update user usage limits in the database.
 */

import { createClient } from "@/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { PlanType, getPlanLimits, hasExceededLimit } from "./limits"
import { calculateCostFromLlmId } from "../llm/pricing"
import { isAdminEmail } from "@/lib/admin/admin"

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
 * Check if a user is an admin by their email
 */
async function isAdminUser(userId: string): Promise<boolean> {
	try {
		const supabase = await getSupabaseAdmin()
		const { data, error } = await supabase.auth.admin.getUserById(userId)
		
		if (error || !data?.user?.email) {
			return false
		}
		
		return isAdminEmail(data.user.email)
	} catch (error) {
		console.error("Error checking admin status:", error)
		return false
	}
}

/**
 * Get user's subscription plan type
 * Admins automatically get "admin" plan with unlimited access
 * Users in trial period get "pro" limits regardless of selected plan
 */
export async function getUserPlanType(userId: string): Promise<PlanType> {
	// Check if user is admin first
	const isAdmin = await isAdminUser(userId)
	if (isAdmin) {
		return "admin"
	}

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

	// Check if user is in trial period - if so, return "pro" for pro limits
	if (subscription.status === "trialing" && subscription.trial_end) {
		const trialEnd = new Date(subscription.trial_end)
		if (trialEnd > new Date()) {
			// User is in trial - give them pro limits
			return "pro"
		}
	}

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
 * Returns safe defaults for admins if no record exists
 */
export async function getUserUsage(userId: string): Promise<UserUsage | null> {
	const supabase = await getSupabaseAdmin()

	const { data, error } = await supabase
		.from("user_usage_limits")
		.select("*")
		.eq("user_id", userId)
		.single()

	// If no record exists, check if admin and return defaults
	if (error || !data) {
		const isAdmin = await isAdminUser(userId)
		if (isAdmin) {
			// Return zero usage for admins (they have unlimited limits anyway)
			const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
			return {
				userId,
				agentCount: 0,
				activeWorkflowCount: 0,
				draftWorkflowCount: 0,
				integrationCount: 0,
				monthlyTokensInput: 0,
				monthlyTokensOutput: 0,
				monthlyActualCostUsd: 0,
				monthlyChargedCostUsd: 0,
				lastMonthlyReset: new Date().toISOString(),
				currentMonth,
			}
		}
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
 * Admins always have unlimited access
 */
export async function canCreateAgent(userId: string): Promise<UsageCheckResult> {
	// Check if admin first - admins always allowed
	const isAdmin = await isAdminUser(userId)
	if (isAdmin) {
		return {
			allowed: true,
			current: 0,
			limit: "unlimited",
			planType: "admin",
		}
	}

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
 * Admins always have unlimited access
 */
export async function canActivateWorkflow(userId: string): Promise<UsageCheckResult> {
	// Check if admin first - admins always allowed
	const isAdmin = await isAdminUser(userId)
	if (isAdmin) {
		return {
			allowed: true,
			current: 0,
			limit: "unlimited",
			planType: "admin",
		}
	}

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
 * Admins always have unlimited access
 */
export async function canAddIntegration(userId: string): Promise<UsageCheckResult> {
	// Check if admin first - admins always allowed
	const isAdmin = await isAdminUser(userId)
	if (isAdmin) {
		return {
			allowed: true,
			current: 0,
			limit: "unlimited",
			planType: "admin",
		}
	}

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
 * Admins always have unlimited access
 */
export async function canMakeAIRequest(
	userId: string,
	llmId: string,
	estimatedInputTokens: number = 1000,
	estimatedOutputTokens: number = 500
): Promise<UsageCheckResult & { estimatedCost: number }> {
	// Check if admin first - admins always allowed
	const isAdmin = await isAdminUser(userId)
	if (isAdmin) {
		const { chargedCost: estimatedCost } = calculateCostFromLlmId(llmId, estimatedInputTokens, estimatedOutputTokens)
		return {
			allowed: true,
			current: 0,
			limit: "unlimited",
			planType: "admin",
			estimatedCost,
		}
	}

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

/**
 * Get accessible agent IDs for a user based on their plan
 * For starter plan: only first 10 agents created are accessible
 * For pro/admin: all agents are accessible
 */
export async function getAccessibleAgentIds(userId: string): Promise<string[] | null> {
	const isAdmin = await isAdminUser(userId)
	if (isAdmin) {
		return null // null means all agents are accessible
	}

	const planType = await getUserPlanType(userId)
	const limits = getPlanLimits(planType)

	// If unlimited agents, return null (all accessible)
	if (limits.maxAgents === Infinity) {
		return null
	}

	// Get user's agents ordered by creation date
	const supabase = await getSupabaseAdmin()
	const { data, error } = await (supabase
		.from("user_assistants") as any)
		.select("assistant_id")
		.eq("user_id", userId)
		.order("created_at", { ascending: true })
		.limit(limits.maxAgents)

	if (error) {
		console.error("Error fetching accessible agents:", error)
		return []
	}

	return data?.map((a: any) => a.assistant_id) || []
}

/**
 * Check if a specific agent is accessible for a user
 */
export async function isAgentAccessible(userId: string, agentId: string): Promise<boolean> {
	const accessibleIds = await getAccessibleAgentIds(userId)

	// null means all agents are accessible
	if (accessibleIds === null) {
		return true
	}

	return accessibleIds.includes(agentId)
}

/**
 * Get workflows that should be deactivated when user downgrades from trial
 * Returns workflows that exceed the plan limit, ordered by activation date
 */
export async function getWorkflowsToDeactivate(userId: string): Promise<string[]> {
	const isAdmin = await isAdminUser(userId)
	if (isAdmin) {
		return [] // Admins never need to deactivate
	}

	const planType = await getUserPlanType(userId)
	const limits = getPlanLimits(planType)

	// If unlimited workflows, nothing to deactivate
	if (limits.maxActiveWorkflows === Infinity) {
		return []
	}

	// Get all active workflows ordered by activation date
	const supabase = await getSupabaseAdmin()
	const { data, error } = await (supabase
		.from("workflows") as any)
		.select("workflow_id")
		.eq("owner_id", userId)
		.eq("is_active", true)
		.order("activated_at", { ascending: true, nullsFirst: false })

	if (error) {
		console.error("Error fetching workflows to deactivate:", error)
		return []
	}

	const workflows = data || []

	// If within limit, nothing to deactivate
	if (workflows.length <= limits.maxActiveWorkflows) {
		return []
	}

	// Return workflow IDs that exceed the limit (everything after the first N)
	return workflows.slice(limits.maxActiveWorkflows).map((w: any) => w.workflow_id)
}

/**
 * Enforce plan limits after trial ends or plan downgrade
 * Deactivates workflows that exceed the limit
 */
export async function enforcePlanLimits(userId: string): Promise<{
	deactivatedWorkflows: string[]
	inaccessibleAgents: string[]
}> {
	const workflowsToDeactivate = await getWorkflowsToDeactivate(userId)

	const supabase = await getSupabaseAdmin()

	if (workflowsToDeactivate.length > 0) {
		await (supabase
			.from("workflows") as any)
			.update({
				is_active: false,
				status: "paused"
			})
			.in("workflow_id", workflowsToDeactivate)
	}

	// Get list of inaccessible agents
	const accessibleIds = await getAccessibleAgentIds(userId)

	let inaccessibleAgents: string[] = []
	if (accessibleIds !== null) {
		// Get all user's agents
		const { data: allAgents } = await (supabase
			.from("user_assistants") as any)
			.select("assistant_id")
			.eq("user_id", userId)

		if (allAgents) {
			inaccessibleAgents = allAgents
				.map((a: any) => a.assistant_id)
				.filter((id: string) => !accessibleIds.includes(id))
		}
	}

	return {
		deactivatedWorkflows: workflowsToDeactivate,
		inaccessibleAgents,
	}
}
