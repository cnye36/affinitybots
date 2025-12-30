/**
 * Convert USD cost to user-facing "credits"
 *
 * We track costs internally in USD but display to users as "credits" for simplicity.
 * Conversion rate: $1 USD = 200 credits
 *
 * This means:
 * - Free tier: $5 budget = 1,000 credits
 * - Starter: $25 budget = 5,000 credits
 * - Pro: $100 budget = 20,000 credits (but we show 25,000 to be more generous)
 */

const USD_TO_CREDITS_RATIO = 200

/**
 * Convert USD amount to credits for display
 */
export function usdToCredits(usd: number): number {
	return Math.round(usd * USD_TO_CREDITS_RATIO)
}

/**
 * Convert credits to USD for calculations
 */
export function creditsToUsd(credits: number): number {
	return credits / USD_TO_CREDITS_RATIO
}

/**
 * Get credit limit for a plan type
 */
export function getPlanCredits(planType: "free" | "starter" | "pro"): number {
	switch (planType) {
		case "free":
			return 1000 // $5 budget
		case "starter":
			return 5000 // $25 budget
		case "pro":
			return 25000 // $100 budget (showing 25k instead of 20k for marketing)
		default:
			return 1000
	}
}
