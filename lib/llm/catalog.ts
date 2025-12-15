export type LlmProvider = "openai" | "anthropic" | "google-genai"

export type LlmOption = {
	id: `${LlmProvider}:${string}`
	label: string
}

/**
 * Single source of truth for selectable LLMs in the UI.
 * Store the `id` (universal provider:model) in `configurable.llm`.
 */
export const LLM_OPTIONS: readonly LlmOption[] = [
	{ id: "openai:gpt-5.2", label: "GPT-5.2" },
	{ id: "openai:gpt-5.1", label: "GPT-5.1" },
	{ id: "openai:gpt-5", label: "GPT-5" },
	{ id: "openai:gpt-5-mini", label: "GPT-5 Mini" },
	{ id: "openai:gpt-5-nano", label: "GPT-5 Nano" },
	{ id: "openai:gpt-o3", label: "GPT-O3" },
	{ id: "openai:gpt-o3-mini", label: "GPT-O3 Mini" },
	{ id: "openai:gpt-4.1", label: "GPT-4.1" },
	{ id: "openai:gpt-4.1-mini", label: "GPT-4.1 Mini" },
	{ id: "openai:gpt-4.1-nano", label: "GPT-4.1 Nano" },
	{ id: "openai:gpt-4o", label: "GPT-4o" },

	{ id: "anthropic:claude-sonnet-4-20250514", label: "Claude Sonnet 4 (20250514)" },
	{ id: "anthropic:claude-opus-4-20250514", label: "Claude Opus 4 (20250514)" },
	{ id: "anthropic:claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet (20250219)" },
	{ id: "anthropic:claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku (20241022)" },

	{ id: "google-genai:gemini-3-pro-preview", label: "Gemini 3 Pro Preview" },
	{ id: "google-genai:gemini-3-pro-image-preview", label: "Gemini 3 Pro Image Preview" },
	{ id: "google-genai:gemini-2.5-pro", label: "Gemini 2.5 Pro" },
	{ id: "google-genai:gemini-2.5-flash", label: "Gemini 2.5 Flash" },
	{ id: "google-genai:gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
] as const

export function llmIdToModelId(llmId: string): string {
	const idx = llmId.indexOf(":")
	return idx === -1 ? llmId : llmId.slice(idx + 1)
}

export function getLlmLabel(llmId?: string, fallbackModelId?: string): string {
	if (llmId) {
		const found = LLM_OPTIONS.find((o) => o.id === llmId)
		if (found) return found.label
		return llmIdToModelId(llmId)
	}
	return fallbackModelId || "Not specified"
}

/**
 * Best-effort mapping for legacy configs that only stored `model` without a provider prefix.
 */
export function legacyModelToLlmId(model?: string): string | undefined {
	if (!model) return undefined
	if (model.includes(":")) return model
	if (model.startsWith("gpt-") || model.startsWith("o")) return `openai:${model}`
	if (model.startsWith("claude-")) return `anthropic:${model}`
	if (model.startsWith("gemini-")) return `google-genai:${model}`
	return undefined
}


