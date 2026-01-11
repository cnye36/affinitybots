import { Header } from "@/components/home/Header"
import { Footer } from "@/components/home/Footer"
import { FeatureCTA } from "@/components/home/FeatureCTA"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MotionDiv } from "@/components/motion/MotionDiv"
import Image from "next/image"
import Link from "next/link"
import {
	Workflow,
	Sparkles,
	ArrowRight,
	CheckCircle,
	Zap,
	Bot,
	Settings,
	GitBranch,
	Users,
	Play,
	BarChart3,
	Clock,
	Target,
	Activity,
	Eye,
	Shield,
	Gauge,
	Code,
	ListTree,
	Network,
	X,
} from "lucide-react"

export default function WorkflowsPage() {
	const workflowTypes = [
		{
			title: "Sequential Workflows",
			icon: <GitBranch className="h-8 w-8" />,
			description: "Linear chains of AI agents that execute tasks one after another",
			features: [
				"Perfect for straightforward, step-by-step processes",
				"Each agent receives output from the previous agent",
				"Simple to build and understand",
				"Ideal for automation pipelines",
			],
			useCases: [
				"Lead qualification → Research → Outreach",
				"Content creation → Editing → Publishing",
				"Data collection → Analysis → Reporting",
			],
			color: "blue",
			gradient: "from-blue-500 to-cyan-500",
		},
		{
			title: "Orchestrator Mode",
			icon: <Network className="h-8 w-8" />,
			description: "Manager agent intelligently delegates tasks to specialized worker agents",
			features: [
				"Manager decides which agent to call and when",
				"Dynamic task routing based on context",
				"Agents work in parallel or sequence as needed",
				"Handles complex, multi-step decision making",
			],
			useCases: [
				"Customer inquiry → Route to sales/support/technical",
				"Project management → Assign tasks dynamically",
				"Complex research → Coordinate multiple specialists",
			],
			color: "purple",
			gradient: "from-purple-500 to-pink-500",
		},
	]

	const traditionalVsAI = [
		{
			traditional: "10+ nodes for simple workflows",
			ai: "1 intelligent agent node",
			description: "No need for parsers, splitters, or formatters",
		},
		{
			traditional: "Separate node for each API action",
			ai: "Agent uses all tools simultaneously",
			description: "One agent can call multiple integrations",
		},
		{
			traditional: "Manual error handling at each step",
			ai: "Agents adapt and recover automatically",
			description: "Built-in intelligence handles edge cases",
		},
		{
			traditional: "Static, rigid execution paths",
			ai: "Dynamic, context-aware decisions",
			description: "Workflows adapt to different scenarios",
		},
	]

	const executionFeatures = [
		{
			icon: <Activity className="h-6 w-6" />,
			title: "Real-Time Execution Tracking",
			description: "Watch your workflows execute in real-time with live status updates for every agent and task",
		},
		{
			icon: <BarChart3 className="h-6 w-6" />,
			title: "Detailed Run Analytics",
			description: "Analyze execution duration, token usage, success rates, and performance metrics for every run",
		},
		{
			icon: <Eye className="h-6 w-6" />,
			title: "Complete Execution History",
			description: "Review every workflow run with full input/output logs, agent conversations, and tool calls",
		},
		{
			icon: <Clock className="h-6 w-6" />,
			title: "Performance Insights",
			description: "Identify bottlenecks, optimize agent performance, and improve workflow efficiency over time",
		},
	]

	const triggers = [
		{
			icon: <Zap className="h-6 w-6" />,
			title: "Manual Triggers",
			description: "Start workflows on-demand from the dashboard",
		},
		{
			icon: <Code className="h-6 w-6" />,
			title: "Webhook Triggers",
			description: "Execute workflows via secure authenticated webhooks",
		},
		{
			icon: <Clock className="h-6 w-6" />,
			title: "Scheduled Triggers",
			description: "Run workflows on a schedule with cron expressions",
		},
		{
			icon: <ListTree className="h-6 w-6" />,
			title: "Form Triggers",
			description: "Trigger workflows from custom web forms",
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
		}
		return colors[color] || colors.blue
	}

	return (
		<div className="min-h-screen bg-background text-foreground">
			<Header />

			{/* Hero Section */}
			<section className="pt-32 pb-16 px-4">
				<div className="container mx-auto">
					<div className="max-w-4xl mx-auto text-center">
						<MotionDiv
							initial={{ opacity: 0, y: -20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8 }}
						>
							<Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
								<Sparkles className="h-4 w-4 mr-2" />
								AI-First Workflow Automation
							</Badge>
							<h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
								Build Workflows in Minutes, Not Hours
							</h1>
							<p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
								Create intelligent workflows with AI agents that replace dozens of traditional nodes. One
								agent can do what takes 10+ nodes in tools like n8n, Make, or Zapier.
							</p>
							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<Link href="/pricing">
									<Button
										size="sm"
										className="h-10 px-5 rounded-full text-sm tracking-wide bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-sm shadow-blue-500/30"
									>
										Start Building Workflows
										<ArrowRight className="ml-2 h-4 w-4" />
									</Button>
								</Link>
								<Link href="/use-cases">
									<Button
										size="sm"
										variant="outline"
										className="h-10 px-5 rounded-full text-sm tracking-wide border border-slate-300/70 dark:border-slate-700/70 hover:border-slate-400 dark:hover:border-slate-600"
									>
										View Examples
									</Button>
								</Link>
							</div>
						</MotionDiv>
					</div>
				</div>
			</section>

			{/* Traditional vs AI-First */}
			<section className="py-16 px-4 bg-muted/30">
				<div className="container mx-auto">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
							Why AI-First Workflows Win
						</h2>
						<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
							Traditional workflow tools require dozens of nodes for simple tasks. AffinityBots uses
							intelligent agents that do it all.
						</p>
					</div>

					<div className="max-w-5xl mx-auto space-y-6">
						{traditionalVsAI.map((comparison, index) => (
							<MotionDiv
								key={index}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
								viewport={{ once: true }}
							>
								<Card className="bg-card border-border hover:border-primary/20 transition-all duration-300">
									<CardContent className="pt-6">
										<div className="grid md:grid-cols-3 gap-6 items-center">
											<div className="text-center md:text-left">
												<div className="flex items-center justify-center md:justify-start gap-2 mb-2">
													<X className="h-5 w-5 text-red-500" />
													<span className="text-sm font-semibold text-muted-foreground">
														Traditional Tools
													</span>
												</div>
												<p className="text-base font-medium text-foreground">{comparison.traditional}</p>
											</div>

											<div className="flex items-center justify-center">
												<ArrowRight className="h-6 w-6 text-primary hidden md:block" />
												<div className="h-px w-full bg-border md:hidden" />
											</div>

											<div className="text-center md:text-right">
												<div className="flex items-center justify-center md:justify-end gap-2 mb-2">
													<CheckCircle className="h-5 w-5 text-green-500" />
													<span className="text-sm font-semibold text-primary">AffinityBots</span>
												</div>
												<p className="text-base font-medium text-foreground">{comparison.ai}</p>
											</div>
										</div>
										<p className="text-sm text-muted-foreground text-center mt-4">{comparison.description}</p>
									</CardContent>
								</Card>
							</MotionDiv>
						))}
					</div>

					<div className="mt-12 max-w-4xl mx-auto">
						<Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-primary/20">
							<CardContent className="pt-6">
								<p className="text-center text-foreground font-medium text-lg">
									<Sparkles className="inline h-5 w-5 mr-2 text-primary" />
									One intelligent agent replaces parsers, formatters, splitters, routers, and integration
									nodes
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Workflow Types */}
			<section className="py-16 px-4">
				<div className="container mx-auto">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
							Choose Your Workflow Type
						</h2>
						<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
							Build simple sequential chains or complex orchestrated workflows with intelligent routing
						</p>
					</div>

					<div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
						{workflowTypes.map((type, index) => (
							<MotionDiv
								key={index}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: index * 0.2 }}
								viewport={{ once: true }}
							>
								<Card className="bg-card border-border hover:border-primary/20 transition-all duration-300 hover:shadow-xl h-full">
									<CardHeader>
										<div
											className={`flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${type.gradient} mb-4`}
										>
											<div className="text-white">{type.icon}</div>
										</div>
										<CardTitle className="text-2xl mb-2">{type.title}</CardTitle>
										<CardDescription className="text-base">{type.description}</CardDescription>
									</CardHeader>
									<CardContent className="space-y-6">
										<div>
											<p className="text-sm font-medium text-foreground mb-3">Key Features:</p>
											<ul className="space-y-2">
												{type.features.map((feature, i) => (
													<li key={i} className="flex items-start text-sm text-muted-foreground">
														<CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
														{feature}
													</li>
												))}
											</ul>
										</div>

										<div>
											<p className="text-sm font-medium text-foreground mb-3">Perfect For:</p>
											<ul className="space-y-2">
												{type.useCases.map((useCase, i) => (
													<li key={i} className="text-sm text-muted-foreground pl-4 border-l-2 border-primary/30">
														{useCase}
													</li>
												))}
											</ul>
										</div>
									</CardContent>
								</Card>
							</MotionDiv>
						))}
					</div>
				</div>
			</section>

			{/* Orchestrator Example */}
			<section className="py-16 px-4 bg-muted/30">
				<div className="container mx-auto">
					<div className="max-w-5xl mx-auto">
						<div className="text-center mb-12">
							<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
								How Orchestrator Mode Works
							</h2>
							<p className="text-xl text-muted-foreground">
								The Manager agent intelligently delegates tasks to specialized worker agents
							</p>
						</div>

						<Card className="bg-card border-border">
							<CardContent className="pt-6">
								<div className="space-y-6">
									{/* Manager Node */}
									<div className="flex items-start gap-4 p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-2 border-emerald-500/20 rounded-lg">
										<div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex-shrink-0">
											<Users className="h-6 w-6" />
										</div>
										<div className="flex-1">
											<h3 className="font-semibold mb-1 text-emerald-600 dark:text-emerald-400">
												Manager Agent
											</h3>
											<p className="text-sm text-muted-foreground mb-2">
												The orchestrator that analyzes the task and decides which agents to use
											</p>
											<p className="text-sm text-foreground">
												Evaluates the user's goal, breaks it into subtasks, and intelligently routes work to
												the most appropriate specialist agents
											</p>
										</div>
									</div>

									<div className="flex items-center justify-center">
										<div className="text-muted-foreground text-sm">Delegates to →</div>
									</div>

									{/* Worker Agents */}
									<div className="grid md:grid-cols-3 gap-4">
										<div className="flex flex-col items-start gap-2 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
											<div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10 text-blue-500">
												<Bot className="h-5 w-5" />
											</div>
											<h4 className="font-semibold text-sm">Sales Agent</h4>
											<p className="text-xs text-muted-foreground">Handles lead qualification and outreach</p>
										</div>

										<div className="flex flex-col items-start gap-2 p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg">
											<div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500/10 text-purple-500">
												<Bot className="h-5 w-5" />
											</div>
											<h4 className="font-semibold text-sm">Research Agent</h4>
											<p className="text-xs text-muted-foreground">Gathers company and contact information</p>
										</div>

										<div className="flex flex-col items-start gap-2 p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg">
											<div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-500/10 text-orange-500">
												<Bot className="h-5 w-5" />
											</div>
											<h4 className="font-semibold text-sm">Email Agent</h4>
											<p className="text-xs text-muted-foreground">Crafts and sends personalized emails</p>
										</div>
									</div>
								</div>

								<div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
									<p className="text-sm text-foreground text-center">
										<Sparkles className="inline h-4 w-4 mr-2 text-primary" />
										Manager decides which agent to call, in what order, and when to stop - all dynamically
										based on the task
									</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Execution Monitoring */}
			<section className="py-16 px-4">
				<div className="container mx-auto">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
							Complete Execution Visibility
						</h2>
						<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
							Monitor every aspect of your workflow runs with detailed execution analytics and real-time
							tracking
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
						{executionFeatures.map((feature, index) => (
							<MotionDiv
								key={index}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
								viewport={{ once: true }}
							>
								<Card className="bg-card/50 backdrop-blur-sm border-border hover:border-primary/20 transition-all duration-300 hover:shadow-lg h-full text-center">
									<CardHeader>
										<div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 mb-4 mx-auto">
											{feature.icon}
										</div>
										<CardTitle className="text-base">{feature.title}</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-muted-foreground">{feature.description}</p>
									</CardContent>
								</Card>
							</MotionDiv>
						))}
					</div>

					<div className="max-w-5xl mx-auto">
						<Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-primary/20">
							<CardHeader>
								<CardTitle className="text-xl">Execution Dashboard Includes:</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid md:grid-cols-2 gap-4">
									<ul className="space-y-2">
										<li className="flex items-start text-sm">
											<CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
											<span className="text-muted-foreground">Full conversation logs for every agent</span>
										</li>
										<li className="flex items-start text-sm">
											<CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
											<span className="text-muted-foreground">Complete input/output data at each step</span>
										</li>
										<li className="flex items-start text-sm">
											<CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
											<span className="text-muted-foreground">Tool calls and API requests made by agents</span>
										</li>
										<li className="flex items-start text-sm">
											<CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
											<span className="text-muted-foreground">Token usage and cost tracking per run</span>
										</li>
									</ul>
									<ul className="space-y-2">
										<li className="flex items-start text-sm">
											<CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
											<span className="text-muted-foreground">Execution duration and performance metrics</span>
										</li>
										<li className="flex items-start text-sm">
											<CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
											<span className="text-muted-foreground">Error messages and debugging information</span>
										</li>
										<li className="flex items-start text-sm">
											<CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
											<span className="text-muted-foreground">Success/failure status for each task</span>
										</li>
										<li className="flex items-start text-sm">
											<CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
											<span className="text-muted-foreground">Historical run comparison and trends</span>
										</li>
									</ul>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Triggers */}
			<section className="py-16 px-4 bg-muted/30">
				<div className="container mx-auto">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
							Multiple Trigger Options
						</h2>
						<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
							Start your workflows manually, on a schedule, via webhooks, or from custom forms
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
						{triggers.map((trigger, index) => (
							<MotionDiv
								key={index}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
								viewport={{ once: true }}
							>
								<Card className="bg-card border-border hover:border-primary/20 transition-all duration-300 hover:shadow-lg h-full text-center">
									<CardHeader>
										<div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 mb-4 mx-auto">
											{trigger.icon}
										</div>
										<CardTitle className="text-base">{trigger.title}</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-muted-foreground">{trigger.description}</p>
									</CardContent>
								</Card>
							</MotionDiv>
						))}
					</div>
				</div>
			</section>

			{/* Features */}
			<section className="py-16 px-4">
				<div className="container mx-auto">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
							Enterprise-Grade Workflow Engine
						</h2>
						<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
							Built for reliability, scalability, and security
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
						<MotionDiv
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.1 }}
							viewport={{ once: true }}
						>
							<Card className="bg-card border-border hover:border-blue-500/20 transition-all duration-300 h-full text-center">
								<CardHeader>
									<div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 mb-4 mx-auto">
										<Gauge className="h-6 w-6" />
									</div>
									<CardTitle className="text-lg">High Performance</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground">
										Built on LangGraph with optimized execution, parallel processing, and intelligent caching
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
							<Card className="bg-card border-border hover:border-purple-500/20 transition-all duration-300 h-full text-center">
								<CardHeader>
									<div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/10 text-purple-500 mb-4 mx-auto">
										<Shield className="h-6 w-6" />
									</div>
									<CardTitle className="text-lg">Secure by Default</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground">
										Authenticated webhooks, encrypted data, role-based access control, and audit logging
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
							<Card className="bg-card border-border hover:border-green-500/20 transition-all duration-300 h-full text-center">
								<CardHeader>
									<div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 text-green-500 mb-4 mx-auto">
										<Target className="h-6 w-6" />
									</div>
									<CardTitle className="text-lg">Visual Builder</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground">
										Drag-and-drop interface with real-time validation, auto-layout, and instant testing
									</p>
								</CardContent>
							</Card>
						</MotionDiv>
					</div>
				</div>
			</section>

			<FeatureCTA
				title="Ready to Automate with AI?"
				description="Build intelligent workflows that adapt, learn, and optimize themselves"
			/>

			<Footer />
		</div>
	)
}
