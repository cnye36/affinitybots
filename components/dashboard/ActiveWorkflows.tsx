"use client"

import Link from "next/link"
import { Zap, ArrowRight, Calendar, Workflow as WorkflowIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

interface Workflow {
	workflow_id: string
	name: string
	status: string
	updated_at: string
}

interface LatestWorkflowsProps {
	workflows: Workflow[]
}

export function LatestWorkflows({ workflows }: LatestWorkflowsProps) {
	return (
		<Card
			data-tutorial="workflows-section"
			className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300"
		>
			{/* Decorative gradient header background */}
			<div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent" />

			<CardHeader className="relative">
				<div className="flex items-center gap-2">
					<div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm">
						<WorkflowIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
					</div>
					<div>
						<CardTitle className="text-lg bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
							Latest Workflows
						</CardTitle>
						<CardDescription>Your most recently created or updated workflows</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{workflows && workflows.length > 0 ? (
					<div className="space-y-3">
						<AnimatePresence mode="popLayout">
							{workflows.map((workflow, index) => (
								<motion.div
									key={workflow.workflow_id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -20 }}
									transition={{
										duration: 0.3,
										delay: index * 0.05,
										ease: [0.22, 1, 0.36, 1],
									}}
								>
									<Link
										href={`/workflows/${workflow.workflow_id}`}
										className="block group"
									>
										<div className="flex items-center justify-between p-4 border border-border rounded-xl hover:border-blue-500/50 hover:bg-gradient-to-br hover:from-blue-500/10 hover:to-cyan-500/10 dark:hover:from-blue-500/5 dark:hover:to-cyan-500/5 transition-all duration-200">
											<div className="flex items-center space-x-4 flex-1 min-w-0">
												<motion.div
													className="p-2.5 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-500/30 backdrop-blur-sm shadow-lg shadow-blue-500/10"
													whileHover={{ scale: 1.1, rotate: 5 }}
													transition={{ type: "spring", stiffness: 400, damping: 10 }}
												>
													<Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
												</motion.div>
												<div className="flex-1 min-w-0">
													<p className="font-medium truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
														{workflow.name}
													</p>
													<div className="flex items-center gap-2 mt-1">
														<Calendar className="h-3 w-3 text-muted-foreground" />
														<p className="text-xs text-muted-foreground">
															Updated {new Date(workflow.updated_at).toLocaleDateString()}
														</p>
													</div>
												</div>
											</div>
											<div className="flex items-center gap-3">
												<Badge
													variant={workflow.status === "active" ? "default" : "secondary"}
													className={
														workflow.status === "active"
															? "bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0"
															: ""
													}
												>
													{workflow.status || "Inactive"}
												</Badge>
												<ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
											</div>
										</div>
									</Link>
								</motion.div>
							))}
						</AnimatePresence>
					</div>
				) : (
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.4 }}
						className="text-center py-12"
					>
						<div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 mb-4">
							<Zap className="h-8 w-8 text-muted-foreground/50" />
						</div>
						<p className="text-sm font-medium text-muted-foreground mb-2">No workflows yet</p>
						<p className="text-xs text-muted-foreground/70 mb-4">
							Create your first workflow to automate tasks
						</p>
						<Button variant="outline" className="mt-2" asChild>
							<Link href="/workflows/new">
								<Zap className="h-4 w-4 mr-2" />
								Create Workflow
							</Link>
						</Button>
					</motion.div>
				)}
			</CardContent>
		</Card>
	)
}
