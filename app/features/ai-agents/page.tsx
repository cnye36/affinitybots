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
	Bot,
	Sparkles,
	ArrowRight,
	CheckCircle,
	Zap,
	Brain,
	Settings,
	MessageSquare,
	Users,
	Workflow,
	Code,
	Database,
	Book,
	Target,
	Gauge,
	Shield,
	Palette,
	LayoutGrid,
} from "lucide-react"

export default function AIAgentsPage() {
	const customizationOptions = [
		{
			icon: <Brain className="h-6 w-6" />,
			title: "AI Model Selection",
			description: "Choose from GPT-4/5, Claude Opus/Sonnet, Gemini, and more. Each agent can use a different model based on its role.",
			color: "blue",
		},
		{
			icon: <Code className="h-6 w-6" />,
			title: "Custom System Prompts",
			description: "Define exactly how your agent thinks, responds, and behaves with detailed system instructions.",
			color: "purple",
		},
		{
			icon: <Zap className="h-6 w-6" />,
			title: "Tool Integration",
			description: "Connect 50+ MCP tools - from Gmail to GitHub. Each agent can have its own unique set of capabilities.",
			color: "orange",
		},
		{
			icon: <Book className="h-6 w-6" />,
			title: "Knowledge Base",
			description: "Upload company documents, FAQs, and product info. Agents use RAG to provide accurate, context-aware responses.",
			color: "green",
		},
		{
			icon: <Database className="h-6 w-6" />,
			title: "Memory System",
			description: "Agents remember past conversations and learn from every interaction to provide personalized experiences.",
			color: "cyan",
		},
		{
			icon: <Palette className="h-6 w-6" />,
			title: "Personality & Tone",
			description: "Set temperature, reasoning effort, and response style to match your brand voice perfectly.",
			color: "pink",
		},
	]

	const useCases = [
		{
			mode: "Solo Mode",
			icon: <MessageSquare className="h-8 w-8" />,
			description: "Run agents individually in a chat interface for direct interaction",
			examples: [
				"Customer support chatbot on your website",
				"Internal knowledge assistant for your team",
				"Personal productivity assistant",
				"Research and analysis tool",
			],
			color: "blue",
			gradient: "from-blue-500 to-cyan-500",
		},
		{
			mode: "Team Mode",
			icon: <Users className="h-8 w-8" />,
			description: "Orchestrate multiple agents working together in coordinated workflows",
			examples: [
				"Sales agent + Research agent + Email agent",
				"Content writer + Editor + Publisher",
				"Lead qualifier + CRM updater + Scheduler",
				"Data collector + Analyzer + Reporter",
			],
			color: "purple",
			gradient: "from-purple-500 to-pink-500",
		},
	]

	const features = [
		{
			icon: <Gauge className="h-6 w-6" />,
			title: "Optimized Performance",
			description: "Built on LangGraph with streaming responses, efficient token usage, and sub-second response times",
		},
		{
			icon: <Shield className="h-6 w-6" />,
			title: "Enterprise Security",
			description: "OAuth-based authentication, encrypted data storage, and SOC 2 compliant infrastructure",
		},
		{
			icon: <Target className="h-6 w-6" />,
			title: "Precise Control",
			description: "Fine-tune every aspect - from token limits to response format, tool approval to memory retention",
		},
		{
			icon: <LayoutGrid className="h-6 w-6" />,
			title: "Multimodal Support",
			description: "Handle text, images, documents, and more. Agents can analyze, create, and manipulate any content type",
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
			orange: {
				bg: "from-orange-500/10 to-orange-600/5",
				border: "border-orange-500/20 hover:border-orange-500/40",
				text: "text-orange-500",
				glow: "hover:shadow-orange-500/20",
			},
			cyan: {
				bg: "from-cyan-500/10 to-cyan-600/5",
				border: "border-cyan-500/20 hover:border-cyan-500/40",
				text: "text-cyan-500",
				glow: "hover:shadow-cyan-500/20",
			},
			pink: {
				bg: "from-pink-500/10 to-pink-600/5",
				border: "border-pink-500/20 hover:border-pink-500/40",
				text: "text-pink-500",
				glow: "hover:shadow-pink-500/20",
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
							<Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
								<Sparkles className="h-4 w-4 mr-2" />
								Fully Customizable AI Agents
							</Badge>
							<h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
								Build Your Perfect AI Team
							</h1>
							<p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
								Create highly specialized AI agents optimized for any task. Run them solo or orchestrate
								agent teams that work together seamlessly. Complete control, infinite possibilities.
							</p>
							<div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
								<Link href="/pricing">
									<Button
										size="sm"
										className="h-10 px-5 rounded-full text-sm tracking-wide bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-sm shadow-blue-500/30"
									>
										Start Building Agents
										<ArrowRight className="ml-2 h-4 w-4" />
									</Button>
								</Link>
								<Link href="/use-cases">
									<Button
										size="sm"
										variant="outline"
										className="h-10 px-5 rounded-full text-sm tracking-wide border border-slate-300/70 dark:border-slate-700/70 hover:border-slate-400 dark:hover:border-slate-600"
									>
										View Use Cases
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
									alt="AI Agents working together"
									fill
									className="object-contain"
									priority
								/>
							</div>
						</MotionDiv>
					</div>
				</div>
			</section>

			{/* Customization Options */}
			<section className="py-16 px-4 bg-muted/30">
				<div className="container mx-auto">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
							Completely Customizable
						</h2>
						<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
							Every aspect of your AI agents is under your control. Build agents that perfectly match your
							needs.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
						{customizationOptions.map((option, index) => {
							const colors = getColorClasses(option.color)
							return (
								<MotionDiv
									key={index}
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.5, delay: index * 0.1 }}
									viewport={{ once: true }}
								>
									<Card className={`bg-gradient-to-br ${colors.bg} backdrop-blur-sm border-2 ${colors.border} transition-all duration-300 hover:shadow-lg ${colors.glow} h-full`}>
										<CardHeader>
											<div className={`${colors.text} mb-2`}>{option.icon}</div>
											<CardTitle className="text-lg">{option.title}</CardTitle>
										</CardHeader>
										<CardContent>
											<p className="text-sm text-muted-foreground">{option.description}</p>
										</CardContent>
									</Card>
								</MotionDiv>
							)
						})}
					</div>
				</div>
			</section>

			{/* Solo vs Team Mode */}
			<section className="py-16 px-4">
				<div className="container mx-auto">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
							Solo or Team - You Decide
						</h2>
						<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
							Run agents individually in a chat interface, or orchestrate teams that collaborate to solve
							complex problems
						</p>
					</div>

					<div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
						{useCases.map((useCase, index) => (
							<MotionDiv
								key={index}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: index * 0.2 }}
								viewport={{ once: true }}
							>
								<Card className="bg-card border-border hover:border-primary/20 transition-all duration-300 hover:shadow-xl h-full">
									<CardHeader>
										<div className={`flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${useCase.gradient} mb-4`}>
											<div className="text-white">{useCase.icon}</div>
										</div>
										<CardTitle className="text-2xl mb-2">{useCase.mode}</CardTitle>
										<CardDescription className="text-base">{useCase.description}</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											<p className="text-sm font-medium text-foreground">Perfect for:</p>
											<ul className="space-y-2">
												{useCase.examples.map((example, i) => (
													<li key={i} className="flex items-start text-sm text-muted-foreground">
														<CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
														{example}
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

			{/* Optimization Features */}
			<section className="py-16 px-4 bg-muted/30">
				<div className="container mx-auto">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
							Built for Performance
						</h2>
						<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
							Optimized architecture ensures your agents are fast, reliable, and scalable
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
						{features.map((feature, index) => (
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
				</div>
			</section>

			{/* How It Works */}
			<section className="py-16 px-4">
				<div className="container mx-auto">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
							Get Started in Minutes
						</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							Creating powerful AI agents is simple with our intuitive interface
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
										<Settings className="h-6 w-6" />
									</div>
									<div className="text-center">
										<Badge className="mb-2 bg-blue-500/10 text-blue-500 border-blue-500/20">Step 1</Badge>
										<CardTitle className="text-xl">Configure Your Agent</CardTitle>
									</div>
								</CardHeader>
								<CardContent>
									<p className="text-center text-muted-foreground">
										Select AI model, write system prompt, choose tools, and upload knowledge documents
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
										<MessageSquare className="h-6 w-6" />
									</div>
									<div className="text-center">
										<Badge className="mb-2 bg-purple-500/10 text-purple-500 border-purple-500/20">
											Step 2
										</Badge>
										<CardTitle className="text-xl">Test & Refine</CardTitle>
									</div>
								</CardHeader>
								<CardContent>
									<p className="text-center text-muted-foreground">
										Chat with your agent, test different scenarios, and fine-tune behavior
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
									</div>
									<div className="text-center">
										<Badge className="mb-2 bg-green-500/10 text-green-500 border-green-500/20">Step 3</Badge>
										<CardTitle className="text-xl">Deploy & Scale</CardTitle>
									</div>
								</CardHeader>
								<CardContent>
									<p className="text-center text-muted-foreground">
										Use solo in chat or add to workflows. Scale to handle thousands of conversations
									</p>
								</CardContent>
							</Card>
						</MotionDiv>
					</div>
				</div>
			</section>

			{/* Agent Team Example */}
			<section className="py-16 px-4 bg-muted/30">
				<div className="container mx-auto">
					<div className="max-w-5xl mx-auto">
						<div className="text-center mb-12">
							<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
								Example: Sales Agent Team
							</h2>
							<p className="text-xl text-muted-foreground">
								See how multiple specialized agents collaborate in a real workflow
							</p>
						</div>

						<Card className="bg-card border-border">
							<CardContent className="pt-6">
								<div className="space-y-6">
									<div className="flex items-start gap-4">
										<div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex-shrink-0">
											<Bot className="h-5 w-5" />
										</div>
										<div className="flex-1">
											<h3 className="font-semibold mb-1">Lead Qualifier Agent</h3>
											<p className="text-sm text-muted-foreground mb-2">
												Model: GPT-4 | Tools: Email, HubSpot
											</p>
											<p className="text-sm text-muted-foreground">
												Analyzes incoming leads, scores them based on criteria, and qualifies for next steps
											</p>
										</div>
									</div>

									<div className="flex items-center justify-center">
										<ArrowRight className="h-5 w-5 text-muted-foreground" />
									</div>

									<div className="flex items-start gap-4">
										<div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500/10 text-purple-500 flex-shrink-0">
											<Bot className="h-5 w-5" />
										</div>
										<div className="flex-1">
											<h3 className="font-semibold mb-1">Research Agent</h3>
											<p className="text-sm text-muted-foreground mb-2">
												Model: Claude Sonnet | Tools: Web Search, LinkedIn
											</p>
											<p className="text-sm text-muted-foreground">
												Researches qualified leads, gathers company info, finds decision makers
											</p>
										</div>
									</div>

									<div className="flex items-center justify-center">
										<ArrowRight className="h-5 w-5 text-muted-foreground" />
									</div>

									<div className="flex items-start gap-4">
										<div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex-shrink-0">
											<Bot className="h-5 w-5" />
										</div>
										<div className="flex-1">
											<h3 className="font-semibold mb-1">Outreach Agent</h3>
											<p className="text-sm text-muted-foreground mb-2">
												Model: GPT-4 | Tools: Gmail, Calendar
											</p>
											<p className="text-sm text-muted-foreground">
												Crafts personalized emails, schedules follow-ups, books meetings automatically
											</p>
										</div>
									</div>
								</div>

								<div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
									<p className="text-sm text-foreground text-center">
										<Sparkles className="inline h-4 w-4 mr-2 text-blue-500" />
										This entire workflow runs 24/7 with zero human intervention
									</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			<FeatureCTA
				title="Ready to Build Your AI Team?"
				description="Create specialized agents in minutes. No coding required."
			/>

			<Footer />
		</div>
	)
}
