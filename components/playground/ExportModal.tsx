"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkflowExportForm } from "./WorkflowExportForm"
import { TemplateExportForm } from "./TemplateExportForm"
import { DraftExportForm } from "./DraftExportForm"
import { Workflow, FileJson, Save } from "lucide-react"

interface ExportModalProps {
	sessionId: string
	open: boolean
	onClose: () => void
}

export function ExportModal({ sessionId, open, onClose }: ExportModalProps) {
	const [activeTab, setActiveTab] = useState<"workflow" | "template" | "draft">("workflow")

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Export Playground Session</DialogTitle>
					<DialogDescription>
						Save your playground session as a workflow, template, or draft
					</DialogDescription>
				</DialogHeader>

				<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="workflow" className="flex items-center gap-2">
							<Workflow className="h-4 w-4" />
							Workflow
						</TabsTrigger>
						<TabsTrigger value="template" className="flex items-center gap-2">
							<Save className="h-4 w-4" />
							Template
						</TabsTrigger>
						<TabsTrigger value="draft" className="flex items-center gap-2">
							<FileJson className="h-4 w-4" />
							Draft
						</TabsTrigger>
					</TabsList>

					<TabsContent value="workflow" className="mt-4">
						<WorkflowExportForm sessionId={sessionId} onSuccess={onClose} />
					</TabsContent>

					<TabsContent value="template" className="mt-4">
						<TemplateExportForm sessionId={sessionId} onSuccess={onClose} />
					</TabsContent>

					<TabsContent value="draft" className="mt-4">
						<DraftExportForm sessionId={sessionId} onSuccess={onClose} />
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	)
}
