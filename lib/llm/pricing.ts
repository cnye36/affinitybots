/**
 * AI Model Pricing Catalog
 *
 * Tracks actual costs per model and our markup for profitability.
 * Prices are per 1 million tokens.
 *
 * Sources:
 * - OpenAI: https://openai.com/api/pricing/
 * - Anthropic: https://www.anthropic.com/pricing
 * - Google: https://ai.google.dev/pricing
 *
 * Last updated: 2025-01-20
 */

export interface ModelPricing {
	/** Cost per 1M input tokens (what we pay) */
	inputCostPerMillion: number
	/** Cost per 1M output tokens (what we pay) */
	outputCostPerMillion: number
	/** Our markup multiplier (1.5 = 50% profit margin) */
	markup: number
	/** Optional: Context window size for estimation */
	contextWindow?: number
}

/**
 * Comprehensive pricing for all supported models
 */
export const MODEL_PRICING: Record<string, ModelPricing> = {
	// ===== OpenAI Models =====

	"gpt-5.2": {
		inputCostPerMillion: 1.75,
		outputCostPerMillion: 14.00,
		markup: 1.5, // 50% profit
		contextWindow: 128000,
	},
	"gpt-5.1": {
		inputCostPerMillion: 1.50,
		outputCostPerMillion: 12.00,
		markup: 1.5,
		contextWindow: 128000,
	},
	"gpt-5": {
		inputCostPerMillion: 1.25,
		outputCostPerMillion: 10.00,
		markup: 1.5,
		contextWindow: 128000,
	},
	"gpt-5-mini": {
		inputCostPerMillion: 0.15,
		outputCostPerMillion: 0.60,
		markup: 1.6, // Higher margin on cheaper models
		contextWindow: 128000,
	},
	"gpt-5-nano": {
		inputCostPerMillion: 0.05,
		outputCostPerMillion: 0.20,
		markup: 1.8, // Even higher margin on cheapest models
		contextWindow: 128000,
	},
	"gpt-o3": {
		inputCostPerMillion: 10.00,
		outputCostPerMillion: 40.00,
		markup: 1.4, // Lower margin on very expensive models to stay competitive
		contextWindow: 128000,
	},
	"gpt-o3-mini": {
		inputCostPerMillion: 1.00,
		outputCostPerMillion: 4.00,
		markup: 1.5,
		contextWindow: 128000,
	},
	"gpt-4.1": {
		inputCostPerMillion: 2.00,
		outputCostPerMillion: 8.00,
		markup: 1.5,
		contextWindow: 128000,
	},
	"gpt-4.1-mini": {
		inputCostPerMillion: 0.15,
		outputCostPerMillion: 0.60,
		markup: 1.6,
		contextWindow: 128000,
	},
	"gpt-4.1-nano": {
		inputCostPerMillion: 0.05,
		outputCostPerMillion: 0.20,
		markup: 1.8,
		contextWindow: 128000,
	},
	"gpt-4o": {
		inputCostPerMillion: 2.50,
		outputCostPerMillion: 10.00,
		markup: 1.5,
		contextWindow: 128000,
	},

	// ===== Anthropic Models =====

	"claude-sonnet-4-20250514": {
		inputCostPerMillion: 3.00,
		outputCostPerMillion: 15.00,
		markup: 1.5,
		contextWindow: 200000,
	},
	"claude-opus-4-20250514": {
		inputCostPerMillion: 5.00,
		outputCostPerMillion: 25.00,
		markup: 1.4, // Lower margin on expensive model
		contextWindow: 200000,
	},
	"claude-3-7-sonnet-20250219": {
		inputCostPerMillion: 3.00,
		outputCostPerMillion: 15.00,
		markup: 1.5,
		contextWindow: 200000,
	},
	"claude-3-5-haiku-20241022": {
		inputCostPerMillion: 0.25,
		outputCostPerMillion: 1.25,
		markup: 1.6,
		contextWindow: 200000,
	},

	// ===== Google Models =====

	"gemini-3-pro-preview": {
		inputCostPerMillion: 1.25,
		outputCostPerMillion: 5.00,
		markup: 1.5,
		contextWindow: 1000000,
	},
	"gemini-3-pro-image-preview": {
		inputCostPerMillion: 1.25,
		outputCostPerMillion: 5.00,
		markup: 1.5,
		contextWindow: 1000000,
	},
	"gemini-2.5-pro": {
		inputCostPerMillion: 1.25,
		outputCostPerMillion: 5.00,
		markup: 1.5,
		contextWindow: 1000000,
	},
	"gemini-2.5-flash": {
		inputCostPerMillion: 0.075,
		outputCostPerMillion: 0.30,
		markup: 1.7,
		contextWindow: 1000000,
	},
	"gemini-2.5-flash-lite": {
		inputCostPerMillion: 0.0375,
		outputCostPerMillion: 0.15,
		markup: 1.9, // Higher margin on cheapest tier
		contextWindow: 1000000,
	},
}

