"use client"

import { MotionDiv } from "@/components/motion/MotionDiv"
import { MessageSquare, Headphones, CheckCircle, Clock, Star } from "lucide-react"

/**
 * Clean, professional hero graphic for Customer Support
 * Simple 3-stage flow: Customer → AI Support → Resolution
 */
export default function CustomerSupportHeroGraphic() {
	return (
		<div className="relative w-full max-w-3xl mx-auto h-[420px]">
			<div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-slate-900/5 via-cyan-500/5 to-transparent border border-white/60 dark:border-white/10" />
			<div className="absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,0.2),transparent_55%),radial-gradient(circle_at_85%_25%,rgba(59,130,246,0.22),transparent_45%)]" />
			<div className="absolute inset-0 rounded-[32px] bg-[linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:28px_28px] dark:bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)]" />

			<MotionDiv
				initial={{ y: 0 }}
				animate={{ y: [0, -6, 0] }}
				transition={{ duration: 6.3, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
				className="absolute left-8 top-10 right-52 rounded-2xl bg-white/90 dark:bg-slate-950/85 border border-slate-200/80 dark:border-slate-800/80 shadow-[0_24px_70px_-32px_rgba(15,23,42,0.55)] p-5"
			>
				<div className="flex items-center justify-between mb-4">
					<div className="text-sm font-semibold text-slate-900 dark:text-white">Support Inbox</div>
					<div className="flex items-center gap-2 text-[11px] text-cyan-600 dark:text-cyan-400">
						<span className="h-2 w-2 rounded-full bg-cyan-500" />
						Queue healthy
					</div>
				</div>
				<div className="space-y-3">
					{[
						{ label: "Billing login issue", tag: "High", color: "bg-rose-500/15 text-rose-600 dark:text-rose-300" },
						{ label: "API timeout alert", tag: "Medium", color: "bg-amber-500/15 text-amber-600 dark:text-amber-300" },
						{ label: "Feature request", tag: "Low", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
					].map((ticket) => (
						<div key={ticket.label} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-950/70 px-3 py-2">
							<div className="flex items-center gap-2 text-[12px] text-slate-700 dark:text-slate-300">
								<MessageSquare className="h-4 w-4 text-cyan-500" />
								{ticket.label}
							</div>
							<div className={`text-[10px] font-semibold px-2 py-1 rounded-full ${ticket.color}`}>
								{ticket.tag}
							</div>
						</div>
					))}
				</div>
				<div className="mt-5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
					<div className="flex items-center gap-2">
						<Clock className="h-4 w-4 text-blue-500" />
						Median response 26s
					</div>
					<div className="flex items-center gap-2">
						<Headphones className="h-4 w-4 text-cyan-500" />
						AI triage active
					</div>
				</div>
			</MotionDiv>

			<MotionDiv
				initial={{ y: 0 }}
				animate={{ y: [0, 5, 0] }}
				transition={{ duration: 5.7, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: 0.2 }}
				className="absolute right-8 top-14 w-44 rounded-2xl bg-white/90 dark:bg-slate-950/85 border border-slate-200/80 dark:border-slate-800/80 shadow-lg p-4"
			>
				<div className="text-[11px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Live Chat</div>
				<div className="mt-3 space-y-2">
					<div className="rounded-lg bg-cyan-500/10 text-[11px] text-cyan-700 dark:text-cyan-300 px-3 py-2">
						“Your plan updated — want a quick walkthrough?”
					</div>
					<div className="rounded-lg bg-slate-100 text-[11px] text-slate-600 dark:bg-slate-900 dark:text-slate-300 px-3 py-2">
						“Yep, schedule me for tomorrow.”
					</div>
				</div>
				<div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
					<span>Avg handle time 2:18</span>
					<span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
						<CheckCircle className="h-3.5 w-3.5" />
						Resolved
					</span>
				</div>
			</MotionDiv>

			<MotionDiv
				initial={{ y: 0 }}
				animate={{ y: [0, -5, 0] }}
				transition={{ duration: 6.1, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: 0.4 }}
				className="absolute right-10 bottom-10 w-56 rounded-2xl bg-white/90 dark:bg-slate-950/85 border border-slate-200/80 dark:border-slate-800/80 shadow-xl p-4"
			>
				<div className="flex items-center justify-between">
					<div className="text-sm font-semibold text-slate-900 dark:text-white">CSAT Pulse</div>
					<div className="text-[11px] text-emerald-600 dark:text-emerald-400">+12% WoW</div>
				</div>
				<div className="mt-4 flex items-center gap-3">
					<div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
						<Star className="h-5 w-5" />
					</div>
					<div>
						<div className="text-lg font-semibold text-slate-900 dark:text-white">4.8</div>
						<div className="text-[11px] text-slate-500 dark:text-slate-400">Customer satisfaction</div>
					</div>
				</div>
				<div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-slate-900">
					<div className="h-2 w-[82%] rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
				</div>
			</MotionDiv>

			<MotionDiv
				initial={{ y: 0 }}
				animate={{ y: [0, 4, 0] }}
				transition={{ duration: 5.9, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: 0.1 }}
				className="absolute left-10 bottom-12 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/80 p-4 shadow-lg"
			>
				<div className="text-[11px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Escalation</div>
				<div className="mt-3 space-y-2 text-[12px] text-slate-600 dark:text-slate-300">
					<div className="flex items-center gap-2">
						<span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
						Tier 1 auto-response sent
					</div>
					<div className="flex items-center gap-2">
						<span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
						Context packaged for agent
					</div>
					<div className="flex items-center gap-2">
						<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
						Resolved in 6 minutes
					</div>
				</div>
			</MotionDiv>
		</div>
	)
}
