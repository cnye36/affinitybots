"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Maximize } from "lucide-react"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import ReactMarkdown from "react-markdown"

interface ContextViewerProps {
	context: string
}

export function ContextViewer({ context }: ContextViewerProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false)

	if (!context) return null

	return (
		<>
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<Label htmlFor="previous-context" className="text-sm font-medium">
						Previous Agent Context
					</Label>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => setIsDialogOpen(true)}
						className="h-7 text-xs gap-1"
					>
						<Maximize className="h-3 w-3" />
						Expand
					</Button>
				</div>
				<textarea
					id="previous-context"
					value={context}
					readOnly
					className="flex w-full rounded-lg border border-violet-200/50 dark:border-violet-800/50 bg-muted/50 px-3 py-2 text-sm font-mono ring-offset-background resize-y transition-all min-h-[120px]"
					placeholder="No previous context available"
				/>
			</div>

			{/* Expand Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-w-4xl h-[85vh] flex flex-col">
					<DialogHeader>
						<DialogTitle className="text-xl bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
							Previous Agent Context
						</DialogTitle>
						<DialogDescription>
							View the context passed from the previous agent in a larger view
						</DialogDescription>
					</DialogHeader>

					<div className="flex-1 flex flex-col min-h-0 mt-4 overflow-hidden">
						<div className="flex-1 overflow-y-auto rounded-lg border border-violet-200/50 dark:border-violet-800/50 bg-background px-4 py-3">
							<div className="prose prose-sm dark:prose-invert max-w-none">
								<ReactMarkdown>{context}</ReactMarkdown>
							</div>
						</div>
					</div>

					<div className="flex items-center justify-end gap-2 mt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsDialogOpen(false)}
						>
							Close
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}

