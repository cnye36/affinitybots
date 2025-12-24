"use client"

import { Activity, AlertCircle, CheckCircle2, Sparkles } from "lucide-react"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

interface ActivityItem {
	type: "workflow_completed" | "agent_created" | "workflow_error"
	message: string
	time: string
}

interface RecentActivityProps {
	activities: ActivityItem[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
	const getActivityStyles = (type: ActivityItem["type"]) => {
		switch (type) {
			case "workflow_completed":
				return {
					bg: "bg-gradient-to-br from-emerald-500/20 to-green-500/10",
					icon: "text-emerald-600 dark:text-emerald-400",
					border: "border-emerald-500/30",
					glow: "shadow-emerald-500/20",
					pulse: "animate-pulse",
				}
			case "workflow_error":
				return {
					bg: "bg-gradient-to-br from-red-500/20 to-rose-500/10",
					icon: "text-red-600 dark:text-red-400",
					border: "border-red-500/30",
					glow: "shadow-red-500/20",
					pulse: "",
				}
			default:
				return {
					bg: "bg-gradient-to-br from-blue-500/20 to-cyan-500/10",
					icon: "text-blue-600 dark:text-blue-400",
					border: "border-blue-500/30",
					glow: "shadow-blue-500/20",
					pulse: "",
				}
		}
	}

	return (
		<Card
			data-tutorial="activity-section"
			className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300"
		>
			{/* Decorative gradient header background */}
			<div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent" />

			<CardHeader className="pb-4 relative">
				<div className="flex items-center gap-2">
					<div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm">
						<Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
					</div>
					<div>
						<CardTitle className="text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
							Recent Activity
						</CardTitle>
						<CardDescription>Latest updates from your workspace</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{activities.length > 0 ? (
					<div className="space-y-3">
						<AnimatePresence mode="popLayout">
							{activities.map((activity, i) => {
								const styles = getActivityStyles(activity.type)
								return (
									<motion.div
										key={i}
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0, x: 20 }}
										transition={{
											duration: 0.3,
											delay: i * 0.05,
											ease: [0.22, 1, 0.36, 1],
										}}
										className="group"
									>
										<div className="flex items-start space-x-3 p-3 rounded-xl hover:bg-accent/50 transition-all duration-200">
											<motion.div
												className={`p-2.5 rounded-xl border ${styles.bg} ${styles.border} ${styles.glow} backdrop-blur-sm shadow-lg`}
												whileHover={{ scale: 1.15, rotate: 5 }}
												transition={{ type: "spring", stiffness: 400, damping: 10 }}
											>
												{activity.type === "workflow_completed" ? (
													<CheckCircle2 className={`h-4 w-4 ${styles.icon}`} />
												) : activity.type === "workflow_error" ? (
													<AlertCircle className={`h-4 w-4 ${styles.icon}`} />
												) : (
													<Activity className={`h-4 w-4 ${styles.icon}`} />
												)}
											</motion.div>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium leading-relaxed group-hover:text-foreground transition-colors">
													{activity.message}
												</p>
												<div className="flex items-center gap-2 mt-1">
													<div className="h-1 w-1 rounded-full bg-muted-foreground/50" />
													<p className="text-xs text-muted-foreground">{activity.time}</p>
												</div>
											</div>
										</div>
									</motion.div>
								)
							})}
						</AnimatePresence>
					</div>
				) : (
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.4 }}
						className="text-center py-12"
					>
						<div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 mb-4">
							<Activity className="h-8 w-8 text-muted-foreground/50" />
						</div>
						<p className="text-sm font-medium text-muted-foreground">No recent activity</p>
						<p className="text-xs text-muted-foreground/70 mt-1">
							Activity will appear here as you work
						</p>
					</motion.div>
				)}
			</CardContent>
		</Card>
	)
}
