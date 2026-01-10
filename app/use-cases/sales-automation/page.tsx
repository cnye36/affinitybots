import { Header } from "@/components/home/Header"
import { Footer } from "@/components/home/Footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MotionDiv } from "@/components/motion/MotionDiv"
import { AgentCard } from "@/components/use-cases/AgentCard"
import SalesAutomationHeroGraphic from "@/components/use-cases/SalesAutomationHeroGraphic"
import Link from "next/link"
import { TrendingUp, Mail, Calendar, Database, CheckCircle, X, ArrowRight, Zap, Bot, Target, Users, BarChart3, Clock, Sparkles } from "lucide-react"
import Image from "next/image"

export default function SalesAutomationPage() {
	const agents = [
		{
			name: "Lead Qualifier",
			role: "Initial Lead Assessment",
			model: "Claude Sonnet 4",
			tools: ["HubSpot", "Web Search"],
			description: "Analyzes incoming leads, scores them based on criteria, and routes qualified prospects",
			color: "blue" as const,
		},
		{
			name: "Email Outreach Agent",
			role: "Personalized Communication",
			model: "GPT-5.2",
			tools: ["Gmail", "HubSpot"],
			description: "Crafts personalized emails, follows up automatically, and tracks engagement",
			color: "purple" as const,
		},
		{
			name: "Meeting Scheduler",
			role: "Calendar Management",
			model: "Claude 3.7 Sonnet",
			tools: ["Google Calendar", "Gmail"],
			description: "Coordinates availability, books meetings, and sends confirmations automatically",
			color: "indigo" as const,
		},
	]

	const integrations = [
		{
			name: "HubSpot",
			icon: "/integration-icons/hubspot-icon.png",
			capabilities: ["CRM management", "Lead tracking", "Pipeline updates"],
			usedBy: ["Lead Qualifier", "Email Outreach Agent"],
		},
		{
			name: "Gmail",
			icon: "/integration-icons/gmail-icon.png",
			capabilities: ["Email automation", "Follow-up sequences", "Engagement tracking"],
			usedBy: ["Email Outreach Agent", "Meeting Scheduler"],
		},
		{
			name: "Google Calendar",
			icon: "/integration-icons/google-calendar-logo.png",
			capabilities: ["Availability checking", "Meeting scheduling", "Automated reminders"],
			usedBy: ["Meeting Scheduler"],
		},
		{
			name: "Google Sheets",
			icon: "/integration-icons/google-sheets.png",
			capabilities: ["Lead database", "Analytics", "Reporting"],
			usedBy: ["Lead Qualifier"],
		},
	]

	// Map tool names to integration icons
	const toolIconMap: Record<string, string> = {
		"HubSpot": "/integration-icons/hubspot-icon.png",
		"Gmail": "/integration-icons/gmail-icon.png",
		"Google Calendar": "/integration-icons/google-calendar-logo.png",
		"Google Sheets": "/integration-icons/google-sheets.png",
		"Web Search": "/integration-icons/tavily-color.svg",
	}

	const workflowSteps = [
		{
			number: 1,
			title: "Webhook Trigger",
			description: "New lead submits form on your website or landing page",
			icon: <Zap className="h-5 w-5" />,
			color: "from-blue-500 to-blue-600",
		},
		{
			number: 2,
			title: "Lead Qualification",
			description: "Lead Qualifier agent analyzes company size, industry, budget, and fit score",
			icon: <Target className="h-5 w-5" />,
			color: "from-violet-500 to-violet-600",
		},
		{
			number: 3,
			title: "Automated Outreach",
			description: "If qualified, Email Outreach agent sends personalized introduction and value proposition",
			icon: <Mail className="h-5 w-5" />,
			color: "from-purple-500 to-purple-600",
		},
		{
			number: 4,
			title: "Schedule Meeting",
			description: "On positive response, Meeting Scheduler finds availability and books calendar time",
			icon: <Calendar className="h-5 w-5" />,
			color: "from-indigo-500 to-indigo-600",
		},
		{
			number: 5,
			title: "CRM Update",
			description: "All interactions logged to HubSpot CRM with complete activity history",
			icon: <Database className="h-5 w-5" />,
			color: "from-emerald-500 to-emerald-600",
		},
	]

	const metrics = [
		{
			value: "3x",
			label: "Faster Lead Qualification",
			description: "Process leads in minutes, not hours",
			icon: <Clock className="h-8 w-8" />,
			gradient: "from-blue-500 via-blue-600 to-cyan-500",
		},
		{
			value: "85%",
			label: "Reduction in Manual Tasks",
			description: "Free your team to focus on closing",
			icon: <Bot className="h-8 w-8" />,
			gradient: "from-violet-500 via-purple-600 to-pink-500",
		},
		{
			value: "40%",
			label: "Increase in Meetings Booked",
			description: "Instant response times convert better",
			icon: <Users className="h-8 w-8" />,
			gradient: "from-orange-500 via-orange-600 to-amber-500",
		},
		{
			value: "24/7",
			label: "Always-On Availability",
			description: "Never miss a lead, any time zone",
			icon: <BarChart3 className="h-8 w-8" />,
			gradient: "from-emerald-500 via-emerald-600 to-teal-500",
		},
	]

	return (
		<div className="min-h-screen bg-background text-foreground">
			<Header />

			{/* Hero Section - Redesigned */}
			<section className="relative pt-32 pb-20 px-4 overflow-hidden">
				{/* Animated gradient background */}
				<div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent" />
				<div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl" />
				<div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-3xl" />

				<div className="container mx-auto relative z-10">
					<div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
						{/* Left side - Text content */}
						<div className="max-w-2xl mx-auto lg:mx-0">
							<MotionDiv
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6 }}
								className="text-center lg:text-left mb-8"
							>
								<h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight">
									Automate Your Entire{" "}
									<span className="relative inline-block">
										<span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
											Sales Pipeline
										</span>
									</span>
								</h1>
								<p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
									From lead qualification to meeting booking, let AI handle repetitive sales tasks while your team focuses on closing deals
								</p>
							</MotionDiv>

							{/* Hero CTAs */}
							<MotionDiv
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.2 }}
								className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
							>
								<Link href="/pricing">
									<Button
										size="sm"
										className="h-10 px-5 rounded-full text-sm tracking-wide bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm shadow-blue-500/30"
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

						{/* Right side - Hero Graphic */}
						<MotionDiv
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.8, delay: 0.3 }}
							className="hidden lg:block"
						>
							<SalesAutomationHeroGraphic />
						</MotionDiv>
					</div>

					{/* Quick stats bar */}
					<MotionDiv
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.4 }}
						className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
					>
						{[
							{ label: "Time Saved", value: "65%" },
							{ label: "Lead Response", value: "<1min" },
							{ label: "Conversion Rate", value: "+40%" },
							{ label: "ROI", value: "3x" },
						].map((stat, index) => (
							<div
								key={index}
								className="p-4 rounded-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200 dark:border-gray-800 text-center"
							>
								<div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
									{stat.value}
								</div>
								<div className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</div>
							</div>
						))}
					</MotionDiv>
				</div>
			</section>

			{/* Quick Overview */}
			<section className="py-16 px-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
				<div className="container mx-auto max-w-4xl">
					<MotionDiv
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						viewport={{ once: true }}
					>
						<p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-center">
							Sales teams waste <strong className="text-foreground">65% of their time</strong> on administrative tasks instead of selling. AffinityBots eliminates this bottleneck by deploying AI agents through automated workflows that qualify leads, send personalized outreach, schedule meetings, and update your CRM - all automatically. Your sales reps only engage when a qualified prospect is ready to talk, maximizing their time on high-value conversations.
						</p>
					</MotionDiv>
				</div>
			</section>

			{/* The Challenge */}
			<section className="py-20 px-4">
				<div className="container mx-auto max-w-6xl">
					<MotionDiv
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						viewport={{ once: true }}
						className="text-center mb-12"
					>
						<h2 className="text-4xl md:text-5xl font-bold mb-4">The Challenge</h2>
						<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
							Traditional sales processes are slowing you down
						</p>
					</MotionDiv>
					<div className="grid md:grid-cols-2 gap-6">
						{[
							{
								title: "Manual Lead Qualification",
								description: "Sales reps spend hours researching and qualifying leads that may never convert",
							},
							{
								title: "Slow Response Times",
								description: "Leads go cold while waiting for manual follow-up and scheduling",
							},
							{
								title: "Inconsistent Outreach",
								description: "Generic templates and inconsistent messaging reduce conversion rates",
							},
							{
								title: "CRM Data Entry",
								description: "Manual logging of every interaction takes time away from actual selling",
							},
						].map((challenge, index) => (
							<MotionDiv
								key={index}
								initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
								whileInView={{ opacity: 1, x: 0 }}
								transition={{ duration: 0.6, delay: index * 0.1 }}
								viewport={{ once: true }}
							>
								<Card className="bg-card border-border h-full hover:shadow-lg transition-shadow duration-300">
									<CardHeader>
										<div className="flex items-start gap-3">
											<div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
												<X className="h-5 w-5 text-red-500" />
											</div>
											<div>
												<CardTitle className="text-lg mb-2">{challenge.title}</CardTitle>
												<p className="text-sm text-muted-foreground">
													{challenge.description}
												</p>
											</div>
										</div>
									</CardHeader>
								</Card>
							</MotionDiv>
						))}
					</div>
				</div>
			</section>

			{/* Your AI Sales Team - Merged Solution Section */}
			<section className="py-20 px-4 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent">
				<div className="container mx-auto max-w-6xl">
					<MotionDiv
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						viewport={{ once: true }}
						className="text-center mb-12"
					>
						<h2 className="text-4xl md:text-5xl font-bold mb-4">Your AI Sales Team</h2>
						<p className="text-lg text-muted-foreground max-w-3xl mx-auto">
							AffinityBots uses automated workflows to create an intelligent sales pipeline. Each specialized agent handles a specific task, working together 24/7 to qualify leads and book meetings while your team focuses on closing deals.
						</p>
					</MotionDiv>
					<div className="grid md:grid-cols-3 gap-8">
						{agents.map((agent, index) => (
							<MotionDiv
								key={index}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
								viewport={{ once: true }}
							>
								<AgentCard agent={{
									name: agent.name,
									role: agent.role,
									model: agent.model,
									tools: agent.tools.map(tool => ({ name: tool, icon: toolIconMap[tool] || "" })),
									description: agent.description,
									color: agent.color,
								}} />
							</MotionDiv>
						))}
					</div>
				</div>
			</section>

			{/* How It Works - Compact Horizontal Design */}
			<section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
				<div className="container mx-auto max-w-7xl">
					<MotionDiv
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						viewport={{ once: true }}
						className="text-center mb-12"
					>
						<h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
						<p className="text-lg text-muted-foreground">
							From lead capture to meeting booked in minutes, not days
						</p>
					</MotionDiv>

					{/* Desktop: Horizontal Flow */}
					<div className="hidden lg:block">
						<div className="relative">
							{/* Connecting line */}
							<div className="absolute top-[52px] left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" />

							<div className="grid grid-cols-5 gap-4">
								{workflowSteps.map((step, index) => (
									<MotionDiv
										key={index}
										initial={{ opacity: 0, y: 20 }}
										whileInView={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.5, delay: index * 0.1 }}
										viewport={{ once: true }}
										className="relative group"
									>
										{/* Icon with number badge */}
										<div className="flex flex-col items-center mb-4">
											<div className="relative">
												<div className={`w-[104px] h-[104px] rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform duration-300 relative z-10`}>
													<div className="text-3xl">
														{step.icon}
													</div>
												</div>
												{/* Number badge */}
												<div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white dark:bg-gray-900 border-2 border-current flex items-center justify-center text-xs font-bold z-20" style={{ color: `var(--${step.color.split('-')[1]}-600)` }}>
													{step.number}
												</div>
											</div>
										</div>

										{/* Content card */}
										<div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-gray-800 group-hover:shadow-lg transition-all duration-300 group-hover:bg-white/80 dark:group-hover:bg-gray-900/80 min-h-[140px] flex flex-col">
											<h3 className="text-sm font-bold text-foreground mb-2 text-center">
												{step.title}
											</h3>
											<p className="text-xs text-muted-foreground leading-relaxed text-center flex-1">
												{step.description}
											</p>
										</div>

										{/* Arrow connector */}
										{index < workflowSteps.length - 1 && (
											<div className="absolute top-[52px] right-0 translate-x-1/2 w-4 h-4 -rotate-45 border-r-2 border-t-2 border-gray-400 dark:border-gray-600 z-20 bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900" />
										)}
									</MotionDiv>
								))}
							</div>
						</div>
					</div>

					{/* Tablet: 2-column grid */}
					<div className="hidden md:grid lg:hidden grid-cols-2 gap-6">
						{workflowSteps.map((step, index) => (
							<MotionDiv
								key={index}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
								viewport={{ once: true }}
								className="group"
							>
								<div className="flex gap-4 items-start bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl p-5 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all duration-300 hover:bg-white/80 dark:hover:bg-gray-900/80 h-full">
									{/* Icon */}
									<div className="flex-shrink-0">
										<div className="relative">
											<div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-md`}>
												{step.icon}
											</div>
											<div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-white dark:bg-gray-900 border-2 border-current flex items-center justify-center text-xs font-bold" style={{ color: `var(--${step.color.split('-')[1]}-600)` }}>
												{step.number}
											</div>
										</div>
									</div>

									{/* Content */}
									<div className="flex-1 min-w-0">
										<h3 className="text-base font-bold text-foreground mb-2">
											{step.title}
										</h3>
										<p className="text-sm text-muted-foreground leading-relaxed">
											{step.description}
										</p>
									</div>
								</div>
							</MotionDiv>
						))}
					</div>

					{/* Mobile: Vertical compact list */}
					<div className="md:hidden space-y-4">
						{workflowSteps.map((step, index) => (
							<MotionDiv
								key={index}
								initial={{ opacity: 0, x: -20 }}
								whileInView={{ opacity: 1, x: 0 }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
								viewport={{ once: true }}
								className="relative"
							>
								<div className="flex gap-3 items-start bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-gray-800">
									{/* Icon */}
									<div className="flex-shrink-0">
										<div className="relative">
											<div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-md`}>
												{step.icon}
											</div>
											<div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-gray-900 border-2 border-current flex items-center justify-center text-[10px] font-bold" style={{ color: `var(--${step.color.split('-')[1]}-600)` }}>
												{step.number}
											</div>
										</div>
									</div>

									{/* Content */}
									<div className="flex-1 min-w-0">
										<h3 className="text-sm font-bold text-foreground mb-1.5">
											{step.title}
										</h3>
										<p className="text-xs text-muted-foreground leading-relaxed">
											{step.description}
										</p>
									</div>
								</div>

								{/* Connecting line */}
								{index < workflowSteps.length - 1 && (
									<div className="ml-6 h-4 w-0.5 bg-gradient-to-b from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-800" />
								)}
							</MotionDiv>
						))}
					</div>
				</div>
			</section>

			{/* Key Capabilities */}
			<section className="py-20 px-4">
				<div className="container mx-auto max-w-6xl">
					<MotionDiv
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						viewport={{ once: true }}
						className="text-center mb-12"
					>
						<h2 className="text-4xl md:text-5xl font-bold mb-4">Key Capabilities</h2>
					</MotionDiv>
					<div className="grid md:grid-cols-3 gap-8">
						<MotionDiv
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6 }}
							viewport={{ once: true }}
						>
							<Card className="bg-card border-border h-full hover:shadow-xl transition-shadow duration-300">
								<CardHeader>
									<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
										<Database className="h-6 w-6 text-white" />
									</div>
									<CardTitle className="text-xl mb-2">Knowledge Base</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground mb-4 leading-relaxed">
										Upload sales scripts, product documentation, pricing sheets, and FAQs so agents can answer prospect questions accurately.
									</p>
									<div className="p-3 rounded-lg bg-muted/50 border border-border">
										<p className="text-xs text-muted-foreground italic">
											Example: Product feature comparison guides, case studies, ROI calculators
										</p>
									</div>
								</CardContent>
							</Card>
						</MotionDiv>

						<MotionDiv
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.1 }}
							viewport={{ once: true }}
						>
							<Card className="bg-card border-border h-full hover:shadow-xl transition-shadow duration-300">
								<CardHeader>
									<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
										<Sparkles className="h-6 w-6 text-white" />
									</div>
									<CardTitle className="text-xl mb-2">Memory & Learning</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground mb-4 leading-relaxed">
										Agents remember prospect preferences, objections, and interaction history to personalize every touchpoint.
									</p>
									<div className="p-3 rounded-lg bg-muted/50 border border-border">
										<p className="text-xs text-muted-foreground italic">
											Example: "Mentioned budget concerns last month" → adjusted messaging
										</p>
									</div>
								</CardContent>
							</Card>
						</MotionDiv>

						<MotionDiv
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.2 }}
							viewport={{ once: true }}
						>
							<Card className="bg-card border-border h-full hover:shadow-xl transition-shadow duration-300">
								<CardHeader>
									<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4">
										<Zap className="h-6 w-6 text-white" />
									</div>
									<CardTitle className="text-xl mb-2">Integrations</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground mb-4 leading-relaxed">
										Connect to HubSpot, Gmail, Google Calendar, and more via secure OAuth authentication.
									</p>
									{/* Integration icons display */}
									<div className="grid grid-cols-4 gap-3">
										{integrations.map((integration, index) => (
											<MotionDiv
												key={index}
												initial={{ opacity: 0, scale: 0.8 }}
												whileInView={{ opacity: 1, scale: 1 }}
												transition={{ duration: 0.3, delay: index * 0.05 }}
												viewport={{ once: true }}
												whileHover={{ scale: 1.1 }}
												className="aspect-square p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:shadow-md transition-all duration-300"
											>
												{integration.icon ? (
													<Image
														src={integration.icon}
														alt={integration.name}
														width={32}
														height={32}
														className="object-contain"
													/>
												) : null}
											</MotionDiv>
										))}
									</div>
								</CardContent>
							</Card>
						</MotionDiv>
					</div>
				</div>
			</section>

			{/* Results - Completely Redesigned */}
			<section className="py-20 px-4 relative overflow-hidden">
				{/* Background gradient */}
				<div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent" />
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />

				<div className="container mx-auto max-w-6xl relative z-10">
					<MotionDiv
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						viewport={{ once: true }}
						className="text-center mb-16"
					>
						<h2 className="text-4xl md:text-5xl font-bold mb-4">Results You Can Expect</h2>
						<p className="text-lg text-muted-foreground">
							Real impact on your sales metrics
						</p>
					</MotionDiv>

					<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
						{metrics.map((metric, index) => (
							<MotionDiv
								key={index}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: index * 0.1 }}
								viewport={{ once: true }}
							>
								<div className="group relative h-full">
									{/* Gradient border effect */}
									<div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />

									<Card className="relative h-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-800 group-hover:border-transparent group-hover:shadow-2xl transition-all duration-500">
										<CardContent className="p-6 flex flex-col items-center text-center h-full">
											{/* Icon */}
											<MotionDiv
												initial={{ scale: 0 }}
												whileInView={{ scale: 1 }}
												transition={{ duration: 0.5, delay: index * 0.1 + 0.2, type: "spring", stiffness: 200 }}
												viewport={{ once: true }}
												className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${metric.gradient} flex items-center justify-center mb-4 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
											>
												{metric.icon}
											</MotionDiv>

											{/* Value */}
											<div className={`text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-br ${metric.gradient} bg-clip-text text-transparent`}>
												{metric.value}
											</div>

											{/* Label */}
											<h3 className="text-base md:text-lg font-semibold text-foreground mb-2 leading-tight">
												{metric.label}
											</h3>

											{/* Description */}
											<p className="text-sm text-muted-foreground leading-relaxed">
												{metric.description}
											</p>

											{/* Decorative element */}
											<div className={`mt-4 h-1 w-12 rounded-full bg-gradient-to-r ${metric.gradient} opacity-50 group-hover:w-full group-hover:opacity-100 transition-all duration-500`} />
										</CardContent>
									</Card>
								</div>
							</MotionDiv>
						))}
					</div>

					{/* Additional context */}
					<MotionDiv
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.4 }}
						viewport={{ once: true }}
						className="mt-12 text-center"
					>
						<p className="text-sm text-muted-foreground max-w-3xl mx-auto">
							Based on average results from sales teams using AffinityBots across various industries. Individual results may vary.
						</p>
					</MotionDiv>
				</div>
			</section>

			{/* CTA */}
			<section className="py-20 px-4 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10">
				<div className="container mx-auto text-center max-w-3xl">
					<MotionDiv
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						viewport={{ once: true }}
					>
						<h2 className="text-4xl md:text-5xl font-bold mb-4">
							Start Automating Sales Today
						</h2>
						<p className="text-xl text-muted-foreground mb-8">
							Join sales teams already using AffinityBots to close more deals with less effort
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link href="/pricing">
								<Button
									size="sm"
									className="h-10 px-5 rounded-full text-sm tracking-wide bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm shadow-blue-500/30"
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
					</MotionDiv>
				</div>
			</section>

			<Footer />
		</div>
	)
}
