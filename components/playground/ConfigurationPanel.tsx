"use client"

import { Assistant } from "@/types/assistant"
import { OrchestratorConfig } from "@/types/workflow"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OrchestratorConfigForm } from "./OrchestratorConfigForm"

interface ConfigurationPanelProps {
	mode: "sequential" | "orchestrator"
	onModeToggle: (mode: "sequential" | "orchestrator") => void
	orchestratorConfig: OrchestratorConfig | null
	onOrchestratorConfigChange: (config: OrchestratorConfig) => void
	availableAgents: Assistant[]
	selectedTeam?: string[]
	onTeamChange?: (agentIds: string[]) => void
}

export function ConfigurationPanel({
	mode,
	onModeToggle,
	orchestratorConfig,
	onOrchestratorConfigChange,
	availableAgents,
	selectedTeam = [],
	onTeamChange = () => {},
}: ConfigurationPanelProps) {
	return (
		<div className="space-y-4">
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-sm font-medium">Orchestrator Mode</CardTitle>
							<CardDescription className="text-xs mt-1">
								{mode === "sequential"
									? "Manually control agent execution"
									: "Test orchestrator workflow step-by-step"}
							</CardDescription>
						</div>
						<Switch
							checked={mode === "orchestrator"}
							onCheckedChange={(checked) => onModeToggle(checked ? "orchestrator" : "sequential")}
						/>
					</div>
				</CardHeader>
			</Card>
		</div>
	)
}
