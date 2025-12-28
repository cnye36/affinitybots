"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Activity, CheckCircle2, User, Zap, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

interface StatsOverviewProps {
	stats: {
		totalWorkflows: number
		totalAgents: number
		successRate: string
		averageResponseTime: string
	}
}

const statCards = [
	{
		title: "Total Agents",
		value: (stats: StatsOverviewProps["stats"]) => stats.totalAgents.toString(),
		icon: User,
		gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
		glowColor: "rgba(168, 85, 247, 0.4)",
		iconBg: "bg-gradient-to-br from-violet-400/20 to-fuchsia-400/20",
		iconColor: "text-violet-600 dark:text-violet-100",
		description: "Active AI agents",
		trend: "+12%",
		href: "/agents",
	},
	{
		title: "Total Workflows",
		value: (stats: StatsOverviewProps["stats"]) => stats.totalWorkflows.toString(),
		icon: Zap,
		gradient: "from-blue-500 via-cyan-500 to-teal-500",
		glowColor: "rgba(59, 130, 246, 0.4)",
		iconBg: "bg-gradient-to-br from-blue-400/20 to-teal-400/20",
		iconColor: "text-blue-600 dark:text-blue-100",
		description: "Automation workflows",
		trend: "+8%",
		href: "/workflows",
	},
	{
		title: "Success Rate",
		value: (stats: StatsOverviewProps["stats"]) => stats.successRate,
		icon: CheckCircle2,
		gradient: "from-emerald-500 via-green-500 to-lime-500",
		glowColor: "rgba(34, 197, 94, 0.4)",
		iconBg: "bg-gradient-to-br from-emerald-400/20 to-lime-400/20",
		iconColor: "text-emerald-600 dark:text-emerald-100",
		description: "Task completion rate",
		trend: "+2%",
		href: null,
	},
	{
		title: "Avg Response Time",
		value: (stats: StatsOverviewProps["stats"]) => stats.averageResponseTime,
		icon: Activity,
		gradient: "from-orange-500 via-amber-500 to-yellow-500",
		glowColor: "rgba(249, 115, 22, 0.4)",
		iconBg: "bg-gradient-to-br from-orange-400/20 to-yellow-400/20",
		iconColor: "text-orange-600 dark:text-orange-100",
		description: "System performance",
		trend: "-15%",
		href: null,
	},
] as const

export function StatsOverview({ stats }: StatsOverviewProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-tutorial="stats-overview">
			{statCards.map((card, index) => {
				const IconComponent = card.icon
				const isPositive = card.trend.startsWith("+")

				const cardContent = (
					<Card
						className={`group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
							card.href ? "cursor-pointer" : ""
						}`}
						style={{
							background: `linear-gradient(135deg, var(--card) 0%, var(--card) 100%)`,
						}}
					>
						{/* Gradient background overlay */}
						<div
							className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
						/>

						{/* Animated glow effect on hover */}
						<div
							className="absolute -inset-[1px] bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm -z-10"
							style={{
								background: `linear-gradient(135deg, ${card.glowColor}, transparent)`,
							}}
						/>

						<CardContent className="p-6 relative">
							{/* Header with icon */}
							<div className="flex items-start justify-between mb-4">
								<div className="flex-1">
									<p className="text-sm font-medium text-muted-foreground mb-1">
										{card.title}
									</p>
									<motion.h3
										className={`text-4xl font-bold tracking-tight bg-gradient-to-br ${card.gradient} bg-clip-text text-transparent`}
										initial={{ scale: 0.5 }}
										animate={{ scale: 1 }}
										transition={{
											duration: 0.5,
											delay: index * 0.1 + 0.2,
											ease: [0.34, 1.56, 0.64, 1],
										}}
									>
										{card.value(stats)}
									</motion.h3>
								</div>
								<motion.div
									className={`p-3 rounded-2xl ${card.iconBg} backdrop-blur-sm border border-white/10 dark:border-white/10 border-border/50 shadow-lg`}
									whileHover={{ scale: 1.1, rotate: 5 }}
									transition={{ type: "spring", stiffness: 400, damping: 10 }}
								>
									<IconComponent className={`h-6 w-6 ${card.iconColor}`} />
								</motion.div>
							</div>

							{/* Subtle shine effect */}
							<div className="absolute top-0 -right-4 w-8 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform rotate-12 group-hover:right-full transition-all duration-1000 ease-out" />
						</CardContent>
					</Card>
				)

				return (
					<motion.div
						key={index}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: 0.5,
							delay: index * 0.1,
							ease: [0.22, 1, 0.36, 1],
						}}
					>
						{card.href !== null ? (
							<Link href={card.href} className="block">
								{cardContent}
							</Link>
						) : (
							cardContent
						)}
					</motion.div>
				)
			})}
		</div>
	)
}
