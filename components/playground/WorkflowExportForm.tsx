"use client"

import { useState } from "react"
import { usePlaygroundStore } from "@/lib/stores/playgroundStore"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface WorkflowExportFormProps {
	sessionId: string
	onSuccess: () => void
}

export function WorkflowExportForm({ sessionId, onSuccess }: WorkflowExportFormProps) {
	const { exportToWorkflow } = usePlaygroundStore()
	const router = useRouter()

	const [workflowName, setWorkflowName] = useState("")
	const [workflowDescription, setWorkflowDescription] = useState("")
	const [triggerType, setTriggerType] = useState<"manual" | "webhook" | "form" | "integration" | "schedule">("manual")
	const [isExporting, setIsExporting] = useState(false)
	const [success, setSuccess] = useState(false)

	const handleExport = async () => {
		if (!workflowName.trim()) {
			toast.error("Please enter a workflow name")
			return
		}

		try {
			setIsExporting(true)

			const workflowId = await exportToWorkflow({
				workflowName: workflowName.trim(),
				workflowDescription: workflowDescription.trim() || undefined,
				triggerType,
			})

			setSuccess(true)
			toast.success("Workflow created successfully!")

			// Redirect to workflow after a brief delay
			setTimeout(() => {
				router.push(`/workflows/${workflowId}`)
				onSuccess()
			}, 1500)
		} catch (error) {
			console.error("Error exporting workflow:", error)
			toast.error("Failed to export workflow")
		} finally {
			setIsExporting(false)
		}
	}

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">Workflow Details</CardTitle>
					<CardDescription className="text-xs">
						Convert your playground session into a production workflow
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="workflow-name">Workflow Name *</Label>
						<Input
							id="workflow-name"
							placeholder="My Agent Workflow"
							value={workflowName}
							onChange={(e) => setWorkflowName(e.target.value)}
							disabled={isExporting || success}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="workflow-description">Description</Label>
						<Textarea
							id="workflow-description"
							placeholder="Describe what this workflow does..."
							value={workflowDescription}
							onChange={(e) => setWorkflowDescription(e.target.value)}
							rows={3}
							disabled={isExporting || success}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="trigger-type">Trigger Type</Label>
						<Select
							value={triggerType}
							onValueChange={(v) => setTriggerType(v as any)}
							disabled={isExporting || success}
						>
							<SelectTrigger id="trigger-type">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="manual">Manual</SelectItem>
								<SelectItem value="webhook">Webhook</SelectItem>
								<SelectItem value="form">Form</SelectItem>
								<SelectItem value="integration">Integration</SelectItem>
								<SelectItem value="schedule">Schedule</SelectItem>
							</SelectContent>
						</Select>
						<p className="text-xs text-muted-foreground">
							How this workflow will be triggered
						</p>
					</div>
				</CardContent>
			</Card>

			<Card className="bg-muted/50">
				<CardHeader>
					<CardTitle className="text-sm">What Happens Next?</CardTitle>
				</CardHeader>
				<CardContent className="text-sm space-y-2">
					<ul className="list-disc list-inside space-y-1 text-muted-foreground">
						<li>Playground steps become workflow tasks</li>
						<li>Agent configurations are preserved</li>
						<li>Tool selections are maintained</li>
						<li>You can edit the workflow after creation</li>
					</ul>
				</CardContent>
			</Card>

			{success ? (
				<div className="flex items-center justify-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600">
					<CheckCircle className="h-5 w-5" />
					<span className="font-medium">Workflow created! Redirecting...</span>
				</div>
			) : (
				<Button
					onClick={handleExport}
					disabled={isExporting || !workflowName.trim()}
					className="w-full"
					size="lg"
				>
					{isExporting ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Creating Workflow...
						</>
					) : (
						"Create Workflow"
					)}
				</Button>
			)}
		</div>
	)
}
