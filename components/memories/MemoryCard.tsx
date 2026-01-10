"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
	ChevronDown,
	ChevronUp,
	User,
	Heart,
	Briefcase,
	Target,
	Users,
	FileText,
	MoreHorizontal,
	AlertCircle,
	ArrowUp,
	Minus,
	ArrowDown,
	Trash2,
} from "lucide-react"
import type { DisplayMemory } from "@/types/memory"
import { formatTimestamp, formatFactValue, formatImportance, CATEGORY_INFO } from "@/lib/memory/formatting"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const ICON_MAP: Record<string, typeof User> = {
	User,
	Heart,
	Briefcase,
	Target,
	Users,
	FileText,
	MoreHorizontal,
	AlertCircle,
	ArrowUp,
	Minus,
	ArrowDown,
}

interface MemoryCardProps {
	memory: DisplayMemory
	onDelete?: (memoryId: string) => void
}

export function MemoryCard({ memory, onDelete }: MemoryCardProps) {
	const [isExpanded, setIsExpanded] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)

	const categoryInfo = CATEGORY_INFO[memory.category]
	const importanceInfo = formatImportance(memory.importance)
	const CategoryIcon = ICON_MAP[categoryInfo.icon] || MoreHorizontal
	const ImportanceIcon = ICON_MAP[importanceInfo.icon] || Minus

	const handleDelete = async () => {
		if (!onDelete) return
		setIsDeleting(true)
		try {
			await onDelete(memory.id)
		} catch (error) {
			console.error("Error deleting memory:", error)
			setIsDeleting(false)
		}
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.95 }}
			transition={{ duration: 0.2 }}
		>
			<Card className="hover:shadow-md transition-shadow">
				<CardHeader className="pb-3">
					<div className="flex items-start justify-between gap-3">
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2 mb-2">
								<Badge
									variant="outline"
									className={`bg-${categoryInfo.color}-500/10 border-${categoryInfo.color}-500/20 text-${categoryInfo.color}-600 dark:text-${categoryInfo.color}-400`}
								>
									<CategoryIcon className="h-3 w-3 mr-1" />
									{categoryInfo.label}
								</Badge>
								<Badge
									variant="outline"
									className={`bg-${importanceInfo.color}-500/10 border-${importanceInfo.color}-500/20 text-${importanceInfo.color}-600 dark:text-${importanceInfo.color}-400`}
								>
									<ImportanceIcon className="h-3 w-3 mr-1" />
									{importanceInfo.label}
								</Badge>
							</div>
							<CardTitle className="text-lg">{memory.title}</CardTitle>
						</div>
						<Button
							variant="ghost"
							size="icon"
							onClick={handleDelete}
							disabled={isDeleting}
							className="text-muted-foreground hover:text-destructive"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</CardHeader>

				<CardContent className="pb-3">
					{/* Main content */}
					<p className="text-sm text-muted-foreground mb-3">{memory.content}</p>

					{/* Expandable sections */}
					<div className="space-y-2">
						{/* Key Facts */}
						{memory.key_facts && memory.key_facts.length > 0 && (
							<div>
								<button
									onClick={() => setIsExpanded(!isExpanded)}
									className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors w-full"
								>
									{isExpanded ? (
										<ChevronUp className="h-4 w-4" />
									) : (
										<ChevronDown className="h-4 w-4" />
									)}
									Key Facts ({memory.key_facts.length})
								</button>

								<AnimatePresence>
									{isExpanded && (
										<motion.div
											initial={{ height: 0, opacity: 0 }}
											animate={{ height: "auto", opacity: 1 }}
											exit={{ height: 0, opacity: 0 }}
											transition={{ duration: 0.2 }}
											className="overflow-hidden"
										>
											<div className="mt-2 pl-6 space-y-1">
												{memory.key_facts.map((fact, idx) => (
													<div
														key={idx}
														className="flex items-start gap-2 text-sm"
													>
														<span className="text-muted-foreground font-medium min-w-0 break-words">
															{fact.attribute}:
														</span>
														<span className="text-foreground flex-1 min-w-0 break-words">
															{formatFactValue(fact.value)}
														</span>
													</div>
												))}
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						)}

						{/* Context */}
						{memory.context && isExpanded && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="pl-6 text-sm text-muted-foreground italic"
							>
								<span className="font-medium not-italic">Context: </span>
								{memory.context}
							</motion.div>
						)}
					</div>
				</CardContent>

				<CardFooter className="pt-0 flex-col items-start gap-2">
					<div className="w-full flex items-center justify-between text-xs text-muted-foreground">
						<div className="flex items-center gap-2">
							<span>Saved {formatTimestamp(memory.extracted_at)}</span>
							{memory.intent_confidence && (
								<>
									<span>•</span>
									<span className="capitalize">{memory.intent_confidence} confidence</span>
								</>
							)}
						</div>
					</div>

					{/* Source message preview */}
					{memory.source_message && isExpanded && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="w-full"
						>
							<div className="text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1.5 border border-border/50">
								<span className="font-medium">From: </span>
								<span className="italic">
									"{memory.source_message.length > 100 ? memory.source_message.substring(0, 100) + "..." : memory.source_message}"
								</span>
							</div>
						</motion.div>
					)}
				</CardFooter>
			</Card>
		</motion.div>
	)
}