/**
 * Calculate the actual cost (what we pay) for a given number of tokens
 */
export function calculateActualCost(
	modelId: string,
	inputTokens: number,
	outputTokens: number
): number {
	const pricing = MODEL_PRICING[modelId]
	if (!pricing) {
		console.warn(`No pricing found for model: ${modelId}, using default GPT-5 pricing`)
		// Default to GPT-5 pricing if model not found
		const defaultPricing = MODEL_PRICING["gpt-5"]
		return (
			(inputTokens / 1_000_000) * defaultPricing.inputCostPerMillion +
			(outputTokens / 1_000_000) * defaultPricing.outputCostPerMillion
		)
	}

	return (
		(inputTokens / 1_000_000) * pricing.inputCostPerMillion +
		(outputTokens / 1_000_000) * pricing.outputCostPerMillion
	)
}

/**
 * Calculate the charged cost (what the user pays) including our markup
 */
export function calculateChargedCost(
	modelId: string,
	inputTokens: number,
	outputTokens: number
): number {
	const pricing = MODEL_PRICING[modelId]
	const actualCost = calculateActualCost(modelId, inputTokens, outputTokens)

	if (!pricing) {
		return actualCost * 1.5 // Default 50% markup
	}

	return actualCost * pricing.markup
}

/**
 * Get pricing info for a model
 */
export function getModelPricing(modelId: string): ModelPricing | null {
	return MODEL_PRICING[modelId] || null
}

/**
 * Extract model ID from LLM ID (e.g., "openai:gpt-5.2" → "gpt-5.2")
 */
export function extractModelId(llmId: string): string {
	const idx = llmId.indexOf(":")
	return idx === -1 ? llmId : llmId.slice(idx + 1)
}

/**
 * Calculate cost from LLM ID (handles provider:model format)
 */
export function calculateCostFromLlmId(
	llmId: string,
	inputTokens: number,
	outputTokens: number
): { actualCost: number; chargedCost: number } {
	const modelId = extractModelId(llmId)
	return {
		actualCost: calculateActualCost(modelId, inputTokens, outputTokens),
		chargedCost: calculateChargedCost(modelId, inputTokens, outputTokens),
	}
}

/**
 * Estimate cost for a request (useful for pre-flight checks)
 * Uses average token counts if not provided
 */
export function estimateCost(
	modelId: string,
	estimatedInputTokens: number = 1000,
	estimatedOutputTokens: number = 500
): { actualCost: number; chargedCost: number } {
	return {
		actualCost: calculateActualCost(modelId, estimatedInputTokens, estimatedOutputTokens),
		chargedCost: calculateChargedCost(modelId, estimatedInputTokens, estimatedOutputTokens),
	}
}

/**
 * Get all available models sorted by cost (cheapest first)
 */
export function getModelsSortedByCost(): Array<{ modelId: string; pricing: ModelPricing }> {
	return Object.entries(MODEL_PRICING)
		.map(([modelId, pricing]) => ({ modelId, pricing }))
		.sort((a, b) => {
			const aCost = a.pricing.inputCostPerMillion + a.pricing.outputCostPerMillion
			const bCost = b.pricing.inputCostPerMillion + b.pricing.outputCostPerMillion
			return aCost - bCost
		})
}

/**
 * Calculate the profit margin we make on a request
 */
export function calculateProfitMargin(modelId: string, inputTokens: number, outputTokens: number): {
	actualCost: number
	chargedCost: number
	profit: number
	profitMarginPercent: number
} {
	const actualCost = calculateActualCost(modelId, inputTokens, outputTokens)
	const chargedCost = calculateChargedCost(modelId, inputTokens, outputTokens)
	const profit = chargedCost - actualCost
	const profitMarginPercent = (profit / chargedCost) * 100

	return {
		actualCost,
		chargedCost,
		profit,
		profitMarginPercent,
	}
}
