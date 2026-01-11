import { Header } from "@/components/home/Header"
import { Footer } from "@/components/home/Footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MotionDiv } from "@/components/motion/MotionDiv"
import { AgentCard } from "@/components/use-cases/AgentCard"
import LeadCollectionHeroGraphic from "@/components/use-cases/LeadCollectionHeroGraphic"
import Link from "next/link"
import Image from "next/image"
import { Target, CheckSquare, TrendingUp, Database as DatabaseIcon, Database, CheckCircle, X, ArrowRight, ArrowLeft, Zap, Clock, Sparkles, Users } from "lucide-react"

export default function LeadCollectionPage() {
	const agents = [
		{
			name: "Form Processor",
			role: "Data Validation & Cleaning",
			model: "GPT-4o",
			tools: [
				{ name: "Data Validation", icon: <CheckSquare className="h-4 w-4" /> },
				{ name: "Email", icon: "📧" },
			],
			description: "Validates form data, cleans duplicates, and standardizes contact information",
			color: "orange" as const,
		},
		{
			name: "Lead Scorer",
			role: "Quality Assessment",
			model: "Claude Sonnet 4",
			tools: [
				{ name: "Custom Criteria", icon: <Target className="h-4 w-4" /> },
				{ name: "Web Search", icon: "🔍" },
			],
			description: "Scores leads based on firmographic data, engagement, and fit criteria",
			color: "cyan" as const,
		},
		{
			name: "Data Enrichment Agent",
			role: "Information Enhancement",
			model: "GPT-5",
			tools: [
				{ name: "Web Search", icon: "🌐" },
				{ name: "Company Database", icon: <Database className="h-4 w-4" /> },
			],
			description: "Enriches lead data with company info, social profiles, and contact details",
			color: "blue" as const,
		},
	]

	const integrations = [
		{
			name: "Google Sheets",
			icon: "/integration-icons/google-sheets.png",
			capabilities: ["Lead database", "Data storage", "Export & reporting"],
			usedBy: ["Form Processor", "Lead Scorer"],
		},
		{
			name: "HubSpot",
			icon: "/integration-icons/hubspot-icon.png",
			capabilities: ["CRM sync", "Contact creation", "Pipeline management"],
			usedBy: ["Data Enrichment Agent"],
		},
		{
			name: "Gmail",
			icon: "/integration-icons/gmail-icon.png",
			capabilities: ["Follow-up emails", "Nurture campaigns", "Notifications"],
			usedBy: ["Lead Scorer"],
		},
		{
			name: "Zapier",
			icon: "/integration-icons/zapier-icon.jpeg",
			capabilities: ["Multi-source collection", "Cross-platform sync", "Automation triggers"],
			usedBy: ["Form Processor"],
		},
	]

	const workflowSteps = [
		{
			number: 1,
			title: "Webhook Trigger",
			description: "Lead submits form",
			icon: <Zap className="h-5 w-5" />,
		},
		{
			number: 2,
			title: "Data Validation",
			description: "Clean & validate data",
			icon: <CheckSquare className="h-5 w-5" />,
		},
		{
			number: 3,
			title: "Lead Scoring",
			description: "Analyze & prioritize",
			icon: <TrendingUp className="h-5 w-5" />,
		},
		{
			number: 4,
			title: "Data Enrichment",
			description: "Add company details",
			icon: <Sparkles className="h-5 w-5" />,
		},
		{
			number: 5,
			title: "CRM Sync",
			description: "Sync to HubSpot",
			icon: <Database className="h-5 w-5" />,
		},
	]

	const metrics = [
		{
			value: "5x",
			label: "Increase in Qualified Leads",
			description: "Focus on high-value prospects",
			icon: <Target className="h-8 w-8" />,
			gradient: "from-orange-500 via-orange-600 to-amber-500",
			glow: "shadow-orange-500/20",
		},
		{
			value: "90%",
			label: "Reduction in Manual Data Entry",
			description: "Automate the entire process",
			icon: <Clock className="h-8 w-8" />,
			gradient: "from-amber-500 via-amber-600 to-yellow-500",
			glow: "shadow-amber-500/20",
		},
		{
			value: "100%",
			label: "Lead Data Completeness",
			description: "Every field filled automatically",
			icon: <CheckCircle className="h-8 w-8" />,
			gradient: "from-yellow-500 via-yellow-600 to-orange-500",
			glow: "shadow-yellow-500/20",
		},
		{
			value: "85%",
			label: "Faster Lead Processing",
			description: "From form to CRM in seconds",
			icon: <Zap className="h-8 w-8" />,
			gradient: "from-orange-500 via-amber-500 to-orange-600",
			glow: "shadow-orange-500/20",
		},
	]

	const quickStats = [
		{ label: "Avg Processing Time", value: "< 30 sec" },
		{ label: "Data Accuracy", value: "99.8%" },
		{ label: "Leads Processed", value: "10k+/month" },
		{ label: "Integration Options", value: "20+" },
	]

	return (
		<div className="min-h-screen bg-background text-foreground">
			<Header />

			{/* Back Navigation */}
			<section className="pt-32 pb-8 px-4">
				<div className="container mx-auto">
					<Link href="/use-cases">
						<Button variant="ghost" className="text-muted-foreground hover:text-foreground">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Use Cases Page
						</Button>
					</Link>
				</div>
			</section>

			{/* Hero Section */}
			<section className="relative pt-8 pb-20 px-4 overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-amber-500/5 to-transparent" />
				<div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-3xl" />
				<div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-orange-500/10 to-transparent rounded-full blur-3xl" />

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
									Capture, Score & Enrich{" "}
									<span className="relative inline-block">
										<span className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 bg-clip-text text-transparent">
											Every Lead Automatically
										</span>
									</span>
								</h1>
								<p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
									Never lose a lead to manual data entry again. Automate collection, validation, scoring, and enrichment from every source.
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
										className="h-10 px-5 rounded-full text-sm tracking-wide bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-sm shadow-orange-500/30"
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
							<LeadCollectionHeroGraphic />
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
								<div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
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
						Lead generation campaigns are useless if leads fall through the cracks due to slow manual processing. AffinityBots captures leads from every source - forms, emails, integrations - validates and cleans data automatically, scores for priority, enriches with company information, and syncs to your CRM instantly. Your sales team gets complete, qualified leads without lifting a finger.
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
										<CardTitle className="text-lg mb-2">Fragmented Lead Sources</CardTitle>
										<p className="text-sm text-muted-foreground">
											Leads come from multiple platforms - forms, emails, ads - and fall through gaps
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
										<CardTitle className="text-lg mb-2">Dirty Data</CardTitle>
										<p className="text-sm text-muted-foreground">
											Invalid emails, duplicate entries, and incomplete information waste sales time
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
										<CardTitle className="text-lg mb-2">Manual Data Entry</CardTitle>
										<p className="text-sm text-muted-foreground">
											Hours spent copying lead info from forms to CRM introduces errors
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
										<CardTitle className="text-lg mb-2">No Prioritization</CardTitle>
										<p className="text-sm text-muted-foreground">
											Sales treats all leads equally instead of focusing on high-value prospects
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
					<h2 className="text-3xl font-bold mb-4 text-center">Your AI Lead Team</h2>
					<p className="text-lg text-muted-foreground mb-12 text-center max-w-3xl mx-auto">
						AffinityBots uses automated workflows to process every lead through validation, scoring, enrichment, and CRM sync automatically. Three specialized agents work in sequence to ensure every lead is qualified and complete.
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
						From raw form data to qualified CRM contact in seconds
					</p>

					{/* Desktop: Horizontal Flow */}
					<div className="hidden md:block relative">
						<div className="flex items-center justify-between gap-4 relative">
							{/* Connecting line */}
							<div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 -translate-y-1/2 -z-10" />

							{workflowSteps.map((step, index) => (
								<MotionDiv
									key={index}
									initial={{ opacity: 0, scale: 0.8 }}
									whileInView={{ opacity: 1, scale: 1 }}
									transition={{ duration: 0.4, delay: index * 0.1 }}
									viewport={{ once: true }}
									className="flex-1 relative"
								>
									<div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-orange-500/20 shadow-lg hover:shadow-orange-500/20 transition-shadow">
										<div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-white mb-4 mx-auto">
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
								<div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-orange-500/20">
									<div className="flex items-center gap-3 mb-3">
										<div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-white flex-shrink-0">
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
								className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-lg p-4 border border-orange-500/20"
							>
								<div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-white flex-shrink-0">
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
								<Database className="h-8 w-8 text-orange-500 mb-4" />
								<CardTitle className="text-xl mb-2">Knowledge Base</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground mb-4">
									Upload ideal customer profiles, scoring criteria, and company databases so agents qualify leads accurately.
								</p>
								<p className="text-xs text-muted-foreground italic">
									Example: Target company sizes, industries, geographic regions, budget indicators
								</p>
							</CardContent>
						</Card>

						<Card className="bg-card border-border">
							<CardHeader>
								<TrendingUp className="h-8 w-8 text-blue-500 mb-4" />
								<CardTitle className="text-xl mb-2">Smart Scoring</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground mb-4">
									AI analyzes company size, industry, engagement, and fit to assign priority scores automatically.
								</p>
								<p className="text-xs text-muted-foreground italic">
									Example: Enterprise software company + decision maker = high priority score
								</p>
							</CardContent>
						</Card>

						<Card className="bg-card border-border">
							<CardHeader>
								<DatabaseIcon className="h-8 w-8 text-purple-500 mb-4" />
								<CardTitle className="text-xl mb-2">Integrations</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground mb-4">
									Connect to Google Sheets, HubSpot, Gmail, Zapier for complete lead collection and sync.
								</p>
								<div className="flex flex-wrap gap-3 mt-4">
									{integrations.map((integration, idx) => (
										<div
											key={idx}
											className="relative group"
											title={integration.name}
										>
											<div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:border-orange-500/50 transition-colors">
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
						Transform lead quality and processing speed
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
			<section className="py-16 px-4 bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-orange-500/10">
				<div className="container mx-auto text-center max-w-3xl">
					<h2 className="text-3xl md:text-4xl font-bold mb-4">
						Start Capturing Better Leads Today
					</h2>
					<p className="text-xl text-muted-foreground mb-8">
						Join businesses already using AffinityBots to maximize lead quality
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Link href="/pricing">
							<Button
								size="sm"
								className="h-10 px-5 rounded-full text-sm tracking-wide bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-sm shadow-orange-500/30"
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
