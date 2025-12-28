"use client"

import { useState } from "react"
import { usePlaygroundStore } from "@/lib/stores/playgroundStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, Download } from "lucide-react"
import { toast } from "sonner"

interface DraftExportFormProps {
	sessionId: string
	onSuccess: () => void
}

export function DraftExportForm({ sessionId, onSuccess }: DraftExportFormProps) {
	const { exportToDraft } = usePlaygroundStore()

	const [draftName, setDraftName] = useState("")
	const [isExporting, setIsExporting] = useState(false)
	const [success, setSuccess] = useState(false)

	const handleSaveDraft = async () => {
		if (!draftName.trim()) {
			toast.error("Please enter a draft name")
			return
		}

		try {
			setIsExporting(true)

			await exportToDraft({
				name: draftName.trim(),
				downloadJson: false,
			})

			setSuccess(true)
			toast.success("Draft saved successfully!")

			setTimeout(() => {
				onSuccess()
			}, 1500)
		} catch (error) {
			console.error("Error saving draft:", error)
			toast.error("Failed to save draft")
		} finally {
			setIsExporting(false)
		}
	}

	const handleDownloadJson = async () => {
		try {
			const response = await fetch(`/api/playground/sessions/${sessionId}/export/json`)

			if (!response.ok) {
				throw new Error("Failed to export JSON")
			}

			const json = await response.json()
			const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" })
			const url = URL.createObjectURL(blob)
			const a = document.createElement("a")
			a.href = url
			a.download = `playground-session-${sessionId}.json`
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(url)

			toast.success("JSON downloaded successfully!")
		} catch (error) {
			console.error("Error downloading JSON:", error)
			toast.error("Failed to download JSON")
		}
	}

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">Save Draft</CardTitle>
					<CardDescription className="text-xs">
						Save your playground session as a draft for later
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="draft-name">Draft Name *</Label>
						<Input
							id="draft-name"
							placeholder="My Playground Session"
							value={draftName}
							onChange={(e) => setDraftName(e.target.value)}
							disabled={isExporting || success}
						/>
					</div>

					{success ? (
						<div className="flex items-center justify-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600">
							<CheckCircle className="h-5 w-5" />
							<span className="font-medium">Draft saved!</span>
						</div>
					) : (
						<Button
							onClick={handleSaveDraft}
							disabled={isExporting || !draftName.trim()}
							className="w-full"
						>
							{isExporting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Saving Draft...
								</>
							) : (
								"Save Draft"
							)}
						</Button>
					)}
				</CardContent>
			</Card>

			<div className="relative">
				<div className="absolute inset-0 flex items-center">
					<span className="w-full border-t" />
				</div>
				<div className="relative flex justify-center text-xs uppercase">
					<span className="bg-background px-2 text-muted-foreground">Or</span>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-sm">Download JSON</CardTitle>
					<CardDescription className="text-xs">
						Export session as a JSON file for backup or sharing
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button
						onClick={handleDownloadJson}
						variant="outline"
						className="w-full"
					>
						<Download className="mr-2 h-4 w-4" />
						Download JSON File
					</Button>
				</CardContent>
			</Card>

			<Card className="bg-muted/50">
				<CardHeader>
					<CardTitle className="text-sm">Draft vs JSON</CardTitle>
				</CardHeader>
				<CardContent className="text-sm space-y-2">
					<div>
						<p className="font-medium text-muted-foreground">Draft (Database):</p>
						<ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs ml-2">
							<li>Stored in your account</li>
							<li>Can be loaded anytime</li>
							<li>Shareable within organization</li>
						</ul>
					</div>
					<div className="mt-2">
						<p className="font-medium text-muted-foreground">JSON (File):</p>
						<ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs ml-2">
							<li>Local file on your computer</li>
							<li>Portable and version-controllable</li>
							<li>Can be imported later</li>
						</ul>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
