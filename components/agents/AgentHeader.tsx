"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function AgentHeader() {
	return (
		<div className="mb-12">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
				className="mb-6"
			>
				<h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
					My Agents
				</h1>
				<p className="text-muted-foreground text-base md:text-lg">
					Manage and configure your AI agents with advanced capabilities
				</p>
			</motion.div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
			>
				<Link href="/agents/new" className="inline-block w-full sm:w-auto">
					<Button
						size="lg"
						className="group relative w-full sm:w-auto overflow-hidden bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-200 hover:scale-105"
						data-tutorial="create-agent-button"
					>
						{/* Shine effect */}
						<div className="absolute top-0 -right-4 w-8 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent transform rotate-12 group-hover:right-full transition-all duration-700 ease-out" />

						<div className="relative flex items-center justify-center gap-2">
							<motion.div
								whileHover={{ rotate: 180 }}
								transition={{ duration: 0.3 }}
							>
								<PlusCircle className="h-5 w-5" />
							</motion.div>
							<span className="font-semibold">Create New Agent</span>
							<Sparkles className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
						</div>
					</Button>
				</Link>
			</motion.div>
		</div>
	);
}
