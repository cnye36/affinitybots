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
	Workflow,
	Zap,
	Brain,
	Settings,
	Upload,
	Book,
	TrendingUp,
	Users,
	FileText,
	Briefcase,
	Target,
	BarChart3,
	Shield,
	CheckCircle,
	ArrowRight,
	Sparkles,
} from "lucide-react"

export default function UseCasesPage() {
	const useCases = [
		{
			title: "Sales Automation",
			description: "AI sales assistants that qualify leads, schedule meetings, and manage your entire sales pipeline automatically.",
			metrics: { value: 3, suffix: "x", label: "Faster Lead Qualification" },
			icon: <TrendingUp className="h-12 w-12" />,
			color: "blue",
			link: "/use-cases/sales-automation",
		},
		{
			title: "Customer Support",
			description: "24/7 intelligent support agents that handle complex queries, provide instant answers, and escalate when needed.",
			metrics: { value: 90, suffix: "%", label: "Query Resolution Rate" },
			icon: <Users className="h-12 w-12" />,
			color: "cyan",
			link: "/use-cases/customer-support",
		},
		{
			title: "Content Creation",
			description: "AI writers that research, draft, edit, and publish marketing copy, documentation, and social media content.",
			metrics: { value: 10, suffix: "x", label: "Faster Content Production" },
			icon: <FileText className="h-12 w-12" />,
			color: "purple",
			link: "/use-cases/content-creation",
		},
		{
			title: "HR & Recruitment",
			description: "Automated screening, scheduling, and candidate communication that streamlines your entire hiring process.",
			metrics: { value: 75, suffix: "%", label: "Reduction in Screening Time" },
			icon: <Briefcase className="h-12 w-12" />,
			color: "green",
			link: "/use-cases/hr-recruitment",
		},
		{
			title: "Lead Collection",
			description: "Automated lead capture, scoring, enrichment, and CRM sync from multiple sources and channels.",
			metrics: { value: 5, suffix: "x", label: "Increase in Qualified Leads" },
			icon: <Target className="h-12 w-12" />,
			color: "orange",
			link: "/use-cases/lead-collection",
		},
		{
			title: "Data Analysis",
			description: "Automated data collection, analysis, visualization, and reporting for actionable business intelligence.",
			metrics: { value: 80, suffix: "%", label: "Time Saved on Reporting" },
			icon: <BarChart3 className="h-12 w-12" />,
			color: "indigo",
			link: "/use-cases/data-analysis",
		},
	]

	const features = [
		{
			icon: <Bot className="h-8 w-8 text-blue-500" />,
			title: "AI Agents",
			description: "Deploy specialized agents with different expertise and AI models",
			color: "blue",
		},
		{
			icon: <Workflow className="h-8 w-8 text-purple-500" />,
			title: "Workflows",
			description: "Orchestrate multi-agent teams with sequential or manager-worker patterns",
			color: "purple",
		},
		{
			icon: <Zap className="h-8 w-8 text-orange-500" />,
			title: "Integrations",
			description: "Connect to 70+ tools via secure OAuth and API integrations",
			color: "orange",
		},
		{
			icon: <Brain className="h-8 w-8 text-green-500" />,
			title: "Knowledge & Memory",
			description: "Give agents company knowledge and let them learn from every interaction",
			color: "green",
		},
	]

	const getColorClasses = (color: string) => {
		const colors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
			blue: {
				bg: "from-blue-500/10 to-blue-600/5",
				border: "border-blue-500/20 hover:border-blue-500/40",
				text: "text-blue-500",
				glow: "hover:shadow-blue-500/20",
			},
			cyan: {
				bg: "from-cyan-500/10 to-cyan-600/5",
				border: "border-cyan-500/20 hover:border-cyan-500/40",
				text: "text-cyan-500",
				glow: "hover:shadow-cyan-500/20",
			},
			purple: {
				bg: "from-purple-500/10 to-purple-600/5",
				border: "border-purple-500/20 hover:border-purple-500/40",
				text: "text-purple-500",
				glow: "hover:shadow-purple-500/20",
			},
			green: {
				bg: "from-green-500/10 to-green-600/5",
				border: "border-green-500/20 hover:border-green-500/40",
				text: "text-green-500",
				glow: "hover:shadow-green-500/20",
			},
			orange: {
				bg: "from-orange-500/10 to-orange-600/5",
				border: "border-orange-500/20 hover:border-orange-500/40",
				text: "text-orange-500",
				glow: "hover:shadow-orange-500/20",
			},
			indigo: {
				bg: "from-indigo-500/10 to-indigo-600/5",
				border: "border-indigo-500/20 hover:border-indigo-500/40",
				text: "text-indigo-500",
				glow: "hover:shadow-indigo-500/20",
			},
		}
		return colors[color] || colors.blue
	}

	return (
		<div className="min-h-screen bg-background text-foreground">
			<Header />

			{/* Hero Section */}
			<section className="pt-32 pb-16 px-4">
				<div className="container mx-auto">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
						<MotionDiv
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.8 }}
							className="text-center lg:text-left"
						>
							<h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
								Built for Every Industry
							</h1>
							<p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
								From sales to support, content to data - AffinityBots adapts to any business need with
								AI-powered automation that works 24/7.
							</p>
							<div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
								<a href="#use-cases">
									<Button
										size="sm"
										className="h-10 px-5 rounded-full text-sm tracking-wide bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-sm shadow-blue-500/30"
									>
										Explore Use Cases
										<ArrowRight className="ml-2 h-4 w-4" />
									</Button>
								</a>
								<Link href="/pricing">
									<Button
										size="sm"
										variant="outline"
										className="h-10 px-5 rounded-full text-sm tracking-wide border border-slate-300/70 dark:border-slate-700/70 hover:border-slate-400 dark:hover:border-slate-600"
									>
										Get Started
									</Button>
								</Link>
							</div>
						</MotionDiv>

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

			{/* Overview Section */}
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

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						{features.map((feature, index) => (
							<MotionDiv
								key={index}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
								viewport={{ once: true }}
							>
								<Card className="bg-card/50 backdrop-blur-sm border-border hover:border-primary/20 transition-all duration-300 hover:shadow-lg h-full">
									<CardHeader>
										<div className="flex items-center justify-center mb-4">
											{feature.icon}
										</div>
										<CardTitle className="text-center text-lg">{feature.title}</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-center text-sm text-muted-foreground">{feature.description}</p>
									</CardContent>
								</Card>
							</MotionDiv>
						))}
					</div>
				</div>
			</section>

			{/* Use Cases Grid */}
			<section id="use-cases" className="py-16 px-4">
				<div className="container mx-auto">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
							Proven Use Cases
						</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							See how businesses across industries use AffinityBots to transform their operations
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{useCases.map((useCase, index) => {
							const colors = getColorClasses(useCase.color)
							return (
								<MotionDiv
									key={index}
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.5, delay: index * 0.1 }}
									viewport={{ once: true }}
								>
									<Card className={`bg-gradient-to-br ${colors.bg} backdrop-blur-sm border-2 ${colors.border} transition-all duration-300 h-full flex flex-col`}>
										<CardHeader className="flex-1">
											<div className={`${colors.text} mb-4`}>
												{useCase.icon}
											</div>
											<CardTitle className="text-xl mb-2">{useCase.title}</CardTitle>
											<CardDescription className="text-base">
												{useCase.description}
											</CardDescription>
										</CardHeader>
										<CardContent className="pt-0">
											<Link href={useCase.link}>
												<Button variant="ghost" className={`w-auto ml-auto flex ${colors.text} hover:${colors.text}`}>
													Learn More
													<ArrowRight className="ml-2 h-4 w-4" />
												</Button>
											</Link>
										</CardContent>
									</Card>
								</MotionDiv>
							)
						})}
					</div>
				</div>
			</section>

			{/* Security & Trust Section */}
			<section className="py-16 px-4 bg-muted/30">
				<div className="container mx-auto">
					<div className="text-center mb-12">
						<Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
							<Shield className="h-4 w-4 mr-2" />
							Guaranteed Secure
						</Badge>
						<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
							Trusted Integrations Only
						</h2>
						<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
							All MCP servers on AffinityBots are either official vendor integrations or built and audited by our team
						</p>
					</div>

					<div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-8">
						<Card className="bg-card border-border">
							<CardHeader>
								<Badge className="w-fit mb-2 bg-blue-500/10 text-blue-500 border-blue-500/20">
									40+ Official Servers
								</Badge>
								<CardTitle className="text-xl">Official Integrations</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex flex-wrap gap-2">
									{["GitHub", "Google Suite", "HubSpot", "Notion", "Slack", "Linear", "Figma", "Asana"].map((name) => (
										<Badge key={name} variant="outline" className="text-xs">
											{name}
										</Badge>
									))}
								</div>
								<ul className="space-y-2 text-sm text-muted-foreground">
									<li className="flex items-start">
										<CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
										Built and maintained by original vendors
									</li>
									<li className="flex items-start">
										<CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
										OAuth-based authentication
									</li>
									<li className="flex items-start">
										<CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
										Regularly updated and certified
									</li>
								</ul>
							</CardContent>
						</Card>

						<Card className="bg-card border-border">
							<CardHeader>
								<Badge className="w-fit mb-2 bg-purple-500/10 text-purple-500 border-purple-500/20">
									Verified & Audited
								</Badge>
								<CardTitle className="text-xl">AffinityBots-Built</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<p className="text-sm text-muted-foreground">
									Custom integrations built by our team for services without official MCP servers
								</p>
								<ul className="space-y-2 text-sm text-muted-foreground">
									<li className="flex items-start">
										<CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
										Thoroughly security-audited
									</li>
									<li className="flex items-start">
										<CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
										Maintained to vendor standards
									</li>
									<li className="flex items-start">
										<CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
										Guaranteed compatibility
									</li>
								</ul>
							</CardContent>
						</Card>
					</div>

					<div className="max-w-4xl mx-auto">
						<Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-primary/20">
							<CardContent className="pt-6">
								<p className="text-center text-foreground font-medium">
									<Shield className="inline h-5 w-5 mr-2 text-primary" />
									We DO NOT include community-built MCP servers without rigorous security vetting.
									Your data and integrations are always secure.
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* How It Works */}
			<section className="py-16 px-4">
				<div className="container mx-auto">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
							How It Works
						</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							Three simple steps to automate your business processes
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
						<MotionDiv
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.1 }}
							viewport={{ once: true }}
						>
							<Card className="bg-card border-border hover:border-blue-500/20 transition-all duration-300 h-full">
								<CardHeader>
									<div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 mb-4 mx-auto">
										<Bot className="h-6 w-6" />
										<Settings className="h-4 w-4 -ml-2 -mt-2" />
									</div>
									<div className="text-center">
										<Badge className="mb-2 bg-blue-500/10 text-blue-500 border-blue-500/20">
											Step 1
										</Badge>
										<CardTitle className="text-xl">Create Specialized Agents</CardTitle>
									</div>
								</CardHeader>
								<CardContent>
									<p className="text-center text-muted-foreground">
										Choose AI models, configure skills, and define agent roles tailored to your specific business needs
									</p>
								</CardContent>
							</Card>
						</MotionDiv>

						<MotionDiv
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.2 }}
							viewport={{ once: true }}
						>
							<Card className="bg-card border-border hover:border-purple-500/20 transition-all duration-300 h-full">
								<CardHeader>
									<div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/10 text-purple-500 mb-4 mx-auto">
										<Book className="h-6 w-6" />
										<Upload className="h-4 w-4 -ml-2 -mt-2" />
									</div>
									<div className="text-center">
										<Badge className="mb-2 bg-purple-500/10 text-purple-500 border-purple-500/20">
											Step 2
										</Badge>
										<CardTitle className="text-xl">Give Them Knowledge</CardTitle>
									</div>
								</CardHeader>
								<CardContent>
									<p className="text-center text-muted-foreground">
										Upload company documents, FAQs, and product info for context-aware responses and intelligent decision-making
									</p>
								</CardContent>
							</Card>
						</MotionDiv>

						<MotionDiv
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.3 }}
							viewport={{ once: true }}
						>
							<Card className="bg-card border-border hover:border-green-500/20 transition-all duration-300 h-full">
								<CardHeader>
									<div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 text-green-500 mb-4 mx-auto">
										<Workflow className="h-6 w-6" />
										<Sparkles className="h-4 w-4 -ml-2 -mt-2" />
									</div>
									<div className="text-center">
										<Badge className="mb-2 bg-green-500/10 text-green-500 border-green-500/20">
											Step 3
										</Badge>
										<CardTitle className="text-xl">Connect & Automate</CardTitle>
									</div>
								</CardHeader>
								<CardContent>
									<p className="text-center text-muted-foreground">
										Link agents to your tools, build workflows, and let automation run 24/7 without human intervention
									</p>
								</CardContent>
							</Card>
						</MotionDiv>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-16 px-4 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10">
				<div className="container mx-auto text-center">
					<h2 className="text-3xl md:text-4xl font-bold mb-4">
						Ready to Automate Your Business?
					</h2>
					<p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
						Join hundreds of businesses already using AffinityBots to save time and scale operations
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Link href="/pricing">
							<Button
								size="sm"
								className="h-10 px-5 rounded-full text-sm tracking-wide bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-sm shadow-blue-500/30"
							>
								Start Free Trial
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</Link>
						<Link href="/pricing">
							<Button
								size="sm"
								variant="outline"
								className="h-10 px-5 rounded-full text-sm tracking-wide border border-slate-300/70 dark:border-slate-700/70 hover:border-slate-400 dark:hover:border-slate-600"
							>
								View Pricing
							</Button>
						</Link>
						<Link href="/contact">
							<Button
								size="sm"
								variant="ghost"
								className="h-10 px-5 rounded-full text-sm tracking-wide"
							>
								Schedule Demo
							</Button>
						</Link>
					</div>
				</div>
			</section>

			<Footer />
		</div>
	)
}
