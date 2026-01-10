"use client"

import { MotionDiv } from "@/components/motion/MotionDiv"
import { Users, UserCheck, Calendar, CheckCircle, TrendingUp, FileText } from "lucide-react"

/**
 * Clean, professional hero graphic for HR & Recruitment
 * Simple 3-stage flow: Resume → AI Screen → Hire
 */
export default function HRRecruitmentHeroGraphic() {
	return (
		<div className="relative w-full max-w-3xl mx-auto h-[420px]">
			<div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-slate-900/5 via-emerald-500/5 to-transparent border border-white/60 dark:border-white/10" />
			<div className="absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.22),transparent_55%),radial-gradient(circle_at_85%_25%,rgba(20,184,166,0.2),transparent_45%)]" />
			<div className="absolute inset-0 rounded-[32px] bg-[linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:28px_28px] dark:bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)]" />

			<MotionDiv
				initial={{ y: 0 }}
				animate={{ y: [0, -6, 0] }}
				transition={{ duration: 6.2, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
				className="absolute left-8 top-10 right-48 rounded-2xl bg-white/90 dark:bg-slate-950/85 border border-slate-200/80 dark:border-slate-800/80 shadow-[0_24px_70px_-32px_rgba(15,23,42,0.55)] p-5"
			>
				<div className="flex items-center justify-between mb-4">
					<div className="text-sm font-semibold text-slate-900 dark:text-white">Candidate Pipeline</div>
					<div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400">
						<span className="h-2 w-2 rounded-full bg-emerald-500" />
						Auto-screening
					</div>
				</div>
				<div className="space-y-3">
					{[
						{ name: "Jordan Lee", stage: "Screened", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
						{ name: "Avery Patel", stage: "Interview", color: "bg-amber-500/15 text-amber-600 dark:text-amber-300" },
						{ name: "Morgan Cruz", stage: "Offer", color: "bg-blue-500/15 text-blue-600 dark:text-blue-300" },
					].map((candidate) => (
						<div key={candidate.name} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-950/70 px-3 py-2">
							<div className="flex items-center gap-2 text-[12px] text-slate-700 dark:text-slate-300">
								<Users className="h-4 w-4 text-emerald-500" />
								{candidate.name}
							</div>
							<div className={`text-[10px] font-semibold px-2 py-1 rounded-full ${candidate.color}`}>
								{candidate.stage}
							</div>
						</div>
					))}
				</div>
				<div className="mt-5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
					<div className="flex items-center gap-2">
						<TrendingUp className="h-4 w-4 text-emerald-500" />
						3.4x pipeline velocity
					</div>
					<div className="flex items-center gap-2">
						<UserCheck className="h-4 w-4 text-teal-500" />
						Bias checks enabled
					</div>
				</div>
			</MotionDiv>

			<MotionDiv
				initial={{ y: 0 }}
				animate={{ y: [0, 5, 0] }}
				transition={{ duration: 5.6, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: 0.2 }}
				className="absolute right-8 top-14 w-44 rounded-2xl bg-white/90 dark:bg-slate-950/85 border border-slate-200/80 dark:border-slate-800/80 shadow-lg p-4"
			>
				<div className="text-[11px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">AI Screening</div>
				<div className="mt-3 flex items-center gap-2">
					<div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white">
						<FileText className="h-4 w-4" />
					</div>
					<div>
						<div className="text-sm font-semibold text-slate-900 dark:text-white">Match score</div>
						<div className="text-[11px] text-slate-500 dark:text-slate-400">Role fit 92%</div>
					</div>
				</div>
				<div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-slate-900">
					<div className="h-2 w-[92%] rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
				</div>
				<div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">Skills + culture aligned</div>
			</MotionDiv>

			<MotionDiv
				initial={{ y: 0 }}
				animate={{ y: [0, -5, 0] }}
				transition={{ duration: 6.1, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: 0.4 }}
				className="absolute right-10 bottom-10 w-56 rounded-2xl bg-white/90 dark:bg-slate-950/85 border border-slate-200/80 dark:border-slate-800/80 shadow-xl p-4"
			>
				<div className="flex items-center justify-between">
					<div className="text-sm font-semibold text-slate-900 dark:text-white">Interview Schedule</div>
					<div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
						<CheckCircle className="h-4 w-4" />
						Auto-confirmed
					</div>
				</div>
				<div className="mt-4 flex items-center gap-3">
					<div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
						<Calendar className="h-5 w-5" />
					</div>
					<div>
						<div className="text-sm font-semibold text-slate-900 dark:text-white">Senior Engineer</div>
						<div className="text-[11px] text-slate-500 dark:text-slate-400">Thu 3:00 PM · 45 min</div>
					</div>
				</div>
				<div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-slate-900">
					<div className="h-2 w-[74%] rounded-full bg-gradient-to-r from-emerald-500 to-blue-500" />
				</div>
			</MotionDiv>

			<MotionDiv
				initial={{ y: 0 }}
				animate={{ y: [0, 4, 0] }}
				transition={{ duration: 5.9, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: 0.1 }}
				className="absolute left-10 bottom-12 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/80 p-4 shadow-lg"
			>
				<div className="text-[11px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Automation</div>
				<div className="mt-3 space-y-2 text-[12px] text-slate-600 dark:text-slate-300">
					<div className="flex items-center gap-2">
						<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
						Resume parsed in 18s
					</div>
					<div className="flex items-center gap-2">
						<span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
						Interview slots proposed
					</div>
					<div className="flex items-center gap-2">
						<span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
						Candidate update sent
					</div>
				</div>
			</MotionDiv>
		</div>
	)
}
