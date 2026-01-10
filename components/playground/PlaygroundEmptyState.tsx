"use client"

import { motion } from "framer-motion"
import { Users, ArrowRightLeft, Workflow, Sparkles, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PlaygroundEmptyState({ mode, onNewSession, isCreating }: { mode: "sequential" | "orchestrator"; onNewSession: () => void; isCreating?: boolean }) {
	if (mode === "orchestrator") {
		return (
			<div className="flex-1 flex items-center justify-center p-8">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="max-w-2xl w-full"
				>
					<div className="relative">
						{/* Gradient background glow */}
						<div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-3xl" />

						<div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-xl">
							{/* Header with icon */}
							<div className="flex items-center gap-4 mb-6">
								<div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
									<Sparkles className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
								</div>
								<div>
									<h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
										Configure Orchestrator
									</h2>
									<p className="text-sm text-muted-foreground mt-1">
										Set up your AI team coordinator
									</p>
								</div>
							</div>

							{/* Description */}
							<p className="text-muted-foreground mb-6">
								Configure the orchestrator and select team members to begin coordinating your AI agents.
							</p>

							{/* Features grid */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<motion.div
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.2, duration: 0.4 }}
									className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20"
								>
									<Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mb-2" />
									<h3 className="font-semibold text-sm mb-1">Team Coordination</h3>
									<p className="text-xs text-muted-foreground">
										Manage multiple agents working together on complex tasks
									</p>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.3, duration: 0.4 }}
									className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20"
								>
									<Workflow className="h-5 w-5 text-purple-600 dark:text-purple-400 mb-2" />
									<h3 className="font-semibold text-sm mb-1">Smart Delegation</h3>
									<p className="text-xs text-muted-foreground">
										Automatically assigns tasks to the most suitable agent
									</p>
								</motion.div>
							</div>

							{/* Call to action */}
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.6, duration: 0.4 }}
								className="mt-6 pt-6 border-t border-border/50 flex justify-center"
							>
								<Button
									onClick={onNewSession}
									size="lg"
									disabled={isCreating}
									className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0 shadow-lg"
								>
									{isCreating ? (
										<>
											<Loader2 className="h-5 w-5 mr-2 animate-spin" />
											Creating Session...
										</>
									) : (
										<>
											<Plus className="h-5 w-5 mr-2" />
											New Session
										</>
									)}
								</Button>
							</motion.div>
						</div>
					</div>
				</motion.div>
			</div>
		)
	}

	// Sequential mode empty state
	return (
		<div className="flex-1 flex items-center justify-center p-8">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="max-w-2xl w-full"
			>
				<div className="relative">
					{/* Gradient background glow */}
					<div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-teal-500/20 rounded-3xl blur-3xl" />

					<div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-xl">
						{/* Header with icon */}
						<div className="flex items-center gap-4 mb-6">
							<div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
								<Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
							</div>
							<div>
								<h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
									Welcome to Playground
								</h2>
								<p className="text-sm text-muted-foreground mt-1">
									Test and coordinate your AI agents
								</p>
							</div>
						</div>

						{/* Description */}
						<p className="text-muted-foreground mb-6">
							The Playground is where you test agent coordination, hand off context between agents, and refine how your team works together before creating workflows.
						</p>

						{/* Features grid */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.2, duration: 0.4 }}
								className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20"
							>
								<ArrowRightLeft className="h-5 w-5 text-blue-600 dark:text-blue-400 mb-2" />
								<h3 className="font-semibold text-sm mb-1">Agent Switching</h3>
								<p className="text-xs text-muted-foreground">
									Seamlessly switch between different agents mid-conversation
								</p>
							</motion.div>

							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.3, duration: 0.4 }}
								className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20"
							>
								<Workflow className="h-5 w-5 text-cyan-600 dark:text-cyan-400 mb-2" />
								<h3 className="font-semibold text-sm mb-1">Context Handoff</h3>
								<p className="text-xs text-muted-foreground">
									Pass conversation context from one agent to another
								</p>
							</motion.div>

							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.4, duration: 0.4 }}
								className="p-4 rounded-xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-500/20"
							>
								<Users className="h-5 w-5 text-teal-600 dark:text-teal-400 mb-2" />
								<h3 className="font-semibold text-sm mb-1">Team Testing</h3>
								<p className="text-xs text-muted-foreground">
									Experiment with how agents collaborate on tasks
								</p>
							</motion.div>
						</div>

						{/* Call to action */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.6, duration: 0.4 }}
							className="mt-6 pt-6 border-t border-border/50 flex justify-center"
						>
							<Button
								onClick={onNewSession}
								size="lg"
								disabled={isCreating}
								className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-lg"
							>
								{isCreating ? (
									<>
										<Loader2 className="h-5 w-5 mr-2 animate-spin" />
										Creating Session...
									</>
								) : (
									<>
										<Plus className="h-5 w-5 mr-2" />
										New Session
									</>
								)}
							</Button>
						</motion.div>
					</div>
				</div>
			</motion.div>
		</div>
	)
}
