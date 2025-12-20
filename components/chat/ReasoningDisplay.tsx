"use client"

import { useState, type FC } from "react"
import { ChevronDown, ChevronRight, BrainCircuit } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface ReasoningDisplayProps {
	reasoning: string
}

export const ReasoningDisplay: FC<ReasoningDisplayProps> = ({ reasoning }) => {
	const [isExpanded, setIsExpanded] = useState(false)

	if (!reasoning) return null

	return (
		<div className="mt-3 border rounded-lg overflow-hidden bg-muted/30">
			<button
				type="button"
				onClick={() => setIsExpanded(!isExpanded)}
				className={cn(
					"w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium",
					"hover:bg-muted/50 transition-colors",
					"text-left text-muted-foreground"
				)}
			>
				<BrainCircuit className="h-4 w-4 flex-shrink-0" />
				<span className="flex-1">Agent Reasoning</span>
				<motion.div
					animate={{ rotate: isExpanded ? 0 : -90 }}
					transition={{ duration: 0.2 }}
				>
					<ChevronDown className="h-4 w-4" />
				</motion.div>
			</button>

			<AnimatePresence initial={false}>
				{isExpanded && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2, ease: "easeInOut" }}
						className="overflow-hidden"
					>
						<div className="px-4 py-3 border-t bg-muted/10">
							<div className="text-sm text-muted-foreground">
								<ReactMarkdown
									remarkPlugins={[remarkGfm]}
									className="prose prose-sm dark:prose-invert max-w-none"
									components={{
										p: ({ className, ...props }) => (
											<p className={cn("mb-3 leading-relaxed first:mt-0 last:mb-0", className)} {...props} />
										),
										ul: ({ className, ...props }) => (
											<ul className={cn("my-3 ml-6 list-disc [&>li]:mt-1.5", className)} {...props} />
										),
										ol: ({ className, ...props }) => (
											<ol className={cn("my-3 ml-6 list-decimal [&>li]:mt-1.5", className)} {...props} />
										),
										code: ({ className, inline, ...props }: any) => (
											<code
												className={cn(
													inline ? "bg-muted rounded border px-1 py-0.5 font-mono text-xs" : "block",
													className
												)}
												{...props}
											/>
										),
										pre: ({ className, ...props }) => (
											<pre className={cn("bg-muted rounded-lg p-3 overflow-x-auto my-3", className)} {...props} />
										),
									}}
								>
									{reasoning}
								</ReactMarkdown>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}
