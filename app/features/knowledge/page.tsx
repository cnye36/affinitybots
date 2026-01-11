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
	FileText,
	Globe,
	Database,
	Brain,
	CheckCircle2,
	Zap,
	TrendingUp,
	Shield,
	Settings,
	FileSpreadsheet,
	BookOpen,
	Trash2,
	Edit,
	Eye,
	Target,
	Building2,
	Lightbulb,
} from "lucide-react"
import { MotionDiv } from "@/components/motion/MotionDiv"

export default function KnowledgeMemoryPage() {
	const documentTypes = [
		{ icon: <FileText className="h-5 w-5" />, type: "PDF", color: "red" },
		{ icon: <FileText className="h-5 w-5" />, type: "DOCX", color: "blue" },
		{ icon: <FileSpreadsheet className="h-5 w-5" />, type: "XLSX", color: "green" },
		{ icon: <FileText className="h-5 w-5" />, type: "CSV", color: "orange" },
		{ icon: <FileText className="h-5 w-5" />, type: "TXT", color: "gray" },
		{ icon: <FileText className="h-5 w-5" />, type: "JSON", color: "purple" },
	]

	const knowledgeFeatures = [
		{
			icon: <FileText className="h-6 w-6" />,
			title: "Document Upload",
			description: "Upload PDFs, DOCX, XLSX, CSV, and more. Documents are automatically processed and vectorized for semantic search.",
			gradient: "from-blue-500 to-cyan-500",
		},
		{
			icon: <Globe className="h-6 w-6" />,
			title: "Website Indexing",
			description: "Index entire websites or specific pages. Keep your agents up-to-date with your latest content and documentation.",
			gradient: "from-purple-500 to-pink-500",
		},
		{
			icon: <Database className="h-6 w-6" />,
			title: "RAG-Powered Search",
			description: "Retrieval Augmented Generation ensures agents find the most relevant information from your knowledge base every time.",
			gradient: "from-orange-500 to-red-500",
		},
		{
			icon: <Zap className="h-6 w-6" />,
			title: "Per-Agent Knowledge",
			description: "Each agent can have its own knowledge base. Customer support gets docs, data entry gets spreadsheets, sales gets playbooks.",
			gradient: "from-green-500 to-emerald-500",
		},
	]

	const useCaseExamples = [
		{
			agent: "Customer Support Agent",
			knowledge: ["Product documentation (PDFs)", "FAQ knowledge base", "Company policies", "Help center website"],
			icon: <BookOpen className="h-5 w-5" />,
			color: "blue",
		},
		{
			agent: "Data Entry Agent",
			knowledge: ["Excel templates (XLSX)", "CSV data files", "Field mapping guides", "Validation rules"],
			icon: <FileSpreadsheet className="h-5 w-5" />,
			color: "green",
		},
		{
			agent: "Sales Agent",
			knowledge: ["Sales playbooks (DOCX)", "Product specs", "Pricing sheets", "Competitor analysis"],
			icon: <Target className="h-5 w-5" />,
			color: "purple",
		},
	]

	const memoryFeatures = [
		{
			icon: <Brain className="h-6 w-6" />,
			title: "Long-Term Memory",
			description: "Agents remember information across all conversations and threads. Knowledge accumulates over time, not just within a single chat.",
			gradient: "from-violet-500 to-purple-500",
		},
		{
			icon: <TrendingUp className="h-6 w-6" />,
			title: "Continuous Learning",
			description: "Agents get better as they go. They learn user preferences, goals, targets, and company information automatically.",
			gradient: "from-cyan-500 to-blue-500",
		},
		{
			icon: <Settings className="h-6 w-6" />,
			title: "Memory Management Center",
			description: "Full control over what agents remember. View, edit, and remove memories from a comprehensive management dashboard.",
			gradient: "from-pink-500 to-rose-500",
		},
		{
			icon: <Shield className="h-6 w-6" />,
			title: "Optional & Secure",
			description: "Memory is opt-in, not standard. You decide which agents use memory and what they remember. Full privacy control.",
			gradient: "from-amber-500 to-orange-500",
		},
	]

	const memoryCapabilities = [
		{ icon: <Target />, text: "User goals and objectives" },
		{ icon: <Building2 />, text: "Company information and policies" },
		{ icon: <Lightbulb />, text: "Preferences and custom instructions" },
		{ icon: <TrendingUp />, text: "Performance metrics and targets" },
	]

	const managementFeatures = [
		{ icon: <Eye />, title: "View All Memories", description: "Browse complete memory history" },
		{ icon: <Edit />, title: "Edit Memories", description: "Update or correct stored information" },
		{ icon: <Trash2 />, title: "Delete Memories", description: "Remove outdated or incorrect data" },
		{ icon: <Database />, title: "Search & Filter", description: "Find specific memories quickly" },
	]

	return (
		<div className="min-h-screen bg-background">
			<Header />
			{/* Hero Section */}
			<section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-background pt-32 pb-20 md:pb-32">
				<div className="absolute inset-0 bg-grid-pattern opacity-5" />
				<div className="container mx-auto px-4 relative z-10">
					<MotionDiv
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						className="text-center max-w-4xl mx-auto"
					>
						<Badge className="mb-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
							Knowledge & Memory
						</Badge>
						<h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
							Give Your Agents Perfect Memory
						</h1>
						<p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
							Every agent has RAG capabilities to access custom knowledge bases. Add long-term memory so agents learn, improve, and remember what matters most.
						</p>
						<div className="flex flex-wrap gap-4 justify-center">
							<Link href="/pricing">
								<Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
									Get Started
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

			{/* Knowledge Base Section */}
			<section className="py-20 border-b border-border">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-0">
							Knowledge Base
						</Badge>
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							RAG-Powered Knowledge for Every Agent
						</h2>
						<p className="text-muted-foreground max-w-2xl mx-auto">
							Upload documents and index websites to give each agent specialized knowledge. Different agents, different knowledge bases, unlimited use cases.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
						{knowledgeFeatures.map((feature, index) => (
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

					{/* Supported Document Types */}
					<Card className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border-2">
						<div className="text-center mb-8">
							<h3 className="text-2xl font-bold mb-2">Supported Document Formats</h3>
							<p className="text-muted-foreground">
								Wide range of formats including PDFs, spreadsheets, documents, and more
							</p>
						</div>
						<div className="flex flex-wrap justify-center gap-4 mb-8">
							{documentTypes.map((doc, index) => (
								<div
									key={index}
									className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border-2 border-border"
								>
									<div className={`text-${doc.color}-500`}>{doc.icon}</div>
									<span className="font-medium">{doc.type}</span>
								</div>
							))}
							<div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-border">
								<span className="text-muted-foreground">And more...</span>
							</div>
						</div>
					</Card>
				</div>
			</section>

			{/* Plan Comparison */}
			<section className="py-20 bg-muted/30 border-b border-border">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-0">
							Plans & Limits
						</Badge>
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							Knowledge Base Limits by Plan
						</h2>
						<p className="text-muted-foreground max-w-2xl mx-auto">
							Choose the plan that fits your knowledge needs
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
						{/* Start Plan */}
						<MotionDiv
							initial={{ opacity: 0, x: -20 }}
							whileInView={{ opacity: 1, x: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.5 }}
						>
							<Card className="p-8 border-2 h-full">
								<div className="text-center mb-6">
									<h3 className="text-2xl font-bold mb-2">Start Plan</h3>
									<p className="text-muted-foreground">Perfect for getting started</p>
								</div>
								<div className="space-y-4">
									<div className="flex items-center gap-3">
										<CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
										<span><strong>50 documents</strong> per agent</span>
									</div>
									<div className="flex items-center gap-3">
										<CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
										<span><strong>10 websites</strong> indexed</span>
									</div>
									<div className="flex items-center gap-3">
										<CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
										<span>All document formats supported</span>
									</div>
									<div className="flex items-center gap-3">
										<CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
										<span>RAG-powered semantic search</span>
									</div>
								</div>
							</Card>
						</MotionDiv>

						{/* Pro Plan */}
						<MotionDiv
							initial={{ opacity: 0, x: 20 }}
							whileInView={{ opacity: 1, x: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.5 }}
						>
							<Card className="p-8 border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 h-full relative overflow-hidden">
								<Badge className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0">
									Popular
								</Badge>
								<div className="text-center mb-6">
									<h3 className="text-2xl font-bold mb-2">Pro Plan</h3>
									<p className="text-muted-foreground">5x the knowledge capacity</p>
								</div>
								<div className="space-y-4">
									<div className="flex items-center gap-3">
										<CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
										<span><strong className="text-lg text-purple-600 dark:text-purple-400">250 documents</strong> per agent</span>
									</div>
									<div className="flex items-center gap-3">
										<CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
										<span><strong className="text-lg text-purple-600 dark:text-purple-400">50 websites</strong> indexed</span>
									</div>
									<div className="flex items-center gap-3">
										<CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
										<span>All document formats supported</span>
									</div>
									<div className="flex items-center gap-3">
										<CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
										<span>RAG-powered semantic search</span>
									</div>
									<div className="flex items-center gap-3">
										<CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
										<span>Priority processing</span>
									</div>
								</div>
							</Card>
						</MotionDiv>
					</div>
				</div>
			</section>

			{/* Use Case Examples */}
			<section className="py-20 border-b border-border">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-0">
							Use Cases
						</Badge>
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							Different Agents, Different Knowledge
						</h2>
						<p className="text-muted-foreground max-w-2xl mx-auto">
							Each agent can have its own specialized knowledge base tailored to its specific role
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{useCaseExamples.map((example, index) => (
							<MotionDiv
								key={index}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
							>
								<Card className="p-6 border-2 hover:border-primary/50 transition-all hover:shadow-lg h-full">
									<div className={`w-12 h-12 rounded-lg bg-${example.color}-100 dark:bg-${example.color}-900/30 flex items-center justify-center text-${example.color}-600 dark:text-${example.color}-400 mb-4`}>
										{example.icon}
									</div>
									<h3 className="font-semibold mb-3">{example.agent}</h3>
									<ul className="space-y-2">
										{example.knowledge.map((item, i) => (
											<li key={i} className="flex items-start gap-2 text-sm">
												<CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
												<span className="text-muted-foreground">{item}</span>
											</li>
										))}
									</ul>
								</Card>
							</MotionDiv>
						))}
					</div>
				</div>
			</section>

			{/* Memory System Section */}
			<section className="py-20 bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-background border-b border-border">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<Badge className="mb-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">
							Memory System
						</Badge>
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							Long-Term Memory Across All Conversations
						</h2>
						<p className="text-muted-foreground max-w-2xl mx-auto">
							Optional memory system that allows agents to learn, improve, and remember context across all threads and conversations
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
						{memoryFeatures.map((feature, index) => (
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

					{/* What Agents Remember */}
					<Card className="p-8 bg-white dark:bg-gray-800 border-2">
						<div className="text-center mb-8">
							<h3 className="text-2xl font-bold mb-2">What Agents Can Remember</h3>
							<p className="text-muted-foreground">
								Agents automatically learn and store important information across all interactions
							</p>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
							{memoryCapabilities.map((capability, index) => (
								<div
									key={index}
									className="flex flex-col items-center text-center gap-3 p-4 rounded-lg bg-muted/50"
								>
									<div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white">
										{capability.icon}
									</div>
									<span className="text-sm font-medium">{capability.text}</span>
								</div>
							))}
						</div>
					</Card>
				</div>
			</section>

			{/* Memory Management Center */}
			<section className="py-20 border-b border-border">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<Badge className="mb-4 bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300 border-0">
							Memory Management
						</Badge>
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							Comprehensive Memory Management Center
						</h2>
						<p className="text-muted-foreground max-w-2xl mx-auto">
							Full control over what your agents remember. View, edit, and remove memories from an intuitive management dashboard.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
						{managementFeatures.map((feature, index) => (
							<MotionDiv
								key={index}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
							>
								<Card className="p-6 text-center border-2 hover:border-primary/50 transition-all hover:shadow-lg">
									<div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white mx-auto mb-4">
										{feature.icon}
									</div>
									<h3 className="font-semibold mb-2">{feature.title}</h3>
									<p className="text-sm text-muted-foreground">{feature.description}</p>
								</Card>
							</MotionDiv>
						))}
					</div>

					<Card className="p-8 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border-2">
						<div className="flex items-start gap-4">
							<div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
								<Shield className="h-6 w-6" />
							</div>
							<div>
								<h3 className="text-xl font-bold mb-2">Memory is Optional, Not Standard</h3>
								<p className="text-muted-foreground mb-4">
									You have complete control over which agents use memory and what they remember. Memory is opt-in per agent, giving you full privacy and control over your data.
								</p>
								<ul className="space-y-2">
									<li className="flex items-start gap-2">
										<CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
										<span className="text-sm">Enable memory only for agents that benefit from long-term context</span>
									</li>
									<li className="flex items-start gap-2">
										<CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
										<span className="text-sm">All memory data is encrypted and stored securely</span>
									</li>
									<li className="flex items-start gap-2">
										<CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
										<span className="text-sm">Delete all memories at any time with one click</span>
									</li>
								</ul>
							</div>
						</div>
					</Card>
				</div>
			</section>

			<FeatureCTA
				title="Ready to Build Smarter Agents?"
				description="Give your agents the knowledge and memory they need to deliver exceptional results"
			/>
			<Footer />
		</div>
	)
}
