"use client"

import { MotionDiv } from "@/components/motion/MotionDiv"
import { Mail, Calendar, TrendingUp, Target, CheckCircle } from "lucide-react"

/**
 * Advanced animated hero graphic for Sales Automation
 * Shows multi-agent collaboration workflow: Lead → Qualification → Outreach → Scheduling → Success
 */
export default function SalesAutomationHeroGraphic() {
	return (
		<div className="relative w-full max-w-3xl mx-auto h-[420px]">
			<div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-slate-900/5 via-blue-500/5 to-transparent border border-white/60 dark:border-white/10" />
			<div className="absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_20%_15%,rgba(59,130,246,0.18),transparent_55%),radial-gradient(circle_at_85%_25%,rgba(168,85,247,0.2),transparent_45%)]" />
			<div className="absolute inset-0 rounded-[32px] bg-[linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:28px_28px] dark:bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)]" />

			<MotionDiv
				initial={{ y: 0 }}
				animate={{ y: [0, -6, 0] }}
				transition={{ duration: 6.4, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
				className="absolute left-8 top-8 right-40 rounded-2xl bg-white/90 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.5)] p-5"
			>
				<div className="flex items-center justify-between mb-4">
					<div className="text-sm font-semibold text-slate-900 dark:text-white">Sales Pipeline</div>
					<div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400">
						<span className="h-2 w-2 rounded-full bg-emerald-500" />
						Live sync
					</div>
				</div>
				<div className="space-y-3">
					{[
						{ label: "Qualified", width: "w-[78%]", tint: "bg-blue-500/20 text-blue-700 dark:text-blue-300" },
						{ label: "Outreach", width: "w-[62%]", tint: "bg-violet-500/20 text-violet-700 dark:text-violet-300" },
						{ label: "Meetings", width: "w-[45%]", tint: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300" },
					].map((stage) => (
						<div key={stage.label} className="flex items-center gap-3">
							<div className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${stage.tint}`}>
								{stage.label}
							</div>
							<div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
								<div className={`h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 ${stage.width}`} />
							</div>
						</div>
					))}
				</div>
				<div className="mt-5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
					<div className="flex items-center gap-2">
						<Target className="h-4 w-4 text-blue-500" />
						Precision scoring on every lead
					</div>
					<div className="flex items-center gap-2">
						<TrendingUp className="h-4 w-4 text-violet-500" />
						+42% conversion lift
					</div>
				</div>
			</MotionDiv>

			<MotionDiv
				initial={{ y: 0 }}
				animate={{ y: [0, 5, 0] }}
				transition={{ duration: 5.6, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: 0.2 }}
				className="absolute right-8 top-14 w-40 rounded-2xl bg-white/90 dark:bg-slate-950/85 border border-slate-200/80 dark:border-slate-800/80 shadow-lg p-4"
			>
				<div className="text-[11px] uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Outreach</div>
				<div className="mt-3 flex items-center gap-2">
					<div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
						<Mail className="h-4 w-4" />
					</div>
					<div>
						<div className="text-sm font-semibold text-slate-900 dark:text-white">Sequence #12</div>
						<div className="text-[11px] text-slate-500 dark:text-slate-400">Personalized cadence</div>
					</div>
				</div>
				<div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-slate-900">
					<div className="h-2 w-[72%] rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
				</div>
				<div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">Open rate 68%</div>
			</MotionDiv>

			<MotionDiv
				initial={{ y: 0 }}
				animate={{ y: [0, -5, 0] }}
				transition={{ duration: 6.1, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: 0.4 }}
				className="absolute right-12 bottom-10 w-56 rounded-2xl bg-white/90 dark:bg-slate-950/85 border border-slate-200/80 dark:border-slate-800/80 shadow-xl p-4"
			>
				<div className="flex items-center justify-between">
					<div className="text-sm font-semibold text-slate-900 dark:text-white">Booked Meetings</div>
					<div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
						<CheckCircle className="h-4 w-4" />
						Auto-confirmed
					</div>
				</div>
				<div className="mt-4 space-y-3">
					<div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
						<span>Today</span>
						<span>3 meetings</span>
					</div>
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
							<Calendar className="h-5 w-5" />
						</div>
						<div>
							<div className="text-sm font-semibold text-slate-900 dark:text-white">Acme Systems</div>
							<div className="text-[11px] text-slate-500 dark:text-slate-400">2:30 PM · 30 min</div>
						</div>
					</div>
				</div>
			</MotionDiv>

			<MotionDiv
				initial={{ y: 0 }}
				animate={{ y: [0, 4, 0] }}
				transition={{ duration: 5.9, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: 0.1 }}
				className="absolute left-12 bottom-12 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/80 p-4 shadow-lg"
			>
				<div className="text-[11px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Activity</div>
				<div className="mt-3 space-y-2 text-[12px] text-slate-600 dark:text-slate-300">
					<div className="flex items-center gap-2">
						<span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
						Lead scored and enriched
					</div>
					<div className="flex items-center gap-2">
						<span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
						Follow-up sent in 42s
					</div>
					<div className="flex items-center gap-2">
						<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
						Meeting routed to AE
					</div>
				</div>
			</MotionDiv>
		</div>
	)
}
