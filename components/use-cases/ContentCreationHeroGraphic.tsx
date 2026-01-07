"use client"

import { MotionDiv } from "@/components/motion/MotionDiv"
import { Lightbulb, Sparkles, FileCheck } from "lucide-react"

/**
 * Clean, professional hero graphic for Content Creation
 * Simple 3-stage flow: Idea → AI Creation → Published
 */
export default function ContentCreationHeroGraphic() {
	return (
		<div className="relative w-full max-w-3xl mx-auto h-48 flex items-center justify-center">
			{/* Connecting line */}
			<div className="absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-purple-300 via-purple-400 to-blue-400 dark:from-purple-600 dark:via-purple-500 dark:to-blue-500 -translate-y-1/2" />

			{/* Idea */}
			<MotionDiv
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.1 }}
				className="absolute left-[10%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-3"
			>
				<div className="w-20 h-20 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-purple-200 dark:border-purple-800 shadow-lg flex items-center justify-center">
					<Lightbulb className="w-10 h-10 text-purple-600 dark:text-purple-400" />
				</div>
				<span className="text-xs font-medium text-gray-600 dark:text-gray-400">Idea</span>
			</MotionDiv>

			{/* AI Creation */}
			<MotionDiv
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.2 }}
				className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3"
			>
				<div className="w-24 h-24 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-xl shadow-purple-500/30 flex items-center justify-center">
					<Sparkles className="w-12 h-12 text-white" />
				</div>
				<span className="text-xs font-medium text-gray-600 dark:text-gray-400">AI Create</span>
			</MotionDiv>

			{/* Published */}
			<MotionDiv
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.3 }}
				className="absolute right-[10%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-3"
			>
				<div className="w-20 h-20 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-blue-200 dark:border-blue-800 shadow-lg flex items-center justify-center">
					<FileCheck className="w-10 h-10 text-blue-600 dark:text-blue-400" />
				</div>
				<span className="text-xs font-medium text-gray-600 dark:text-gray-400">Published</span>
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
				className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50"
			/>
		</div>
	)
}
