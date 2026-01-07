"use client"

import { MotionDiv } from "@/components/motion/MotionDiv"
import { MessageCircle, Bot, CheckCircle } from "lucide-react"

/**
 * Clean, professional hero graphic for Customer Support
 * Simple 3-stage flow: Customer → AI Support → Resolution
 */
export default function CustomerSupportHeroGraphic() {
	return (
		<div className="relative w-full max-w-3xl mx-auto h-48 flex items-center justify-center">
			{/* Connecting line */}
			<div className="absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-400 dark:from-cyan-600 dark:via-cyan-500 dark:to-blue-500 -translate-y-1/2" />

			{/* Customer */}
			<MotionDiv
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.1 }}
				className="absolute left-[10%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-3"
			>
				<div className="w-20 h-20 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-cyan-200 dark:border-cyan-800 shadow-lg flex items-center justify-center">
					<MessageCircle className="w-10 h-10 text-cyan-600 dark:text-cyan-400" />
				</div>
				<span className="text-xs font-medium text-gray-600 dark:text-gray-400">Customer</span>
			</MotionDiv>

			{/* AI Support */}
			<MotionDiv
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.2 }}
				className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3"
			>
				<div className="w-24 h-24 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-xl shadow-cyan-500/30 flex items-center justify-center">
					<Bot className="w-12 h-12 text-white" />
				</div>
				<span className="text-xs font-medium text-gray-600 dark:text-gray-400">AI Support</span>
			</MotionDiv>

			{/* Resolution */}
			<MotionDiv
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.3 }}
				className="absolute right-[10%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-3"
			>
				<div className="w-20 h-20 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-blue-200 dark:border-blue-800 shadow-lg flex items-center justify-center">
					<CheckCircle className="w-10 h-10 text-blue-600 dark:text-blue-400" />
				</div>
				<span className="text-xs font-medium text-gray-600 dark:text-gray-400">Resolved</span>
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
				className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50"
			/>
		</div>
	)
}
