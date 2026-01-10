import { Header } from "@/components/home/Header"
import { Footer } from "@/components/home/Footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MotionDiv } from "@/components/motion/MotionDiv"
import { AgentCard } from "@/components/use-cases/AgentCard"
import DataAnalysisHeroGraphic from "@/components/use-cases/DataAnalysisHeroGraphic"
import Link from "next/link"
import Image from "next/image"
import { BarChart3, Database, TrendingUp, FileText, CheckCircle, X, ArrowRight, Zap, Clock, PieChart, Sparkles, Brain } from "lucide-react"

export default function DataAnalysisPage() {
	const agents = [
		{
			name: "Data Collector",
			role: "Multi-Source Aggregation",
			model: "GPT-4o",
			tools: [
				{ name: "Google Sheets", icon: "📊" },
				{ name: "BigQuery", icon: <Database className="h-4 w-4" /> },
				{ name: "Snowflake", icon: "❄️" },
			],
			description: "Pulls data from databases, spreadsheets, and APIs into unified datasets",
			color: "indigo" as const,
		},
		{
			name: "Analysis Agent",
			role: "Insights & Processing",
			model: "Claude Opus 4.5",
			tools: [
				{ name: "Python", icon: "🐍" },
				{ name: "Data Analysis", icon: <Brain className="h-4 w-4" /> },
			],
			description: "Processes data, finds patterns, calculates metrics, and generates insights",
			color: "violet" as const,
		},
		{
			name: "Report Generator",
			role: "Visualization & Documentation",
			model: "Claude Sonnet 4",
			tools: [
				{ name: "Google Docs", icon: "" },
				{ name: "Charts", icon: <PieChart className="h-4 w-4" /> },
			],
			description: "Creates executive summaries, charts, and comprehensive reports",
			color: "blue" as const,
		},
	]

	const integrations = [
		{
			name: "Google BigQuery",
			icon: "/integration-icons/google-big-query-icon.png",
			capabilities: ["Data warehouse queries", "SQL analytics", "Large dataset processing"],
			usedBy: ["Data Collector", "Analysis Agent"],
		},
		{
			name: "Google Sheets",
			icon: "/integration-icons/google-sheets.png",
			capabilities: ["Data sources", "Quick analysis", "Export & sharing"],
			usedBy: ["Data Collector", "Report Generator"],
		},
		{
			name: "Snowflake",
			icon: "/integration-icons/Snowflake-icon.png",
			capabilities: ["Enterprise data platform", "Cloud data warehouse", "Advanced analytics"],
			usedBy: ["Data Collector"],
		},
		{
			name: "Google Docs",
			icon: "/integration-icons/google-docs-logo.png",
			capabilities: ["Report creation", "Documentation", "Collaborative editing"],
			usedBy: ["Report Generator"],
		},
	]

	const workflowSteps = [
		{
			number: 1,
			title: "Schedule Trigger",
			description: "Runs daily or weekly",
			icon: <Clock className="h-5 w-5" />,
		},
		{
			number: 2,
			title: "Data Collection",
			description: "Pull from all sources",
			icon: <Database className="h-5 w-5" />,
		},
		{
			number: 3,
			title: "Analysis & Processing",
			description: "Find trends & insights",
			icon: <Brain className="h-5 w-5" />,
		},
		{
			number: 4,
			title: "Visualization",
			description: "Create charts & graphs",
			icon: <PieChart className="h-5 w-5" />,
		},
		{
			number: 5,
			title: "Report Distribution",
			description: "Email summary & save",
			icon: <FileText className="h-5 w-5" />,
		},
	]

	const metrics = [
		{
			value: "80%",
			label: "Time Saved on Reporting",
			description: "Focus on strategy, not spreadsheets",
			icon: <Clock className="h-8 w-8" />,
			gradient: "from-indigo-500 via-indigo-600 to-violet-500",
			glow: "shadow-indigo-500/20",
		},
		{
			value: "95%",
			label: "Reduction in Manual Analysis",
			description: "Automate data processing",
			icon: <Zap className="h-8 w-8" />,
			gradient: "from-violet-500 via-violet-600 to-purple-500",
			glow: "shadow-violet-500/20",
		},
		{
			value: "100%",
			label: "Data Accuracy",
			description: "Eliminate human error",
			icon: <CheckCircle className="h-8 w-8" />,
			gradient: "from-purple-500 via-purple-600 to-blue-500",
			glow: "shadow-purple-500/20",
		},
		{
			value: "24/7",
			label: "Continuous Monitoring",
			description: "Always-on data intelligence",
			icon: <TrendingUp className="h-8 w-8" />,
			gradient: "from-blue-500 via-blue-600 to-indigo-500",
			glow: "shadow-blue-500/20",
		},
	]

	const quickStats = [
		{ label: "Report Frequency", value: "Daily/Weekly" },
		{ label: "Data Sources", value: "15+" },
		{ label: "Analysis Time", value: "< 5 min" },
		{ label: "Accuracy Rate", value: "99.9%" },
	]

	return (
		<div className="min-h-screen bg-background text-foreground">
			<Header />

			{/* Hero Section */}
			<section className="relative pt-32 pb-20 px-4 overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-blue-500/5 to-transparent" />
				<div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl" />
				<div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-full blur-3xl" />

				<div className="container mx-auto relative z-10">
					<div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
						<div className="max-w-2xl mx-auto lg:mx-0">
							<MotionDiv
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6 }}
								className="text-center lg:text-left mb-8"
							>
								<h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight">
									Turn Data Into Insights{" "}
									<span className="relative inline-block">
										<span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 bg-clip-text text-transparent">
											Automatically
										</span>
									</span>
								</h1>
								<p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
									Stop spending hours on manual reporting. Let AI collect, analyze, and visualize your data automatically.
								</p>
							</MotionDiv>

							<MotionDiv
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.2 }}
								className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
							>
								<Link href="/pricing">
									<Button
										size="sm"
										className="h-10 px-5 rounded-full text-sm tracking-wide bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-sm shadow-indigo-500/30"
									>
										Get Started
										<ArrowRight className="ml-2 h-4 w-4" />
									</Button>
								</Link>
								<Link href="/playground">
									<Button
										size="sm"
										variant="outline"
										className="h-10 px-5 rounded-full text-sm tracking-wide border border-slate-300/70 dark:border-slate-700/70 hover:border-slate-400 dark:hover:border-slate-600"
									>
										View Demo
									</Button>
								</Link>
							</MotionDiv>
						</div>

						<MotionDiv
							initial={{ opacity: 0, scale: 0.92 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.8, delay: 0.3 }}
							className="hidden lg:block"
						>
							<DataAnalysisHeroGraphic />
						</MotionDiv>
					</div>

					<MotionDiv
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.4 }}
						className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
					>
						{quickStats.map((stat, index) => (
							<div
								key={index}
								className="p-4 rounded-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200 dark:border-gray-800 text-center"
							>
								<div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
									{stat.value}
								</div>
								<div className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</div>
							</div>
						))}
					</MotionDiv>
				</div>
			</section>

			{/* Quick Overview */}
			<section className="py-16 px-4">
				<div className="container mx-auto max-w-4xl">
					<p className="text-lg text-muted-foreground leading-relaxed">
						Business intelligence teams waste 70% of their time collecting and cleaning data instead of analyzing it. AffinityBots automates the entire pipeline - pulling data from multiple sources, running analysis, generating visualizations, and creating executive reports on a schedule. Your team gets actionable insights delivered automatically, freeing them to make strategic decisions instead of creating spreadsheets.
					</p>
				</div>
			</section>

			{/* The Challenge */}
			<section className="py-16 px-4 bg-muted/30">
				<div className="container mx-auto max-w-5xl">
					<h2 className="text-3xl font-bold mb-8 text-center">The Challenge</h2>
					<div className="grid md:grid-cols-2 gap-6">
						<Card className="bg-card border-border">
							<CardHeader>
								<div className="flex items-start gap-3">
									<X className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
									<div>
										<CardTitle className="text-lg mb-2">Manual Data Collection</CardTitle>
										<p className="text-sm text-muted-foreground">
											Hours spent exporting data from multiple systems and consolidating spreadsheets
										</p>
									</div>
								</div>
							</CardHeader>
						</Card>
						<Card className="bg-card border-border">
							<CardHeader>
								<div className="flex items-start gap-3">
									<X className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
									<div>
										<CardTitle className="text-lg mb-2">Delayed Insights</CardTitle>
										<p className="text-sm text-muted-foreground">
											Reports take days or weeks to produce, making data outdated before decisions are made
										</p>
									</div>
								</div>
							</CardHeader>
						</Card>
						<Card className="bg-card border-border">
							<CardHeader>
								<div className="flex items-start gap-3">
									<X className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
									<div>
										<CardTitle className="text-lg mb-2">Human Error</CardTitle>
										<p className="text-sm text-muted-foreground">
											Copy-paste mistakes and formula errors lead to inaccurate reports
										</p>
									</div>
								</div>
							</CardHeader>
						</Card>
						<Card className="bg-card border-border">
							<CardHeader>
								<div className="flex items-start gap-3">
									<X className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
									<div>
										<CardTitle className="text-lg mb-2">Inconsistent Reporting</CardTitle>
										<p className="text-sm text-muted-foreground">
											Different analysts create different reports, making comparisons difficult
										</p>
									</div>
								</div>
							</CardHeader>
						</Card>
					</div>
				</div>
			</section>

			{/* The Solution - Merged with Agent Team */}
			<section className="py-16 px-4">
				<div className="container mx-auto max-w-6xl">
					<h2 className="text-3xl font-bold mb-4 text-center">Your AI Analytics Team</h2>
					<p className="text-lg text-muted-foreground mb-12 text-center max-w-3xl mx-auto">
						AffinityBots uses automated workflows to automate the entire analytics pipeline from data collection to report delivery. Three specialized agents work together to deliver actionable business intelligence.
					</p>
					<div className="grid md:grid-cols-3 gap-8">
						{agents.map((agent, index) => (
							<MotionDiv
								key={index}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
								viewport={{ once: true }}
							>
								<AgentCard agent={agent} />
							</MotionDiv>
						))}
					</div>
				</div>
			</section>

			{/* How It Works - Compact Version */}
			<section className="py-16 px-4 bg-muted/30">
				<div className="container mx-auto max-w-6xl">
					<h2 className="text-3xl font-bold mb-4 text-center">How It Works</h2>
					<p className="text-lg text-muted-foreground mb-12 text-center">
						From raw data to executive report automatically
					</p>

					{/* Desktop: Horizontal Flow */}
					<div className="hidden md:block relative">
						<div className="flex items-center justify-between gap-4 relative">
							{/* Connecting line */}
							<div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-600 -translate-y-1/2 -z-10" />

							{workflowSteps.map((step, index) => (
								<MotionDiv
									key={index}
									initial={{ opacity: 0, scale: 0.8 }}
									whileInView={{ opacity: 1, scale: 1 }}
									transition={{ duration: 0.4, delay: index * 0.1 }}
									viewport={{ once: true }}
									className="flex-1 relative"
								>
									<div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-indigo-500/20 shadow-lg hover:shadow-indigo-500/20 transition-shadow">
										<div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white mb-4 mx-auto">
											{step.icon}
										</div>
										<h3 className="text-sm font-bold text-center mb-2">{step.title}</h3>
										<p className="text-xs text-muted-foreground text-center">{step.description}</p>
									</div>
								</MotionDiv>
							))}
						</div>
					</div>

					{/* Tablet: 2-column Grid */}
					<div className="hidden sm:grid md:hidden grid-cols-2 gap-4">
						{workflowSteps.map((step, index) => (
							<MotionDiv
								key={index}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.4, delay: index * 0.1 }}
								viewport={{ once: true }}
							>
								<div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-indigo-500/20">
									<div className="flex items-center gap-3 mb-3">
										<div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex-shrink-0">
											{step.icon}
										</div>
										<h3 className="text-sm font-bold">{step.title}</h3>
									</div>
									<p className="text-xs text-muted-foreground">{step.description}</p>
								</div>
							</MotionDiv>
						))}
					</div>

					{/* Mobile: Compact Vertical List */}
					<div className="sm:hidden space-y-3">
						{workflowSteps.map((step, index) => (
							<MotionDiv
								key={index}
								initial={{ opacity: 0, x: -20 }}
								whileInView={{ opacity: 1, x: 0 }}
								transition={{ duration: 0.3, delay: index * 0.05 }}
								viewport={{ once: true }}
								className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-lg p-4 border border-indigo-500/20"
							>
								<div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex-shrink-0">
									{step.icon}
								</div>
								<div className="flex-1 min-w-0">
									<h3 className="text-sm font-bold truncate">{step.title}</h3>
									<p className="text-xs text-muted-foreground">{step.description}</p>
								</div>
							</MotionDiv>
						))}
					</div>
				</div>
			</section>

			{/* Key Capabilities */}
			<section className="py-16 px-4">
				<div className="container mx-auto max-w-5xl">
					<h2 className="text-3xl font-bold mb-12 text-center">Key Capabilities</h2>
					<div className="grid md:grid-cols-3 gap-8">
						<Card className="bg-card border-border">
							<CardHeader>
								<Database className="h-8 w-8 text-indigo-500 mb-4" />
								<CardTitle className="text-xl mb-2">Multi-Source Data</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground mb-4">
									Connect to BigQuery, Snowflake, Google Sheets, APIs, and more to consolidate data from all sources.
								</p>
								<p className="text-xs text-muted-foreground italic">
									Example: Sales data + marketing data + customer support metrics = holistic view
								</p>
							</CardContent>
						</Card>

						<Card className="bg-card border-border">
							<CardHeader>
								<PieChart className="h-8 w-8 text-blue-500 mb-4" />
								<CardTitle className="text-xl mb-2">Advanced Analysis</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground mb-4">
									AI identifies trends, anomalies, correlations, and actionable insights automatically.
								</p>
								<p className="text-xs text-muted-foreground italic">
									Example: "Sales dropped 15% after pricing change" → automatic flagging
								</p>
							</CardContent>
						</Card>

						<Card className="bg-card border-border">
							<CardHeader>
								<TrendingUp className="h-8 w-8 text-purple-500 mb-4" />
								<CardTitle className="text-xl mb-2">Integrations</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground mb-4">
									Connect to BigQuery, Snowflake, Google Sheets, and your data stack.
								</p>
								<div className="flex flex-wrap gap-3 mt-4">
									{integrations.map((integration, idx) => (
										<div
											key={idx}
											className="relative group"
											title={integration.name}
										>
											<div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:border-indigo-500/50 transition-colors">
												{integration.icon ? (
													<Image
														src={integration.icon}
														alt={integration.name}
														width={24}
														height={24}
														className="object-contain"
													/>
												) : null}
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Results - Custom Metrics */}
			<section className="py-16 px-4 bg-muted/30">
				<div className="container mx-auto max-w-6xl">
					<h2 className="text-3xl font-bold mb-4 text-center">Results You Can Expect</h2>
					<p className="text-lg text-muted-foreground mb-12 text-center">
						Faster insights, better decisions
					</p>
					<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
						{metrics.map((metric, index) => (
							<MotionDiv
								key={index}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
								viewport={{ once: true }}
							>
								<div className={`relative overflow-hidden rounded-2xl p-[2px] bg-gradient-to-br ${metric.gradient} ${metric.glow} hover:shadow-xl transition-all duration-300 group`}>
									<div className="relative h-full bg-white dark:bg-gray-900 rounded-2xl p-6">
										<div className={`flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${metric.gradient} mb-4 text-white`}>
											{metric.icon}
										</div>
										<div className={`text-4xl font-bold mb-2 bg-gradient-to-br ${metric.gradient} bg-clip-text text-transparent`}>
											{metric.value}
										</div>
										<h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
											{metric.label}
										</h3>
										<p className="text-xs text-muted-foreground">
											{metric.description}
										</p>
									</div>
								</div>
							</MotionDiv>
						))}
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="py-16 px-4 bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-indigo-500/10">
				<div className="container mx-auto text-center max-w-3xl">
					<h2 className="text-3xl md:text-4xl font-bold mb-4">
						Start Automating Analytics Today
					</h2>
					<p className="text-xl text-muted-foreground mb-8">
						Join data teams already using AffinityBots to deliver insights faster
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Link href="/pricing">
							<Button
								size="sm"
								className="h-10 px-5 rounded-full text-sm tracking-wide bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-sm shadow-indigo-500/30"
							>
								Get Started
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</Link>
						<Link href="/playground">
							<Button
								size="sm"
								variant="outline"
								className="h-10 px-5 rounded-full text-sm tracking-wide border border-slate-300/70 dark:border-slate-700/70 hover:border-slate-400 dark:hover:border-slate-600"
							>
								View Demo
							</Button>
						</Link>
					</div>
				</div>
			</section>

			<Footer />
		</div>
	)
}
