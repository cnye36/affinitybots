/**
 * Subscription utility functions for checking user access and limits
 */

export type PlanType = "free" | "starter" | "pro";

export interface SubscriptionInfo {
  plan_type: PlanType;
  status: "trialing" | "active" | "past_due" | "canceled" | "unpaid";
  trial_end: string | null;
  current_period_end: string | null;
}

/**
 * Get the effective plan type for a user
 * During trial period, users get Pro access regardless of their plan
 * After trial, they get access based on their actual plan
 */
export function getEffectivePlan(subscription: SubscriptionInfo | null): PlanType {
  if (!subscription) {
    return "free";
  }

  // If user is in trial period, they get Pro access
  if (subscription.status === "trialing" && subscription.trial_end) {
    const trialEndDate = new Date(subscription.trial_end);
    const now = new Date();
    if (now < trialEndDate) {
      return "pro";
    }
  }

  // After trial or if no trial, return their actual plan
  return subscription.plan_type;
}

/**
 * Check if user is currently in trial period
 */
export function isInTrial(subscription: SubscriptionInfo | null): boolean {
  if (!subscription || !subscription.trial_end) {
    return false;
  }

  if (subscription.status === "trialing") {
    const trialEndDate = new Date(subscription.trial_end);
    const now = new Date();
    return now < trialEndDate;
  }

  return false;
}

/**
 * Plan limits configuration
 */
export const PLAN_LIMITS = {
  free: {
    maxAgents: 0,
    maxWorkflows: 0,
    dailyCredits: 0,
  },
  starter: {
    maxAgents: 10,
    maxWorkflows: 5,
    dailyCredits: 5000,
  },
  pro: {
    maxAgents: 50,
    maxWorkflows: Infinity,
    dailyCredits: 25000,
  },
} as const;

/**
 * Get plan limits for a user based on their effective plan
 */
export function getPlanLimits(subscription: SubscriptionInfo | null) {
  const effectivePlan = getEffectivePlan(subscription);
  return PLAN_LIMITS[effectivePlan];
}

/**
 * Check if user can create more agents
 */
export function canCreateAgent(
  subscription: SubscriptionInfo | null,
  currentAgentCount: number
): boolean {
  const limits = getPlanLimits(subscription);
  if (limits.maxAgents === Infinity) {
    return true;
  }
  return currentAgentCount < limits.maxAgents;
}

/**
 * Check if user can create more workflows
 */
export function canCreateWorkflow(
  subscription: SubscriptionInfo | null,
  currentWorkflowCount: number
): boolean {
  const limits = getPlanLimits(subscription);
  if (limits.maxWorkflows === Infinity) {
    return true;
  }
  return currentWorkflowCount < limits.maxWorkflows;
}

/**
 * Check if user has enough credits for an operation
 */
export function hasEnoughCredits(
  subscription: SubscriptionInfo | null,
  currentCredits: number,
  requiredCredits: number
): boolean {
  const limits = getPlanLimits(subscription);
  // During trial (Pro access), users get Pro limits
  return currentCredits + requiredCredits <= limits.dailyCredits;
}

