"use client"

import { useState } from "react"
import { usePlaygroundStore } from "@/lib/stores/playgroundStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface TemplateExportFormProps {
	sessionId: string
	onSuccess: () => void
}

export function TemplateExportForm({ sessionId, onSuccess }: TemplateExportFormProps) {
	const { exportToTemplate } = usePlaygroundStore()

	const [templateName, setTemplateName] = useState("")
	const [templateDescription, setTemplateDescription] = useState("")
	const [category, setCategory] = useState("")
	const [isPublic, setIsPublic] = useState(false)
	const [isExporting, setIsExporting] = useState(false)
	const [success, setSuccess] = useState(false)

	const handleExport = async () => {
		if (!templateName.trim()) {
			toast.error("Please enter a template name")
			return
		}

		try {
			setIsExporting(true)

			await exportToTemplate({
				name: templateName.trim(),
				description: templateDescription.trim() || undefined,
				category: category.trim() || undefined,
				is_public: isPublic,
			})

			setSuccess(true)
			toast.success("Template saved successfully!")

			setTimeout(() => {
				onSuccess()
			}, 1500)
		} catch (error) {
			console.error("Error exporting template:", error)
			toast.error("Failed to save template")
		} finally {
			setIsExporting(false)
		}
	}

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">Template Details</CardTitle>
					<CardDescription className="text-xs">
						Save as a reusable template for future playground sessions
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="template-name">Template Name *</Label>
						<Input
							id="template-name"
							placeholder="Research & Analysis Team"
							value={templateName}
							onChange={(e) => setTemplateName(e.target.value)}
							disabled={isExporting || success}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="template-description">Description</Label>
						<Textarea
							id="template-description"
							placeholder="Describe this agent team configuration..."
							value={templateDescription}
							onChange={(e) => setTemplateDescription(e.target.value)}
							rows={3}
							disabled={isExporting || success}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="category">Category</Label>
						<Input
							id="category"
							placeholder="e.g. research, content, data-analysis"
							value={category}
							onChange={(e) => setCategory(e.target.value)}
							disabled={isExporting || success}
						/>
						<p className="text-xs text-muted-foreground">
							Optional category for organizing templates
						</p>
					</div>

					<div className="flex items-center space-x-2">
						<Checkbox
							id="is-public"
							checked={isPublic}
							onCheckedChange={(checked) => setIsPublic(checked as boolean)}
							disabled={isExporting || success}
						/>
						<Label
							htmlFor="is-public"
							className="text-sm font-normal cursor-pointer"
						>
							Make this template public
						</Label>
					</div>
					<p className="text-xs text-muted-foreground ml-6">
						Public templates can be used by other users in your organization
					</p>
				</CardContent>
			</Card>

			<Card className="bg-muted/50">
				<CardHeader>
					<CardTitle className="text-sm">Template Features</CardTitle>
				</CardHeader>
				<CardContent className="text-sm space-y-2">
					<ul className="list-disc list-inside space-y-1 text-muted-foreground">
						<li>Agent roles are saved as generic templates</li>
						<li>Tool selections are preserved</li>
						<li>Orchestrator configuration included (if applicable)</li>
						<li>Reusable across different projects</li>
					</ul>
				</CardContent>
			</Card>

			{success ? (
				<div className="flex items-center justify-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600">
					<CheckCircle className="h-5 w-5" />
					<span className="font-medium">Template saved!</span>
				</div>
			) : (
				<Button
					onClick={handleExport}
					disabled={isExporting || !templateName.trim()}
					className="w-full"
					size="lg"
				>
					{isExporting ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Saving Template...
						</>
					) : (
						"Save Template"
					)}
				</Button>
			)}
		</div>
	)
}
