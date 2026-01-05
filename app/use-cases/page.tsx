"use client"

import { Header } from "@/components/home/Header"
import { CTA } from "@/components/home/CTA"
import { Footer } from "@/components/home/Footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MotionDiv } from "@/components/motion/MotionDiv"
import { MetricCounter } from "@/components/use-cases/MetricCounter"
import Image from "next/image"
import Link from "next/link"
import {
	Bot,
	Zap,
	Brain,
	Workflow,
	ArrowRight,
	CheckCircle,
	Shield,
	Upload,
	Network,
	Users,
	Headphones,
	FileText,
	UserPlus,
	MousePointerClick,
	BarChart3,
	ShoppingCart,
	Lock,
	GitBranch,
} from "lucide-react"

export default function UseCasesPage() {
	const scrollToUseCases = () => {
		const element = document.getElementById("use-cases-grid")
		if (element) {
			element.scrollIntoView({ behavior: "smooth", block: "start" })
		}
	}

	const features = [
		{
			icon: <Bot className="h-6 w-6 text-blue-500" />,
			title: "AI Agents",
			description: "Deploy specialized agents with different expertise and AI models",
			gradient: "from-blue-500/20 to-blue-600/20",
			borderColor: "border-blue-500/30",
		},
		{
			icon: <Workflow className="h-6 w-6 text-purple-500" />,
			title: "Workflows",
			description: "Orchestrate multi-agent teams with sequential or manager-worker patterns",
			gradient: "from-purple-500/20 to-purple-600/20",
			borderColor: "border-purple-500/30",
		},
		{
			icon: <Zap className="h-6 w-6 text-orange-500" />,
			title: "Integrations",
			description: "Connect to 70+ tools via secure OAuth and API integrations",
			gradient: "from-orange-500/20 to-orange-600/20",
			borderColor: "border-orange-500/30",
		},
		{
			icon: <Brain className="h-6 w-6 text-green-500" />,
			title: "Knowledge & Memory",
			description: "Give agents company knowledge and let them learn from every interaction",
			gradient: "from-green-500/20 to-green-600/20",
			borderColor: "border-green-500/30",
		},
	]

	const useCases = [
		{
			title: "Sales Automation",
			description: "Automate lead qualification, follow-ups, and deal management with AI-powered sales agents that work 24/7.",
			link: "/use-cases/sales-automation",
			icon: <ShoppingCart className="h-12 w-12 text-blue-500" />,
			gradient: "from-blue-500 to-blue-600",
			bgGradient: "from-blue-500/10 to-blue-600/5",
			borderColor: "border-blue-500/20 hover:border-blue-500/50",
			glowColor: "hover:shadow-blue-500/20",
			metric: { value: 3, suffix: "x", label: "Faster Lead Qualification" },
		},
		{
			title: "Customer Support",
			description: "Deliver instant, accurate support 24/7 with intelligent agents that handle complex queries and escalate when needed.",
			link: "/use-cases/customer-support",
			icon: <Headphones className="h-12 w-12 text-cyan-500" />,
			gradient: "from-cyan-500 to-cyan-600",
			bgGradient: "from-cyan-500/10 to-cyan-600/5",
			borderColor: "border-cyan-500/20 hover:border-cyan-500/50",
			glowColor: "hover:shadow-cyan-500/20",
			metric: { value: 90, suffix: "%", label: "Query Resolution Rate" },
		},
		{
			title: "Content Creation",
			description: "Generate marketing copy, documentation, and social media content with AI writers that match your brand voice.",
			link: "/use-cases/content-creation",
			icon: <FileText className="h-12 w-12 text-purple-500" />,
			gradient: "from-purple-500 to-purple-600",
			bgGradient: "from-purple-500/10 to-purple-600/5",
			borderColor: "border-purple-500/20 hover:border-purple-500/50",
			glowColor: "hover:shadow-purple-500/20",
			metric: { value: 10, suffix: "x", label: "Faster Content Production" },
		},
		{
			title: "HR & Recruitment",
			description: "Streamline candidate screening, interview scheduling, and onboarding with automated HR workflows.",
			link: "/use-cases/hr-recruitment",
			icon: <UserPlus className="h-12 w-12 text-green-500" />,
			gradient: "from-green-500 to-green-600",
			bgGradient: "from-green-500/10 to-green-600/5",
			borderColor: "border-green-500/20 hover:border-green-500/50",
			glowColor: "hover:shadow-green-500/20",
			metric: { value: 75, suffix: "%", label: "Less Screening Time" },
		},
		{
			title: "Lead Collection",
			description: "Capture, score, and enrich leads from multiple sources with automated lead collection agents.",
			link: "/use-cases/lead-collection",
			icon: <MousePointerClick className="h-12 w-12 text-orange-500" />,
			gradient: "from-orange-500 to-orange-600",
			bgGradient: "from-orange-500/10 to-orange-600/5",
			borderColor: "border-orange-500/20 hover:border-orange-500/50",
			glowColor: "hover:shadow-orange-500/20",
			metric: { value: 5, suffix: "x", label: "More Qualified Leads" },
		},
		{
			title: "Data Analysis",
			description: "Automate data collection, analysis, and reporting with intelligent agents that turn data into insights.",
			link: "/use-cases/data-analysis",
			icon: <BarChart3 className="h-12 w-12 text-indigo-500" />,
			gradient: "from-indigo-500 to-indigo-600",
			bgGradient: "from-indigo-500/10 to-indigo-600/5",
			borderColor: "border-indigo-500/20 hover:border-indigo-500/50",
			glowColor: "hover:shadow-indigo-500/20",
			metric: { value: 80, suffix: "%", label: "Time Saved on Reporting" },
		},
	]

	const howItWorksSteps = [
		{
			step: 1,
			title: "Create Specialized Agents",
			description: "Choose AI models, configure skills, and define agent roles tailored to your specific needs",
			icon: <Bot className="h-8 w-8 text-blue-500" />,
			gradient: "from-blue-500/20 to-blue-600/20",
		},
		{
			step: 2,
			title: "Give Them Knowledge",
			description: "Upload company documents, FAQs, product info for context-aware responses",
			icon: <Upload className="h-8 w-8 text-purple-500" />,
			gradient: "from-purple-500/20 to-purple-600/20",
		},
		{
			step: 3,
			title: "Connect & Automate",
			description: "Link agents to your tools, build workflows, and let automation run 24/7",
			icon: <Network className="h-8 w-8 text-green-500" />,
			gradient: "from-green-500/20 to-green-600/20",
		},
	]

	const officialIntegrations = [
		"GitHub", "Google Suite", "HubSpot", "Notion", "Slack", "Linear",
		"Gmail", "Google Drive", "Google Calendar", "Asana"
	]

	return (
		<div className="min-h-screen bg-background text-foreground">
			<Header />

			{/* Hero Section */}
			<section className="pt-32 pb-16 px-4">
				<div className="container mx-auto">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
						{/* Content */}
						<MotionDiv
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.8 }}
							className="text-center lg:text-left"
						>
							<h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
								<span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
									Built for Every Industry
								</span>
							</h1>
							<p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
								From sales to support, content to data - AffinityBots adapts to any business need
								with AI-powered automation
							</p>
							<div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
								<Button
									size="lg"
									onClick={scrollToUseCases}
									className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
								>
									Explore Use Cases
									<ArrowRight className="ml-2 h-5 w-5" />
								</Button>
								<Link href="/pricing">
									<Button size="lg" variant="outline">
										Get Started
									</Button>
								</Link>
							</div>
						</MotionDiv>

						{/* Visual */}
						<MotionDiv
							initial={{ opacity: 0, x: 50 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.8, delay: 0.3 }}
							className="relative hidden lg:block"
						>
							<div className="relative w-full aspect-square">
								<Image
									src="/images/Four-bots.png"
									alt="AI Agents working together across industries"
									fill
									className="object-contain"
									priority
								/>
							</div>
						</MotionDiv>
					</div>
				</div>
			</section>

			{/* Overview Section - The Perfect Combination */}
			<section className="py-16 px-4 bg-muted/30">
				<div className="container mx-auto">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
							The Perfect Combination
						</h2>
						<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
							AI agents + workflows + integrations + knowledge + memory = powerful automation
						</p>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
						{features.map((feature, index) => (
							<MotionDiv
								key={index}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true, margin: "-100px" }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
							>
								<Card className={`bg-gradient-to-br ${feature.gradient} backdrop-blur-sm border ${feature.borderColor} hover:shadow-lg transition-all duration-300 h-full`}>
									<CardHeader>
										<div className="mb-3">
											{feature.icon}
										</div>
										<CardTitle className="text-lg mb-2">{feature.title}</CardTitle>
										<CardDescription className="text-sm">
											{feature.description}
										</CardDescription>
									</CardHeader>
								</Card>
							</MotionDiv>
						))}
					</div>
				</div>
			</section>

			{/* Use Cases Grid */}
			<section id="use-cases-grid" className="py-16 px-4">
				<div className="container mx-auto">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
							Proven Use Cases
						</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							See how businesses across industries use AffinityBots
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{useCases.map((useCase, index) => (
							<MotionDiv
								key={index}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true, margin: "-100px" }}
								transition={{ duration: 0.6, delay: index * 0.1 }}
							>
								<Link href={useCase.link} className="block h-full">
									<Card
										className={`
											relative overflow-hidden h-full
											bg-gradient-to-br ${useCase.bgGradient} backdrop-blur-sm
											border ${useCase.borderColor}
											hover:shadow-xl ${useCase.glowColor}
											transition-all duration-300
											hover:-translate-y-1
											cursor-pointer
											group
										`}
									>
										{/* Icon */}
										<CardHeader className="pb-4">
											<div className="mb-4 inline-flex p-3 rounded-2xl bg-gradient-to-br ${useCase.gradient} backdrop-blur-sm border border-white/10">
												{useCase.icon}
											</div>
											<CardTitle className="text-2xl mb-3 group-hover:bg-gradient-to-r group-hover:${useCase.gradient} group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
												{useCase.title}
											</CardTitle>
											<CardDescription className="text-base leading-relaxed">
												{useCase.description}
											</CardDescription>
										</CardHeader>

										{/* Metric */}
										<CardContent className="pt-0">
											<div className="pt-4 border-t border-border/50">
												<MetricCounter
													value={useCase.metric.value}
													suffix={useCase.metric.suffix}
													label={useCase.metric.label}
													gradientFrom={`from-${useCase.gradient.split(" ")[0].replace("from-", "")}`}
													gradientTo={`to-${useCase.gradient.split(" ")[1].replace("to-", "")}`}
													className="text-left"
												/>
											</div>

											{/* Arrow indicator */}
											<div className="mt-4 flex items-center text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
												Learn more
												<ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
											</div>
										</CardContent>
									</Card>
								</Link>
							</MotionDiv>
						))}
					</div>
				</div>
			</section>

			{/* Security & Trust Section */}
			<section className="py-16 px-4 bg-muted/30">
				<div className="container mx-auto">
					<div className="text-center mb-12">
						<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
							<Shield className="h-5 w-5 text-green-500" />
							<span className="text-sm font-semibold text-green-700 dark:text-green-400">
								Enterprise-Grade Security
							</span>
						</div>
						<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
							Guaranteed Secure Integrations
						</h2>
					</div>

					<div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
						{/* Official Integrations */}
						<Card className="bg-card border-border hover:border-primary/20 transition-all duration-300">
							<CardHeader>
								<div className="flex items-center justify-between mb-4">
									<CardTitle className="text-2xl">Official Integrations</CardTitle>
									<Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
										40+ Servers
									</Badge>
								</div>
								<CardDescription className="text-base mb-4">
									Built and maintained by original vendors with OAuth-based authentication
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div className="flex flex-wrap gap-2">
										{officialIntegrations.map((integration, index) => (
											<Badge key={index} variant="secondary" className="text-sm">
												{integration}
											</Badge>
										))}
										<Badge variant="secondary" className="text-sm">
											+30 more
										</Badge>
									</div>
									<ul className="space-y-2 mt-4">
										<li className="flex items-start gap-2 text-sm text-muted-foreground">
											<CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
											<span>Built by original vendors</span>
										</li>
										<li className="flex items-start gap-2 text-sm text-muted-foreground">
											<CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
											<span>OAuth-based authentication</span>
										</li>
										<li className="flex items-start gap-2 text-sm text-muted-foreground">
											<CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
											<span>Regularly updated and maintained</span>
										</li>
									</ul>
								</div>
							</CardContent>
						</Card>

						{/* AffinityBots-Built */}
						<Card className="bg-card border-border hover:border-primary/20 transition-all duration-300">
							<CardHeader>
								<div className="flex items-center justify-between mb-4">
									<CardTitle className="text-2xl">AffinityBots-Built</CardTitle>
									<Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
										Verified & Audited
									</Badge>
								</div>
								<CardDescription className="text-base mb-4">
									Custom integrations built by our team with thorough security auditing
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<ul className="space-y-2">
										<li className="flex items-start gap-2 text-sm text-muted-foreground">
											<CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
											<span>Thoroughly security-audited</span>
										</li>
										<li className="flex items-start gap-2 text-sm text-muted-foreground">
											<CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
											<span>Maintained to vendor standards</span>
										</li>
										<li className="flex items-start gap-2 text-sm text-muted-foreground">
											<CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
											<span>Guaranteed compatibility</span>
										</li>
										<li className="flex items-start gap-2 text-sm text-muted-foreground">
											<CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
											<span>Regular security updates</span>
										</li>
									</ul>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Bottom Banner */}
					<div className="max-w-4xl mx-auto">
						<div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-6">
							<div className="flex items-start gap-3">
								<Lock className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
								<div>
									<h3 className="font-semibold text-foreground mb-2">
										We DO NOT include community-built MCP servers without rigorous security vetting
									</h3>
									<p className="text-sm text-muted-foreground">
										Your data and integrations are always secure. Every integration goes through extensive
										security auditing before being made available to our users.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works - 3-Step Process */}
			<section className="py-16 px-4">
				<div className="container mx-auto">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
							How It Works
						</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							Three simple steps to automate your business with AI
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
						{howItWorksSteps.map((step, index) => (
							<MotionDiv
								key={index}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true, margin: "-100px" }}
								transition={{ duration: 0.6, delay: index * 0.2 }}
								className="relative"
							>
								<Card className={`bg-gradient-to-br ${step.gradient} backdrop-blur-sm border-0 hover:shadow-xl transition-all duration-300 h-full`}>
									<CardHeader className="text-center">
										{/* Step Number */}
										<div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 border-2 border-primary/30 mx-auto mb-4">
											<span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
												{step.step}
											</span>
										</div>

										{/* Icon */}
										<div className="mb-4 inline-flex p-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm mx-auto">
											{step.icon}
										</div>

										<CardTitle className="text-xl mb-3">{step.title}</CardTitle>
										<CardDescription className="text-base">
											{step.description}
										</CardDescription>
									</CardHeader>
								</Card>

								{/* Connector Arrow (desktop only) */}
								{index < howItWorksSteps.length - 1 && (
									<div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
										<ArrowRight className="h-8 w-8 text-primary/30" />
									</div>
								)}
							</MotionDiv>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-16 px-4 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10">
				<div className="container mx-auto">
					<div className="text-center max-w-3xl mx-auto">
						<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
							Ready to Automate Your Business?
						</h2>
						<p className="text-xl text-muted-foreground mb-8">
							Join thousands of businesses using AffinityBots to streamline operations and scale faster
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link href="/pricing">
								<Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
									Start Free Trial
									<ArrowRight className="ml-2 h-5 w-5" />
								</Button>
							</Link>
							<Link href="/pricing">
								<Button size="lg" variant="outline">
									View Pricing
								</Button>
							</Link>
							<Link href="/contact">
								<Button size="lg" variant="secondary">
									Schedule Demo
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</section>

			<Footer />
		</div>
	)
}
