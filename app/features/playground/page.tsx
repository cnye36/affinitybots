"use client"

import React from "react"
import Link from "next/link"
import { Header } from "@/components/home/Header"
import { Footer } from "@/components/home/Footer"
import { FeatureCTA } from "@/components/home/FeatureCTA"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
	PlayCircle,
	Settings,
	Zap,
	GitBranch,
	Users,
	ArrowRightLeft,
	Eye,
	Download,
	Workflow,
	Play,
	Pause,
	CheckCircle2,
	MessageSquare,
	UserCog,
	Network,
	Layers,
	RefreshCw,
	FileJson,
	TestTube2,
	Sparkles,
} from "lucide-react"
import { MotionDiv } from "@/components/motion/MotionDiv"

export default function PlaygroundPage() {
	const keyFeatures = [
		{
			icon: <Settings className="h-6 w-6" />,
			title: "Complete Configuration Control",
			description: "Configure literally everything about your agents. Models, prompts, tools, memory, knowledge - all customizable in real-time.",
			gradient: "from-blue-500 to-cyan-500",
		},
		{
			icon: <ArrowRightLeft className="h-6 w-6" />,
			title: "Switch Agents Mid-Conversation",
			description: "Test different agents in the same conversation. See how each agent handles the same context with different configurations.",
			gradient: "from-purple-500 to-pink-500",
		},
		{
			icon: <GitBranch className="h-6 w-6" />,
			title: "Context Handoffs",
			description: "Pass context from one agent to the next to simulate workflow behavior. Perfect for testing sequential agent chains.",
			gradient: "from-orange-500 to-red-500",
		},
		{
			icon: <Network className="h-6 w-6" />,
			title: "Orchestrator Mode",
			description: "Configure a manager agent that delegates to worker agents. Test complex orchestration patterns before deployment.",
			gradient: "from-green-500 to-emerald-500",
		},
	]

	const playgroundModes = [
		{
			mode: "Agent Testing Mode",
			description: "Test individual agents or switch between multiple agents in the same conversation",
			features: [
				"Configure and test unlimited agents",
				"Switch agents mid-conversation instantly",
				"Hand off context between agents",
				"See how different agents handle same input",
			],
			icon: <UserCog className="h-8 w-8" />,
			gradient: "from-blue-500 to-purple-500",
		},
		{
			mode: "Orchestrator Mode",
			description: "Build and test manager-worker agent orchestration patterns",
			features: [
				"Configure manager agent with delegation logic",
				"Add and configure multiple worker agents",
				"Test step-by-step or full run execution",
				"See manager decision-making in real-time",
			],
			icon: <Network className="h-8 w-8" />,
			gradient: "from-green-500 to-cyan-500",
		},
	]

	const configOptions = [
		{ icon: <Settings />, title: "AI Model Selection", description: "GPT-4/5, Claude, Gemini, and more" },
		{ icon: <MessageSquare />, title: "System Prompts", description: "Custom instructions and behavior" },
		{ icon: <Zap />, title: "Tool Integration", description: "Enable/disable MCP servers" },
		{ icon: <Layers />, title: "Knowledge Bases", description: "Attach documents and websites" },
		{ icon: <RefreshCw />, title: "Memory Settings", description: "Configure long-term memory" },
		{ icon: <Sparkles />, title: "Temperature & Tone", description: "Fine-tune response style" },
	]

	const executionModes = [
		{
			title: "Run Mode",
			description: "Execute the entire orchestration from start to finish and see the final result",
			icon: <Play className="h-5 w-5" />,
			color: "green",
		},
		{
			title: "Step-by-Step Mode",
			description: "Watch each agent execute one at a time. See manager decisions and worker outputs individually",
			icon: <Pause className="h-5 w-5" />,
			color: "blue",
		},
	]

	const exportFeatures = [
		{
			icon: <Workflow className="h-6 w-6" />,
			title: "Create Workflow Directly",
			description: "Satisfied with your agent configuration? Create a production workflow with one click from the playground.",
		},
		{
			icon: <FileJson className="h-6 w-6" />,
			title: "Export Sessions",
			description: "Save your playground sessions including all agent configurations, conversations, and context handoffs.",
		},
		{
			icon: <Download className="h-6 w-6" />,
			title: "Import & Resume",
			description: "Import previously exported sessions to continue testing or share configurations with your team.",
		},
	]

	const useCases = [
		{
			title: "Test Agent Configurations",
			description: "Try different models, prompts, and tools to find the perfect configuration",
			icon: <TestTube2 className="h-5 w-5" />,
		},
		{
			title: "Validate Workflow Logic",
			description: "Simulate entire workflows with context handoffs before building them",
			icon: <GitBranch className="h-5 w-5" />,
		},
		{
			title: "Compare Agent Responses",
			description: "Switch between agents mid-conversation to see which performs best",
			icon: <ArrowRightLeft className="h-5 w-5" />,
		},
		{
			title: "Debug Orchestration",
			description: "Test manager-worker patterns step-by-step to identify issues",
			icon: <Network className="h-5 w-5" />,
		},
	]

	return (
		<div className="min-h-screen bg-background">
			<Header />

			{/* Hero Section */}
			<section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-background py-20 md:py-32">
				<div className="absolute inset-0 bg-grid-pattern opacity-5" />
				<div className="container mx-auto px-4 relative z-10">
					<MotionDiv
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						className="text-center max-w-4xl mx-auto"
					>
						<Badge className="mb-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">
							Playground
						</Badge>
						<h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
							Test, Refine, Deploy
						</h1>
						<p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
							Build agent teams, test orchestration patterns, and perfect your configurations before deploying to production workflows. The playground is your sandbox for experimentation.
						</p>
						<div className="flex flex-wrap gap-4 justify-center">
							<Link href="/pricing">
								<Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
									Start Testing
								</Button>
							</Link>
							<Link href="/docs">
								<Button size="lg" variant="outline">
									View Documentation
								</Button>
							</Link>
						</div>
					</MotionDiv>
				</div>
			</section>

			{/* Key Features */}
			<section className="py-20 border-b border-border">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-0">
							Core Features
						</Badge>
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							Everything You Need to Perfect Your Agents
						</h2>
						<p className="text-muted-foreground max-w-2xl mx-auto">
							Test configurations, simulate workflows, and validate orchestration patterns in a risk-free environment
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						{keyFeatures.map((feature, index) => (
							<MotionDiv
								key={index}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
							>
								<Card className="p-6 h-full border-2 hover:border-primary/50 transition-all hover:shadow-lg">
									<div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-4`}>
										{feature.icon}
									</div>
									<h3 className="font-semibold mb-2">{feature.title}</h3>
									<p className="text-sm text-muted-foreground">{feature.description}</p>
								</Card>
							</MotionDiv>
						))}
					</div>
				</div>
			</section>

			{/* Playground Modes */}
			<section className="py-20 bg-muted/30 border-b border-border">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-0">
							Testing Modes
						</Badge>
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							Two Powerful Testing Modes
						</h2>
						<p className="text-muted-foreground max-w-2xl mx-auto">
							Test individual agents or complex orchestration patterns - all in one place
						</p>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
						{playgroundModes.map((mode, index) => (
							<MotionDiv
								key={index}
								initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
								whileInView={{ opacity: 1, x: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.5 }}
							>
								<Card className="p-8 border-2 h-full hover:border-primary/50 transition-all hover:shadow-lg">
									<div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${mode.gradient} flex items-center justify-center text-white mb-4`}>
										{mode.icon}
									</div>
									<h3 className="text-2xl font-bold mb-2">{mode.mode}</h3>
									<p className="text-muted-foreground mb-6">{mode.description}</p>
									<ul className="space-y-3">
										{mode.features.map((feature, i) => (
											<li key={i} className="flex items-start gap-2">
												<CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
												<span className="text-sm">{feature}</span>
											</li>
										))}
									</ul>
								</Card>
							</MotionDiv>
						))}
					</div>
				</div>
			</section>

			{/* Configuration Options */}
			<section className="py-20 border-b border-border">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-0">
							Configuration
						</Badge>
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							Configure Literally Everything
						</h2>
						<p className="text-muted-foreground max-w-2xl mx-auto">
							Every aspect of your agents is customizable in real-time
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{configOptions.map((option, index) => (
							<MotionDiv
								key={index}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
							>
								<Card className="p-6 border-2 hover:border-primary/50 transition-all hover:shadow-lg">
									<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white mb-3">
										{option.icon}
									</div>
									<h3 className="font-semibold mb-1">{option.title}</h3>
									<p className="text-sm text-muted-foreground">{option.description}</p>
								</Card>
							</MotionDiv>
						))}
					</div>
				</div>
			</section>

			{/* Execution Modes */}
			<section className="py-20 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-background border-b border-border">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<Badge className="mb-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0">
							Execution Modes
						</Badge>
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							Run or Step Through Orchestrations
						</h2>
						<p className="text-muted-foreground max-w-2xl mx-auto">
							In Orchestrator Mode, choose how you want to observe agent execution
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
						{executionModes.map((mode, index) => (
							<MotionDiv
								key={index}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
							>
								<Card className="p-8 border-2 h-full">
									<div className={`w-12 h-12 rounded-full bg-${mode.color}-100 dark:bg-${mode.color}-900/30 flex items-center justify-center text-${mode.color}-600 dark:text-${mode.color}-400 mb-4`}>
										{mode.icon}
									</div>
									<h3 className="text-xl font-bold mb-2">{mode.title}</h3>
									<p className="text-muted-foreground">{mode.description}</p>
								</Card>
							</MotionDiv>
						))}
					</div>
				</div>
			</section>

			{/* Context Handoff Example */}
			<section className="py-20 border-b border-border">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<Badge className="mb-4 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 border-0">
							How It Works
						</Badge>
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							Test Workflow Behavior Before Building
						</h2>
						<p className="text-muted-foreground max-w-2xl mx-auto">
							Simulate complete workflows with context handoffs between agents
						</p>
					</div>

					<Card className="p-8 max-w-4xl mx-auto border-2">
						<div className="space-y-6">
							<div className="flex items-start gap-4">
								<div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold flex-shrink-0">
									1
								</div>
								<div>
									<h3 className="font-semibold mb-1">Start with Agent A</h3>
									<p className="text-sm text-muted-foreground">
										Configure and test your first agent. See how it responds to inputs.
									</p>
								</div>
							</div>

							<div className="flex items-start gap-4">
								<div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">
									2
								</div>
								<div>
									<h3 className="font-semibold mb-1">Hand Off to Agent B</h3>
									<p className="text-sm text-muted-foreground">
										Pass the conversation context to a different agent mid-conversation. Watch how Agent B continues from where Agent A left off.
									</p>
								</div>
							</div>

							<div className="flex items-start gap-4">
								<div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 font-bold flex-shrink-0">
									3
								</div>
								<div>
									<h3 className="font-semibold mb-1">Continue the Chain</h3>
									<p className="text-sm text-muted-foreground">
										Keep switching agents or continue with Agent B. Perfect your agent team before deploying.
									</p>
								</div>
							</div>

							<div className="flex items-start gap-4">
								<div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400 font-bold flex-shrink-0">
									4
								</div>
								<div>
									<h3 className="font-semibold mb-1">Export to Workflow</h3>
									<p className="text-sm text-muted-foreground">
										When satisfied, create a production workflow with all your agent configurations in one click.
									</p>
								</div>
							</div>
						</div>
					</Card>
				</div>
			</section>

			{/* Export Features */}
			<section className="py-20 bg-muted/30 border-b border-border">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<Badge className="mb-4 bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300 border-0">
							Export & Deploy
						</Badge>
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							From Playground to Production
						</h2>
						<p className="text-muted-foreground max-w-2xl mx-auto">
							Export sessions and create workflows directly when you're satisfied with your configuration
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{exportFeatures.map((feature, index) => (
							<MotionDiv
								key={index}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
							>
								<Card className="p-6 text-center border-2 hover:border-primary/50 transition-all hover:shadow-lg h-full">
									<div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white mx-auto mb-4">
										{feature.icon}
									</div>
									<h3 className="font-semibold mb-2">{feature.title}</h3>
									<p className="text-sm text-muted-foreground">{feature.description}</p>
								</Card>
							</MotionDiv>
						))}
					</div>
				</div>
			</section>

			{/* Use Cases */}
			<section className="py-20 border-b border-border">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<Badge className="mb-4 bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300 border-0">
							Use Cases
						</Badge>
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							What You Can Do in the Playground
						</h2>
						<p className="text-muted-foreground max-w-2xl mx-auto">
							Perfect configurations, validate logic, and debug complex patterns
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						{useCases.map((useCase, index) => (
							<MotionDiv
								key={index}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
							>
								<Card className="p-6 text-center border-2 hover:border-primary/50 transition-all hover:shadow-lg">
									<div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white mx-auto mb-3">
										{useCase.icon}
									</div>
									<h3 className="font-semibold mb-2">{useCase.title}</h3>
									<p className="text-sm text-muted-foreground">{useCase.description}</p>
								</Card>
							</MotionDiv>
						))}
					</div>
				</div>
			</section>

			<FeatureCTA
				title="Ready to Start Experimenting?"
				description="Test your agent configurations risk-free and deploy with confidence"
			/>

			<Footer />
		</div>
	)
}
