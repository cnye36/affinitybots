"use client"

import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { AssistantConfiguration, ModelType } from "@/types/assistant"

interface ModelConfigProps {
	config: AssistantConfiguration
	onConfigurableChange: (field: keyof AssistantConfiguration, value: unknown) => void
}

/**
 * Determines if a model uses temperature instead of reasoning effort.
 * Most models use reasoning effort - only a few legacy models use temperature.
 */
function usesTemperature(model?: string): boolean {
	if (!model) return false
	const modelLower = model.toLowerCase()
	// Temperature models (exceptions): GPT-4.1 variants and GPT-4o
	const temperatureModels = [
		"gpt-4.1",
		"gpt-4.1-mini",
		"gpt-4.1-nano",
		"gpt-4o",
		"claude-3-5-haiku-latest", // Exception: old haiku 3.5 uses temperature
	]
	return temperatureModels.some((m) => modelLower === m.toLowerCase() || modelLower.startsWith(m.toLowerCase() + "-"))
}

export function ModelConfig({ config, onConfigurableChange }: ModelConfigProps) {
	const useTemp = usesTemperature(config.model)

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="model">Model</Label>
				<Select
					value={config.model}
					onValueChange={(value: ModelType) => {
						onConfigurableChange("model", value)
						// Map curated model to universal llm id
						const map: Record<string, string> = {
							"gpt-5.2": "openai:gpt-5.2",
							"gpt-5.1": "openai:gpt-5.1",
							"gpt-5": "openai:gpt-5",
							"gpt-5-mini": "openai:gpt-5-mini",
							"gpt-5-nano": "openai:gpt-5-nano",
							"gpt-o3": "openai:gpt-o3",
							"gpt-o3-mini": "openai:gpt-o3-mini",
							"gpt-4.1": "openai:gpt-4.1",
							"gpt-4.1-mini": "openai:gpt-4.1-mini",
							"gpt-4.1-nano": "openai:gpt-4.1-nano",
							"gpt-4o": "openai:gpt-4o",
							"claude-sonnet-4.5-20250929": "anthropic:claude-sonnet-4.5-20250929",
							"claude-sonnet-4-0": "anthropic:claude-sonnet-4-0",
							"claude-3-7-sonnet-latest": "anthropic:claude-3-7-sonnet-latest",
							"claude-opus-4.5-20251101": "anthropic:claude-opus-4.5-20251101",
							"claude-opus-4.1": "anthropic:claude-opus-4.1",
							"claude-opus-4-0": "anthropic:claude-opus-4-0",
							"claude-haiku-4.5-20251001": "anthropic:claude-haiku-4.5-20251001",
							"claude-3-5-haiku-latest": "anthropic:claude-3-5-haiku-latest",
							"gemini-3-pro-preview": "google-genai:gemini-3-pro-preview",
							"gemini-3-pro-image-preview": "google-genai:gemini-3-pro-image-preview",
							"gemini-2.5-pro": "google-genai:gemini-2.5-pro",
							"gemini-2.5-flash": "google-genai:gemini-2.5-flash",
							"gemini-2.5-flash-lite": "google-genai:gemini-2.5-flash-lite",
						}
						onConfigurableChange("llm", map[value])
					}}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select a model" />
					</SelectTrigger>
					<SelectContent position="popper" className="z-[1000]">
						<SelectItem value="gpt-5.2">GPT-5.2</SelectItem>
						<SelectItem value="gpt-5.1">GPT-5.1</SelectItem>
						<SelectItem value="gpt-5">GPT-5</SelectItem>
						<SelectItem value="gpt-5-mini">GPT-5 Mini</SelectItem>
						<SelectItem value="gpt-5-nano">GPT-5 Nano</SelectItem>
						<SelectItem value="gpt-o3">GPT-O3</SelectItem>
						<SelectItem value="gpt-o3-mini">GPT-O3 Mini</SelectItem>
						<SelectItem value="gpt-4.1">GPT-4.1</SelectItem>
						<SelectItem value="gpt-4.1-mini">GPT-4.1 Mini</SelectItem>
						<SelectItem value="gpt-4.1-nano">GPT-4.1 Nano</SelectItem>
						<SelectItem value="gpt-4o">GPT-4o</SelectItem>
						<SelectItem value="claude-sonnet-4.5">Claude Sonnet 4.5</SelectItem>
						<SelectItem value="claude-sonnet-4">Claude Sonnet 4</SelectItem>
						<SelectItem value="claude-opus-4">Claude Opus 4</SelectItem>
						<SelectItem value="claude-opus-4.5">Claude Opus 4.5</SelectItem>
						<SelectItem value="claude-3-7-sonnet">Claude 3.7 Sonnet</SelectItem>
						<SelectItem value="claude-3-5-haiku">Claude 3.5 Haiku</SelectItem>
						<SelectItem value="claude-sonnet-4-20250514">Claude Sonnet 4 (20250514)</SelectItem>
						<SelectItem value="gemini-3-pro-preview">Gemini 3 Pro Preview</SelectItem>
						<SelectItem value="gemini-3-pro-image-preview">Gemini 3 Pro Image Preview</SelectItem>
						<SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
						<SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
						<SelectItem value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Show Reasoning Effort by default (most models), Temperature only for legacy models */}
			{useTemp ? (
				<div className="space-y-2">
					<Label htmlFor="temperature">Temperature</Label>
					<Input
						id="temperature"
						type="number"
						step="0.1"
						min="0"
						max="2"
						value={String((config.temperature as number | undefined) ?? 0.3)}
						onChange={(e) => onConfigurableChange("temperature", Number(e.target.value))}
					/>
				</div>
			) : (
				<div className="space-y-2">
					<Label htmlFor="reasoningEffort">Reasoning Effort</Label>
					<Select
						value={(config.reasoningEffort as "low" | "medium" | "high") || "medium"}
						onValueChange={(value: "low" | "medium" | "high") =>
							onConfigurableChange("reasoningEffort", value)
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select level" />
						</SelectTrigger>
						<SelectContent position="popper" className="z-[1000]">
							<SelectItem value="low">Low</SelectItem>
							<SelectItem value="medium">Medium</SelectItem>
							<SelectItem value="high">High</SelectItem>
						</SelectContent>
					</Select>
				</div>
			)}
		</div>
	)
}

