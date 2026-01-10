"use client"

import { MotionDiv } from "@/components/motion/MotionDiv"
import { Database, BarChart3, FileText, TrendingUp, LineChart, CheckCircle } from "lucide-react"

/**
 * Clean, professional hero graphic for Data Analysis
 * Simple 3-stage flow: Raw Data → AI Analyze → Insights
 */
export default function DataAnalysisHeroGraphic() {
	return (
		<div className="relative w-full max-w-3xl mx-auto h-[420px]">
			<div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-slate-900/5 via-indigo-500/5 to-transparent border border-white/60 dark:border-white/10" />
			<div className="absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_18%_18%,rgba(99,102,241,0.22),transparent_55%),radial-gradient(circle_at_85%_25%,rgba(59,130,246,0.2),transparent_45%)]" />
			<div className="absolute inset-0 rounded-[32px] bg-[linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:28px_28px] dark:bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)]" />

			<MotionDiv
				initial={{ y: 0 }}
				animate={{ y: [0, -6, 0] }}
				transition={{ duration: 6.3, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
				className="absolute left-8 top-10 right-48 rounded-2xl bg-white/90 dark:bg-slate-950/85 border border-slate-200/80 dark:border-slate-800/80 shadow-[0_24px_70px_-32px_rgba(15,23,42,0.55)] p-5"
			>
				<div className="flex items-center justify-between mb-4">
					<div className="text-sm font-semibold text-slate-900 dark:text-white">Data Sources</div>
					<div className="flex items-center gap-2 text-[11px] text-indigo-600 dark:text-indigo-400">
						<span className="h-2 w-2 rounded-full bg-indigo-500" />
						Syncing
					</div>
				</div>
				<div className="space-y-3">
					{[
						{ label: "BigQuery · 4.2M rows", status: "Updated", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
						{ label: "Snowflake · 2.1M rows", status: "Running", color: "bg-amber-500/15 text-amber-600 dark:text-amber-300" },
						{ label: "Sheets · Q3 KPIs", status: "Merged", color: "bg-blue-500/15 text-blue-600 dark:text-blue-300" },
					].map((item) => (
						<div key={item.label} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-950/70 px-3 py-2">
							<div className="flex items-center gap-2 text-[12px] text-slate-700 dark:text-slate-300">
								<Database className="h-4 w-4 text-indigo-500" />
								{item.label}
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
						Anomaly rate down 12%
					</div>
					<div className="flex items-center gap-2">
						<BarChart3 className="h-4 w-4 text-indigo-500" />
						Auto insights enabled
					</div>
				</div>
			</MotionDiv>

			<MotionDiv
				initial={{ y: 0 }}
				animate={{ y: [0, 5, 0] }}
				transition={{ duration: 5.7, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: 0.2 }}
				className="absolute right-8 top-14 w-44 rounded-2xl bg-white/90 dark:bg-slate-950/85 border border-slate-200/80 dark:border-slate-800/80 shadow-lg p-4"
			>
				<div className="text-[11px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Trendline</div>
				<div className="mt-3 flex items-center gap-2">
					<div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white">
						<LineChart className="h-4 w-4" />
					</div>
					<div>
						<div className="text-sm font-semibold text-slate-900 dark:text-white">+28%</div>
						<div className="text-[11px] text-slate-500 dark:text-slate-400">MoM growth</div>
					</div>
				</div>
				<div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-slate-900">
					<div className="h-2 w-[78%] rounded-full bg-gradient-to-r from-indigo-500 to-blue-500" />
				</div>
				<div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">Auto forecasted</div>
			</MotionDiv>

			<MotionDiv
				initial={{ y: 0 }}
				animate={{ y: [0, -5, 0] }}
				transition={{ duration: 6.1, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: 0.4 }}
				className="absolute right-10 bottom-10 w-56 rounded-2xl bg-white/90 dark:bg-slate-950/85 border border-slate-200/80 dark:border-slate-800/80 shadow-xl p-4"
			>
				<div className="flex items-center justify-between">
					<div className="text-sm font-semibold text-slate-900 dark:text-white">Weekly Report</div>
					<div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
						<CheckCircle className="h-4 w-4" />
						Ready
					</div>
				</div>
				<div className="mt-4 flex items-center gap-3">
					<div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
						<FileText className="h-5 w-5" />
					</div>
					<div>
						<div className="text-sm font-semibold text-slate-900 dark:text-white">Executive summary</div>
						<div className="text-[11px] text-slate-500 dark:text-slate-400">9 charts · 3 insights</div>
					</div>
				</div>
				<div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-slate-900">
					<div className="h-2 w-[84%] rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
				</div>
			</MotionDiv>

			<MotionDiv
				initial={{ y: 0 }}
				animate={{ y: [0, 4, 0] }}
				transition={{ duration: 5.9, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: 0.1 }}
				className="absolute left-10 bottom-12 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/80 p-4 shadow-lg"
			>
				<div className="text-[11px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Insights</div>
				<div className="mt-3 space-y-2 text-[12px] text-slate-600 dark:text-slate-300">
					<div className="flex items-center gap-2">
						<span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
						Churn risk cohort detected
					</div>
					<div className="flex items-center gap-2">
						<span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
						Top channel ROI up 19%
					</div>
					<div className="flex items-center gap-2">
						<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
						Pipeline velocity improved
					</div>
				</div>
			</MotionDiv>
		</div>
	)
}
