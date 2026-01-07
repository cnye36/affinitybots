"use client"

import { MotionDiv } from "@/components/motion/MotionDiv"
import { User, Target, Mail, Calendar, CheckCircle, Bot, Sparkles } from "lucide-react"

/**
 * Advanced animated hero graphic for Sales Automation
 * Shows multi-agent collaboration workflow: Lead → Qualification → Outreach → Scheduling → Success
 */
export default function SalesAutomationHeroGraphic() {
	return (
		<div className="relative w-full max-w-4xl mx-auto h-96 flex items-center justify-center">
			{/* Background glow effects */}
			<div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-3xl" />

			{/* Incoming Lead */}
			<MotionDiv
				initial={{ opacity: 0, x: -50 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ duration: 0.6, delay: 0.1 }}
				className="absolute left-0 top-1/2 -translate-y-1/2 z-10"
			>
				<div className="relative">
					<div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl shadow-blue-500/30 flex items-center justify-center">
						<User className="w-10 h-10 text-white" />
					</div>
					<div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-400 animate-ping" />
					<div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
						<span className="text-xs font-semibold text-blue-600 dark:text-blue-400">New Lead</span>
					</div>
				</div>
			</MotionDiv>

			{/* Arrow from Lead to Agents */}
			<MotionDiv
				initial={{ opacity: 0, scaleX: 0 }}
				animate={{ opacity: 1, scaleX: 1 }}
				transition={{ duration: 0.5, delay: 0.4 }}
				className="absolute left-[100px] top-1/2 -translate-y-1/2 w-20 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
				style={{ originX: 0 }}
			>
				<div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 border-r-2 border-t-2 border-purple-500" />
			</MotionDiv>

			{/* Central Agent Hub - Three agents in vertical arrangement */}
			<div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
				{/* Agent 1: Lead Qualifier (Top) */}
				<MotionDiv
					initial={{ opacity: 0, y: -30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.6, type: "spring", stiffness: 100 }}
					className="absolute -top-24 left-1/2 -translate-x-1/2"
				>
					<div className="relative group">
						<div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg shadow-violet-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
							<Target className="w-8 h-8 text-white" />
						</div>
						{/* Animated glow pulse */}
						<MotionDiv
							animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
							transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
							className="absolute inset-0 rounded-xl bg-violet-500/30 blur-md"
						/>
						<div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
							<span className="text-[10px] font-medium text-violet-600 dark:text-violet-400">Qualifier</span>
						</div>
					</div>
				</MotionDiv>

				{/* Agent 2: Email Outreach (Center) */}
				<MotionDiv
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.6, delay: 0.7, type: "spring", stiffness: 100 }}
					className="relative"
				>
					<div className="relative group">
						<div className="w-18 h-18 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-xl shadow-purple-500/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
							<Mail className="w-9 h-9 text-white" />
						</div>
						{/* Animated glow pulse */}
						<MotionDiv
							animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
							transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
							className="absolute inset-0 rounded-xl bg-purple-500/30 blur-md"
						/>
						<div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
							<span className="text-[10px] font-medium text-purple-600 dark:text-purple-400">Outreach</span>
						</div>
					</div>
				</MotionDiv>

				{/* Agent 3: Meeting Scheduler (Bottom) */}
				<MotionDiv
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.8, type: "spring", stiffness: 100 }}
					className="absolute -bottom-24 left-1/2 -translate-x-1/2"
				>
					<div className="relative group">
						<div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
							<Calendar className="w-8 h-8 text-white" />
						</div>
						{/* Animated glow pulse */}
						<MotionDiv
							animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
							transition={{ duration: 2, repeat: Infinity, delay: 1.7 }}
							className="absolute inset-0 rounded-xl bg-indigo-500/30 blur-md"
						/>
						<div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
							<span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400">Scheduler</span>
						</div>
					</div>
				</MotionDiv>

				{/* Collaboration lines between agents */}
				<MotionDiv
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.5, delay: 1 }}
				>
					{/* Top to center */}
					<div className="absolute -top-12 left-1/2 w-0.5 h-12 bg-gradient-to-b from-violet-400 to-purple-500" />
					{/* Center to bottom */}
					<div className="absolute top-9 left-1/2 w-0.5 h-12 bg-gradient-to-b from-purple-500 to-indigo-500" />
				</MotionDiv>

				{/* Animated data flow particles */}
				<MotionDiv
					animate={{
						y: [-48, 0, 48],
						opacity: [0, 1, 1, 0],
					}}
					transition={{
						duration: 3,
						repeat: Infinity,
						repeatDelay: 0.5,
						times: [0, 0.3, 0.7, 1],
					}}
					className="absolute -top-12 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-purple-400 shadow-lg shadow-purple-400/50"
				/>
			</div>

			{/* Arrow from Agents to Success */}
			<MotionDiv
				initial={{ opacity: 0, scaleX: 0 }}
				animate={{ opacity: 1, scaleX: 1 }}
				transition={{ duration: 0.5, delay: 1.2 }}
				className="absolute right-[100px] top-1/2 -translate-y-1/2 w-20 h-0.5 bg-gradient-to-r from-purple-500 to-emerald-500"
				style={{ originX: 1 }}
			>
				<div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 border-r-2 border-t-2 border-emerald-500" />
			</MotionDiv>

			{/* Success Outcome */}
			<MotionDiv
				initial={{ opacity: 0, x: 50 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ duration: 0.6, delay: 1.4 }}
				className="absolute right-0 top-1/2 -translate-y-1/2 z-10"
			>
				<div className="relative">
					<div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-xl shadow-emerald-500/30 flex items-center justify-center">
						<CheckCircle className="w-10 h-10 text-white" />
					</div>
					{/* Success sparkles */}
					<MotionDiv
						animate={{
							scale: [0, 1, 0],
							rotate: [0, 180, 360],
							opacity: [0, 1, 0],
						}}
						transition={{
							duration: 2,
							repeat: Infinity,
							repeatDelay: 1,
						}}
						className="absolute -top-2 -right-2"
					>
						<Sparkles className="w-5 h-5 text-yellow-400" />
					</MotionDiv>
					<div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
						<span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Closed Deal</span>
					</div>
				</div>
			</MotionDiv>

			{/* Central label */}
			<MotionDiv
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, delay: 1.6 }}
				className="absolute left-1/2 -translate-x-1/2 bottom-0"
			>
				<div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-300/30 dark:border-purple-600/30">
					<Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
					<span className="text-xs font-semibold text-purple-600 dark:text-purple-400">Multi-Agent Collaboration</span>
				</div>
			</MotionDiv>
		</div>
	)
}
