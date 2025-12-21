/**
 * Subscription tier limits and enforcement
 *
 * Defines resource limits for each subscription plan and provides
 * utility functions to check and enforce these limits.
 */

export type PlanType = "free" | "starter" | "pro"

export interface PlanLimits {
	/** Maximum number of agents user can create */
	maxAgents: number
	/** Maximum number of active (non-draft) workflows */
	maxActiveWorkflows: number
	/** Maximum number of draft workflows (usually unlimited) */
	maxDraftWorkflows: number
	/** Maximum number of integrations/MCP servers */
	maxIntegrations: number
	/** Monthly AI usage budget in USD (what the user is charged, not actual cost) */
	monthlyTokenBudgetUsd: number
	/** Display name for the plan */
	displayName: string
	/** Price per month in USD */
	pricePerMonth: number
}

/**
 * Plan limits configuration
 *
 * Free tier: 14-day trial with starter limits
 * Starter: $19.99/month - Good for individuals and small teams
 * Pro: $39.99/month - For power users and larger teams
 */
export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
	free: {
		maxAgents: 3,
		maxActiveWorkflows: 1,
		maxDraftWorkflows: Infinity,
		maxIntegrations: 3,
		monthlyTokenBudgetUsd: 5.0, // $5 worth of AI usage during trial
		displayName: "Free Trial",
		pricePerMonth: 0,
	},
	starter: {
		maxAgents: 10,
		maxActiveWorkflows: 3,
		maxDraftWorkflows: Infinity,
		maxIntegrations: Infinity, // Unlimited integrations
		monthlyTokenBudgetUsd: 25.0, // ~$25 worth of AI usage per month
		displayName: "Starter",
		pricePerMonth: 19.99,
	},
	pro: {
		maxAgents: 50,
		maxActiveWorkflows: Infinity,
		maxDraftWorkflows: Infinity,
		maxIntegrations: Infinity,
		monthlyTokenBudgetUsd: 100.0, // ~$100 worth of AI usage per month
		displayName: "Pro",
		pricePerMonth: 39.99,
	},
}

/**
 * Get limits for a specific plan
 */
export function getPlanLimits(planType: PlanType): PlanLimits {
	return PLAN_LIMITS[planType] || PLAN_LIMITS.free
}

/**
 * Check if a value is within the limit
 */
export function isWithinLimit(current: number, max: number): boolean {
	if (max === Infinity) return true
	return current < max
}

/**
 * Calculate remaining quota
 */
export function getRemainingQuota(current: number, max: number): number | "unlimited" {
	if (max === Infinity) return "unlimited"
	return Math.max(0, max - current)
}

/**
 * Format limit for display
 */
export function formatLimit(limit: number): string {
	if (limit === Infinity) return "Unlimited"
	return limit.toString()
}

/**
 * Format usage vs limit for display
 */
export function formatUsage(current: number, max: number): string {
	if (max === Infinity) return `${current} / Unlimited`
	return `${current} / ${max}`
}

/**
 * Calculate percentage of limit used
 */
export function getUsagePercentage(current: number, max: number): number {
	if (max === Infinity) return 0
	return Math.min(100, (current / max) * 100)
}

/**
 * Check if user is approaching limit (>= 80%)
 */
export function isApproachingLimit(current: number, max: number): boolean {
	if (max === Infinity) return false
	return (current / max) >= 0.8
}

/**
 * Check if user has exceeded limit
 */
export function hasExceededLimit(current: number, max: number): boolean {
	if (max === Infinity) return false
	return current >= max
}

/**
 * Get upgrade recommendation based on current usage
 */
export function getUpgradeRecommendation(
	planType: PlanType,
	currentUsage: {
		agentCount: number
		activeWorkflowCount: number
		monthlyChargedCost: number
	}
): { shouldUpgrade: boolean; reason?: string; recommendedPlan?: PlanType } {
	const limits = getPlanLimits(planType)

	// Already on highest tier
	if (planType === "pro") {
		return { shouldUpgrade: false }
	}

	// Check if hitting any limits
	if (hasExceededLimit(currentUsage.agentCount, limits.maxAgents)) {
		return {
			shouldUpgrade: true,
			reason: "You've reached your agent limit",
			recommendedPlan: planType === "free" ? "starter" : "pro",
		}
	}

	if (hasExceededLimit(currentUsage.activeWorkflowCount, limits.maxActiveWorkflows)) {
		return {
			shouldUpgrade: true,
			reason: "You've reached your active workflow limit",
			recommendedPlan: planType === "free" ? "starter" : "pro",
		}
	}

	if (hasExceededLimit(currentUsage.monthlyChargedCost, limits.monthlyTokenBudgetUsd)) {
		return {
			shouldUpgrade: true,
			reason: "You've exceeded your monthly AI usage budget",
			recommendedPlan: planType === "free" ? "starter" : "pro",
		}
	}

	// Check if approaching limits
	if (
		isApproachingLimit(currentUsage.agentCount, limits.maxAgents) ||
		isApproachingLimit(currentUsage.activeWorkflowCount, limits.maxActiveWorkflows) ||
		isApproachingLimit(currentUsage.monthlyChargedCost, limits.monthlyTokenBudgetUsd)
	) {
		return {
			shouldUpgrade: true,
			reason: "You're approaching your plan limits",
			recommendedPlan: planType === "free" ? "starter" : "pro",
		}
	}

	return { shouldUpgrade: false }
}

/**
 * Calculate overage cost (for future use with overage billing)
 */
export function calculateOverageCost(
	planType: PlanType,
	actualChargedCost: number
): number {
	const limits = getPlanLimits(planType)
	const overage = Math.max(0, actualChargedCost - limits.monthlyTokenBudgetUsd)
	return overage
}

/**
 * Get all plans for comparison/display
 */
export function getAllPlans(): Array<{ planType: PlanType; limits: PlanLimits }> {
	return Object.entries(PLAN_LIMITS).map(([planType, limits]) => ({
		planType: planType as PlanType,
		limits,
	}))
}

/**
 * Validate if a plan type is valid
 */
export function isValidPlanType(planType: string): planType is PlanType {
	return planType === "free" || planType === "starter" || planType === "pro"
}
