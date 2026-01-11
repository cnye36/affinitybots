import { type ReactElement } from "react"
import { Header } from "@/components/home/Header"
import { Footer } from "@/components/home/Footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MotionDiv } from "@/components/motion/MotionDiv"
import { AgentCard } from "@/components/use-cases/AgentCard"
import CustomerSupportHeroGraphic from "@/components/use-cases/CustomerSupportHeroGraphic"
import Link from "next/link"
import { Users, Mail, MessageSquare, Database, CheckCircle, X, ArrowRight, ArrowLeft, Zap, Bot, Target, Clock, Shield, Sparkles } from "lucide-react"
import Image from "next/image"

export default function CustomerSupportPage() {
	const agents = [
		{
			name: "Tier 1 Support Bot",
			role: "Initial Query Handler",
			model: "Claude Haiku",
			tools: ["Knowledge Base", "Gmail"],
			description: "Handles common queries with instant responses from your knowledge base",
			color: "cyan" as const,
		},
		{
			name: "Escalation Manager",
			role: "Priority Routing",
			model: "GPT-4o",
			tools: ["Gmail", "Slack", "Linear"],
			description: "Routes complex issues to human agents with full context and priority classification",
			color: "blue" as const,
		},
		{
			name: "Ticket Categorizer",
			role: "Issue Organization",
			model: "Claude Sonnet 4",
			tools: ["Linear", "Asana"],
			description: "Automatically categorizes and tags tickets for efficient team assignment",
			color: "indigo" as const,
		},
	]

	const integrations = [
		{
			name: "Gmail",
			icon: "/integration-icons/gmail-icon.png",
			capabilities: ["Email ticket management", "Automated responses", "Thread tracking"],
			usedBy: ["Tier 1 Support Bot", "Escalation Manager"],
		},
		{
			name: "Slack",
			icon: "/integration-icons/slack-icon.png",
			capabilities: ["Team notifications", "Internal escalations", "Real-time updates"],
			usedBy: ["Escalation Manager"],
		},
		{
			name: "Linear",
			iconLight: "/integration-icons/linear-symbol-light.png",
			iconDark: "/integration-icons/linear-symbol-dark.png",
			capabilities: ["Issue tracking", "Bug reporting", "Task assignment"],
			usedBy: ["Ticket Categorizer", "Escalation Manager"],
		},
		{
			name: "Google Docs",
			icon: "/integration-icons/google-docs-logo.png",
			capabilities: ["Knowledge base", "FAQ documentation", "Solution articles"],
			usedBy: ["Tier 1 Support Bot"],
		},
	]

	const toolIconMap: Record<string, string | ReactElement> = {
		"Gmail": "/integration-icons/gmail-icon.png",
		"Slack": "/integration-icons/slack-icon.png",
		"Linear": (
			<>
				<img src="/integration-icons/linear-symbol-light.png" alt="Linear" className="w-4 h-4 object-contain dark:hidden" />
				<img src="/integration-icons/linear-symbol-dark.png" alt="Linear" className="w-4 h-4 object-contain hidden dark:block" />
			</>
		),
		"Knowledge Base": "/integration-icons/google-docs-logo.png",
		"Asana": (
			<>
				<img src="/integration-icons/asana-icon-light.png" alt="Asana" className="w-4 h-4 object-contain dark:hidden" />
				<img src="/integration-icons/asana-icon-dark.png" alt="Asana" className="w-4 h-4 object-contain hidden dark:block" />
			</>
		),
		"Email": "/integration-icons/gmail-icon.png",
		"Documents": "/integration-icons/google-docs-logo.png",
	}

	const workflowSteps = [
		{
			number: 1,
			title: "Email Trigger",
			description: "Customer sends support request to support@yourcompany.com",
			icon: <Zap className="h-5 w-5" />,
			color: "from-cyan-500 to-cyan-600",
		},
		{
			number: 2,
			title: "AI Response",
			description: "Tier 1 Support Bot searches knowledge base and provides instant solution",
			icon: <Bot className="h-5 w-5" />,
			color: "from-blue-500 to-blue-600",
		},
		{
			number: 3,
			title: "Categorization",
			description: "Ticket Categorizer tags issue (bug, feature request, billing, etc.)",
			icon: <Target className="h-5 w-5" />,
			color: "from-indigo-500 to-indigo-600",
		},
		{
			number: 4,
			title: "Escalation Check",
			description: "If unresolved, Escalation Manager routes to appropriate human agent with context",
			icon: <Users className="h-5 w-5" />,
			color: "from-purple-500 to-purple-600",
		},
		{
			number: 5,
			title: "Tracking & Logging",
			description: "All interactions logged to Linear with full history and customer context",
			icon: <Database className="h-5 w-5" />,
			color: "from-teal-500 to-teal-600",
		},
	]

	const metrics = [
		{
			value: "90%",
			label: "Query Resolution Rate",
			description: "Most tickets resolved instantly by AI",
			icon: <CheckCircle className="h-8 w-8" />,
			gradient: "from-cyan-500 via-cyan-600 to-blue-500",
		},
		{
			value: "75%",
			label: "Reduction in Response Time",
			description: "Instant replies, not hours of waiting",
			icon: <Clock className="h-8 w-8" />,
			gradient: "from-blue-500 via-blue-600 to-indigo-500",
		},
		{
			value: "60%",
			label: "Decrease in Human Workload",
			description: "Free your team for complex issues",
			icon: <Bot className="h-8 w-8" />,
			gradient: "from-indigo-500 via-indigo-600 to-purple-500",
		},
		{
			value: "24/7",
			label: "Always-On Support",
			description: "Never miss a customer inquiry",
			icon: <Shield className="h-8 w-8" />,
			gradient: "from-teal-500 via-teal-600 to-cyan-500",
		},
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

			{/* Hero Section - Redesigned */}
			<section className="relative pt-8 pb-20 px-4 overflow-hidden">
				{/* Animated gradient background */}
				<div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-transparent" />
				<div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl" />
				<div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-cyan-500/10 to-transparent rounded-full blur-3xl" />

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
									24/7 Intelligent{" "}
									<span className="relative inline-block">
										<span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
											Customer Support
										</span>
									</span>
								</h1>
								<p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
									Deliver instant, accurate support at any hour while your human team focuses on complex issues that need a personal touch
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
										className="h-10 px-5 rounded-full text-sm tracking-wide bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-sm shadow-cyan-500/30"
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
							<CustomerSupportHeroGraphic />
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
							{ label: "Resolution Rate", value: "90%" },
							{ label: "Response Time", value: "<30s" },
							{ label: "Cost Savings", value: "60%" },
							{ label: "Availability", value: "24/7" },
						].map((stat, index) => (
							<div
								key={index}
								className="p-4 rounded-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200 dark:border-gray-800 text-center"
							>
								<div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
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
							Customers expect instant support, but hiring a 24/7 team is <strong className="text-foreground">expensive and inefficient</strong>. AffinityBots solves this by deploying AI agents that handle common queries instantly using your knowledge base, escalate complex issues to humans with full context, and learn from every interaction to improve over time. Your support team becomes more productive, customers get faster answers, and satisfaction scores go up.
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
							Traditional support models cannot keep up with customer expectations
						</p>
					</MotionDiv>
					<div className="grid md:grid-cols-2 gap-6">
						{[
							{
								title: "Slow Response Times",
								description: "Customers wait hours or days for answers to simple questions",
							},
							{
								title: "Repetitive Queries",
								description: "Support agents answer the same questions repeatedly instead of solving hard problems",
							},
							{
								title: "High Staffing Costs",
								description: "Maintaining 24/7 coverage requires large teams and night shifts",
							},
							{
								title: "Inconsistent Quality",
								description: "Response quality varies between agents and shifts",
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

			{/* Your AI Support Team - Merged Solution Section */}
			<section className="py-20 px-4 bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-transparent">
				<div className="container mx-auto max-w-6xl">
					<MotionDiv
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						viewport={{ once: true }}
						className="text-center mb-12"
					>
						<h2 className="text-4xl md:text-5xl font-bold mb-4">Your AI Support Team</h2>
						<p className="text-lg text-muted-foreground max-w-3xl mx-auto">
							AffinityBots uses automated workflows to create a tiered support system where AI handles tier 1 queries and escalates complex issues to humans with complete context. Three specialized agents work together 24/7 to deliver instant, consistent support.
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
							From inquiry to resolution in seconds, not hours
						</p>
					</MotionDiv>

					{/* Desktop: Horizontal Flow */}
					<div className="hidden lg:block">
						<div className="relative">
							{/* Connecting line */}
							<div className="absolute top-[52px] left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-500" />

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
										<div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-gray-800 group-hover:shadow-lg transition-all duration-300 group-hover:bg-white/80 dark:group-hover:bg-gray-900/80">
											<h3 className="text-sm font-bold text-foreground mb-2 text-center">
												{step.title}
											</h3>
											<p className="text-xs text-muted-foreground leading-relaxed text-center">
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
									<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mb-4">
										<Database className="h-6 w-6 text-white" />
									</div>
									<CardTitle className="text-xl mb-2">Knowledge Base</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground mb-4 leading-relaxed">
										Upload FAQs, help articles, product documentation, and troubleshooting guides so agents provide accurate answers instantly.
									</p>
									<div className="p-3 rounded-lg bg-muted/50 border border-border">
										<p className="text-xs text-muted-foreground italic">
											Example: API documentation, setup guides, common error solutions
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
									<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
										<Sparkles className="h-6 w-6 text-white" />
									</div>
									<CardTitle className="text-xl mb-2">Memory & Context</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground mb-4 leading-relaxed">
										Agents remember customer history, previous issues, and preferences to provide personalized support without asking repeat questions.
									</p>
									<div className="p-3 rounded-lg bg-muted/50 border border-border">
										<p className="text-xs text-muted-foreground italic">
											Example: "Last time you had a similar billing question" → proactive solution
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
									<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mb-4">
										<MessageSquare className="h-6 w-6 text-white" />
									</div>
									<CardTitle className="text-xl mb-2">Integrations</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground mb-4 leading-relaxed">
										Connect to Gmail, Slack, Linear, and your existing support stack via secure OAuth.
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
												{integration.iconLight && integration.iconDark ? (
													<>
														<Image
															src={integration.iconLight}
															alt={integration.name}
															width={32}
															height={32}
															className="object-contain dark:hidden"
														/>
														<Image
															src={integration.iconDark}
															alt={integration.name}
															width={32}
															height={32}
															className="object-contain hidden dark:block"
														/>
													</>
												) : integration.icon ? (
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
				<div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-transparent" />
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl" />

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
							Measurable improvements in support metrics
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
							Based on average results from support teams using AffinityBots across various industries. Individual results may vary.
						</p>
					</MotionDiv>
				</div>
			</section>

			{/* CTA */}
			<section className="py-20 px-4 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-cyan-500/10">
				<div className="container mx-auto text-center max-w-3xl">
					<MotionDiv
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						viewport={{ once: true }}
					>
						<h2 className="text-4xl md:text-5xl font-bold mb-4">
							Start Delivering Better Support Today
						</h2>
						<p className="text-xl text-muted-foreground mb-8">
							Join support teams already using AffinityBots to scale without sacrificing quality
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link href="/pricing">
								<Button
									size="sm"
									className="h-10 px-5 rounded-full text-sm tracking-wide bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-sm shadow-cyan-500/30"
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
