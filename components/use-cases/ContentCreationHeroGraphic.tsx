"use client"

import { MotionDiv } from "@/components/motion/MotionDiv"
import { Calendar, FileText, PenTool, Sparkles, CheckCircle, TrendingUp, BarChart3 } from "lucide-react"

/**
 * Clean, professional hero graphic for Content Creation
 * Simple 3-stage flow: Idea → AI Creation → Published
 */
export default function ContentCreationHeroGraphic() {
	return (
		<div className="relative w-full max-w-3xl mx-auto h-[420px]">
			<div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-slate-900/5 via-purple-500/5 to-transparent border border-white/60 dark:border-white/10" />
			<div className="absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_18%_18%,rgba(168,85,247,0.22),transparent_55%),radial-gradient(circle_at_85%_25%,rgba(59,130,246,0.2),transparent_45%)]" />
			<div className="absolute inset-0 rounded-[32px] bg-[linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:28px_28px] dark:bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)]" />

			<MotionDiv
				initial={{ y: 0 }}
				animate={{ y: [0, -6, 0] }}
				transition={{ duration: 6.2, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
				className="absolute left-8 top-10 right-48 rounded-2xl bg-white/90 dark:bg-slate-950/85 border border-slate-200/80 dark:border-slate-800/80 shadow-[0_24px_70px_-32px_rgba(15,23,42,0.55)] p-5"
			>
				<div className="flex items-center justify-between mb-4">
					<div className="text-sm font-semibold text-slate-900 dark:text-white">Content Calendar</div>
					<div className="flex items-center gap-2 text-[11px] text-purple-600 dark:text-purple-400">
						<span className="h-2 w-2 rounded-full bg-purple-500" />
						In production
					</div>
				</div>
				<div className="space-y-3">
					{[
						{ title: "Product launch blog", date: "Mon", status: "Draft", color: "bg-blue-500/15 text-blue-600 dark:text-blue-300" },
						{ title: "Customer story edit", date: "Wed", status: "Review", color: "bg-amber-500/15 text-amber-600 dark:text-amber-300" },
						{ title: "Email nurture series", date: "Fri", status: "Scheduled", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
					].map((item) => (
						<div key={item.title} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-950/70 px-3 py-2">
							<div className="flex items-center gap-2 text-[12px] text-slate-700 dark:text-slate-300">
								<Calendar className="h-4 w-4 text-purple-500" />
								<span className="min-w-[30px] text-slate-400">{item.date}</span>
								{item.title}
							</div>
							<div className={`text-[10px] font-semibold px-2 py-1 rounded-full ${item.color}`}>
								{item.status}
							</div>
						</div>
					))}
				</div>
				<div className="mt-5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
					<div className="flex items-center gap-2">
						<TrendingUp className="h-4 w-4 text-blue-500" />
						+38% engagement
					</div>
					<div className="flex items-center gap-2">
						<Sparkles className="h-4 w-4 text-purple-500" />
						AI assist on every draft
					</div>
				</div>
			</MotionDiv>

			<MotionDiv
				initial={{ y: 0 }}
				animate={{ y: [0, 5, 0] }}
				transition={{ duration: 5.6, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: 0.2 }}
				className="absolute right-8 top-14 w-44 rounded-2xl bg-white/90 dark:bg-slate-950/85 border border-slate-200/80 dark:border-slate-800/80 shadow-lg p-4"
			>
				<div className="text-[11px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">AI Draft</div>
				<div className="mt-3 flex items-center gap-2">
					<div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
						<PenTool className="h-4 w-4" />
					</div>
					<div>
						<div className="text-sm font-semibold text-slate-900 dark:text-white">Launch brief</div>
						<div className="text-[11px] text-slate-500 dark:text-slate-400">Outline complete</div>
					</div>
				</div>
				<div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-slate-900">
					<div className="h-2 w-[86%] rounded-full bg-gradient-to-r from-purple-500 to-blue-500" />
				</div>
				<div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">Tone matched to brand</div>
			</MotionDiv>

			<MotionDiv
				initial={{ y: 0 }}
				animate={{ y: [0, -5, 0] }}
				transition={{ duration: 6.1, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: 0.4 }}
				className="absolute right-10 bottom-10 w-56 rounded-2xl bg-white/90 dark:bg-slate-950/85 border border-slate-200/80 dark:border-slate-800/80 shadow-xl p-4"
			>
				<div className="flex items-center justify-between">
					<div className="text-sm font-semibold text-slate-900 dark:text-white">SEO & Quality</div>
					<div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
						<CheckCircle className="h-4 w-4" />
						Publish ready
					</div>
				</div>
				<div className="mt-4 flex items-center gap-3">
					<div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
						<BarChart3 className="h-5 w-5" />
					</div>
					<div>
						<div className="text-lg font-semibold text-slate-900 dark:text-white">92</div>
						<div className="text-[11px] text-slate-500 dark:text-slate-400">SEO score</div>
					</div>
				</div>
				<div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-slate-900">
					<div className="h-2 w-[78%] rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" />
				</div>
			</MotionDiv>

			<MotionDiv
				initial={{ y: 0 }}
				animate={{ y: [0, 4, 0] }}
				transition={{ duration: 5.9, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: 0.1 }}
				className="absolute left-10 bottom-12 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/80 p-4 shadow-lg"
			>
				<div className="text-[11px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Distribution</div>
				<div className="mt-3 space-y-2 text-[12px] text-slate-600 dark:text-slate-300">
					<div className="flex items-center gap-2">
						<span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
						Newsletter queued
					</div>
					<div className="flex items-center gap-2">
						<span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
						LinkedIn post scheduled
					</div>
					<div className="flex items-center gap-2">
						<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
						Blog publish at 9:00 AM
					</div>
				</div>
			</MotionDiv>
		</div>
	)
}
