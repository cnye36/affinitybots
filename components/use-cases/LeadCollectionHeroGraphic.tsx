"use client"

import { MotionDiv } from "@/components/motion/MotionDiv"
import { Users, Filter, Target } from "lucide-react"

/**
 * Clean, professional hero graphic for Lead Collection
 * Simple 3-stage flow: Raw Leads → AI Qualify → Quality Leads
 */
export default function LeadCollectionHeroGraphic() {
	return (
		<div className="relative w-full max-w-3xl mx-auto h-48 flex items-center justify-center">
			{/* Connecting line */}
			<div className="absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-orange-300 via-amber-400 to-yellow-400 dark:from-orange-600 dark:via-amber-500 dark:to-yellow-500 -translate-y-1/2" />

			{/* Raw Leads */}
			<MotionDiv
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.1 }}
				className="absolute left-[10%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-3"
			>
				<div className="w-20 h-20 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-orange-200 dark:border-orange-800 shadow-lg flex items-center justify-center">
					<Users className="w-10 h-10 text-orange-600 dark:text-orange-400" />
				</div>
				<span className="text-xs font-medium text-gray-600 dark:text-gray-400">Raw Leads</span>
			</MotionDiv>

			{/* AI Qualify */}
			<MotionDiv
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.2 }}
				className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3"
			>
				<div className="w-24 h-24 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-xl shadow-orange-500/30 flex items-center justify-center">
					<Filter className="w-12 h-12 text-white" />
				</div>
				<span className="text-xs font-medium text-gray-600 dark:text-gray-400">AI Qualify</span>
			</MotionDiv>

			{/* Quality Leads */}
			<MotionDiv
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.3 }}
				className="absolute right-[10%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-3"
			>
				<div className="w-20 h-20 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-yellow-200 dark:border-yellow-800 shadow-lg flex items-center justify-center">
					<Target className="w-10 h-10 text-yellow-600 dark:text-yellow-600" />
				</div>
				<span className="text-xs font-medium text-gray-600 dark:text-gray-400">Quality</span>
			</MotionDiv>

			{/* Animated flow dot */}
			<MotionDiv
				animate={{
					x: ["15%", "50%", "85%"],
					opacity: [0, 1, 1, 0]
				}}
				transition={{
					duration: 3,
					repeat: Infinity,
					repeatDelay: 1,
					times: [0, 0.4, 0.6, 1]
				}}
				className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50"
			/>
		</div>
	)
}
