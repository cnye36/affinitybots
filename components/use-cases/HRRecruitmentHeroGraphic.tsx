"use client"

import { MotionDiv } from "@/components/motion/MotionDiv"
import { FileText, UserCheck, Handshake } from "lucide-react"

/**
 * Clean, professional hero graphic for HR & Recruitment
 * Simple 3-stage flow: Resume → AI Screen → Hire
 */
export default function HRRecruitmentHeroGraphic() {
	return (
		<div className="relative w-full max-w-3xl mx-auto h-48 flex items-center justify-center">
			{/* Connecting line */}
			<div className="absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-green-300 via-emerald-400 to-teal-400 dark:from-green-600 dark:via-emerald-500 dark:to-teal-500 -translate-y-1/2" />

			{/* Resume */}
			<MotionDiv
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.1 }}
				className="absolute left-[10%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-3"
			>
				<div className="w-20 h-20 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-green-200 dark:border-green-800 shadow-lg flex items-center justify-center">
					<FileText className="w-10 h-10 text-green-600 dark:text-green-400" />
				</div>
				<span className="text-xs font-medium text-gray-600 dark:text-gray-400">Resume</span>
			</MotionDiv>

			{/* AI Screening */}
			<MotionDiv
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.2 }}
				className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3"
			>
				<div className="w-24 h-24 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-xl shadow-green-500/30 flex items-center justify-center">
					<UserCheck className="w-12 h-12 text-white" />
				</div>
				<span className="text-xs font-medium text-gray-600 dark:text-gray-400">AI Screen</span>
			</MotionDiv>

			{/* Hire */}
			<MotionDiv
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.3 }}
				className="absolute right-[10%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-3"
			>
				<div className="w-20 h-20 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-teal-200 dark:border-teal-800 shadow-lg flex items-center justify-center">
					<Handshake className="w-10 h-10 text-teal-600 dark:text-teal-400" />
				</div>
				<span className="text-xs font-medium text-gray-600 dark:text-gray-400">Hire</span>
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
				className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50"
			/>
		</div>
	)
}
