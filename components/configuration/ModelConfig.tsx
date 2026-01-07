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
import { AssistantConfiguration } from "@/types/assistant"
import { LLM_OPTIONS, legacyModelToLlmId, llmIdToModelId } from "@/lib/llm/catalog"

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
	const effectiveModelId = config.llm ? llmIdToModelId(config.llm) : config.model
	const useTemp = usesTemperature(effectiveModelId)
	const selectedLlm = config.llm || legacyModelToLlmId(config.model) || ""

	return (
		<div className="space-y-4 w-full overflow-hidden">
			<div className="space-y-2">
				<Label htmlFor="model">Model</Label>
				<Select
					value={selectedLlm}
					onValueChange={(value: string) => {
						onConfigurableChange("llm", value)
					}}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select a model" />
					</SelectTrigger>
					<SelectContent position="popper" className="z-[1000]">
						{LLM_OPTIONS.map((opt) => (
							<SelectItem key={opt.id} value={opt.id}>
								{opt.label}
							</SelectItem>
						))}
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

