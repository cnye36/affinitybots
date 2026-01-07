"use client"

/**
 * Use Case Components Demo
 *
 * Comprehensive example showcasing all 5 use-case components.
 * This file demonstrates proper usage patterns and can be used as a reference.
 */

import React from "react"
import {
	WorkflowVisualizer,
	AgentCard,
	IntegrationShowcase,
	MetricCounterGrid,
	StepByStepFlow,
} from "./index"
import { Database, Cpu, CheckCircle, FileText } from "lucide-react"

export function UseCaseComponentsDemo() {
	return (
		<div className="container mx-auto px-4 py-12 space-y-24">
			{/* Header */}
			<section className="text-center">
				<h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
					Use Case Components Demo
				</h1>
				<p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
					Interactive components for building engaging use case pages
				</p>
			</section>

			{/* 1. WorkflowVisualizer Demo */}
			<section>
				<div className="text-center mb-8">
					<h2 className="text-3xl font-bold mb-2">1. Workflow Visualizer</h2>
					<p className="text-gray-600 dark:text-gray-400">
						Visual representation of workflow steps with animated data flow
					</p>
				</div>
				<WorkflowVisualizer
					steps={[
						{
							type: "trigger",
							label: "Form Submitted",
							description: "User fills contact form on website",
						},
						{
							type: "agent",
							label: "Data Processor",
							description: "Extracts and validates customer information",
						},
						{
							type: "agent",
							label: "Lead Scorer",
							description: "Assigns lead score based on criteria",
						},
						{
							type: "output",
							label: "CRM Updated",
							description: "Contact automatically added to HubSpot",
						},
					]}
				/>
			</section>

			{/* 2. AgentCard Demo */}
			<section>
				<div className="text-center mb-8">
					<h2 className="text-3xl font-bold mb-2">2. Agent Cards</h2>
					<p className="text-gray-600 dark:text-gray-400">
						Interactive 3D flip cards - hover to reveal details
					</p>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					<AgentCard
						agent={{
							name: "Sales Assistant",
							role: "Lead Qualification Specialist",
							model: "GPT-4 Turbo",
							tools: [
								{
									name: "HubSpot",
									icon: "/integration-icons/hubspot-icon.png",
								},
								{
									name: "Gmail",
									icon: "/integration-icons/gmail-icon.png",
								},
								{
									name: "Google Sheets",
									icon: "/integration-icons/google-sheets.png",
								},
							],
							description:
								"Automatically qualifies leads, updates CRM records, and sends personalized follow-up emails based on lead behavior and profile data.",
							color: "purple",
						}}
					/>

					<AgentCard
						agent={{
							name: "Data Analyst",
							role: "Business Intelligence Agent",
							model: "Claude Opus 4",
							tools: [
								{
									name: "Google BigQuery",
									icon: "/integration-icons/google-big-query-icon.png",
								},
								{
									name: "Google Sheets",
									icon: "/integration-icons/google-sheets.png",
								},
								{
									name: "Snowflake",
									icon: "/integration-icons/Snowflake-icon.png",
								},
							],
							description:
								"Analyzes business data, generates reports, and provides actionable insights. Connects to multiple data sources and automates reporting workflows.",
							color: "blue",
						}}
					/>

					<AgentCard
						agent={{
							name: "Content Manager",
							role: "Content Creation Specialist",
							model: "GPT-4o",
							tools: [
								{
									name: "Google Docs",
									icon: "/integration-icons/google-docs-logo.png",
								},
								{
									name: "Google Drive",
									icon: "/integration-icons/google-drive-icon.png",
								},
								{
									name: "Asana",
									icon: "/integration-icons/asana-icon-light.png",
								},
							],
							description:
								"Creates, edits, and manages content across multiple platforms. Drafts blog posts, social media content, and marketing materials with brand consistency.",
							color: "green",
						}}
					/>
				</div>
			</section>

			{/* 3. MetricCounter Demo */}
			<section>
				<div className="text-center mb-8">
					<h2 className="text-3xl font-bold mb-2">3. Metric Counters</h2>
					<p className="text-gray-600 dark:text-gray-400">
						Animated counters that trigger on scroll
					</p>
				</div>
				<MetricCounterGrid
					metrics={[
						{
							value: 95,
							suffix: "%",
							label: "Task Accuracy",
							description: "AI decision accuracy across all agents",
							gradientFrom: "from-blue-600",
							gradientTo: "to-purple-600",
						},
						{
							value: 5,
							suffix: "x",
							label: "Faster Processing",
							description: "Compared to manual workflows",
							gradientFrom: "from-purple-600",
							gradientTo: "to-pink-600",
						},
						{
							value: 10000,
							suffix: "+",
							label: "Tasks Automated",
							description: "Total tasks completed this month",
							gradientFrom: "from-green-600",
							gradientTo: "to-teal-600",
						},
					]}
					columns={3}
				/>
			</section>

			{/* 4. IntegrationShowcase Demo */}
			<section>
				<div className="text-center mb-8">
					<h2 className="text-3xl font-bold mb-2">4. Integration Showcase</h2>
					<p className="text-gray-600 dark:text-gray-400">
						Hover for details, click to highlight usage
					</p>
				</div>
				<IntegrationShowcase
					integrations={[
						{
							name: "Google Drive",
							iconPath: "/integration-icons/google-drive-icon.png",
							capabilities: ["File storage", "Document search", "Sharing"],
							usedBy: ["Content Manager", "Data Analyst"],
						},
						{
							name: "Gmail",
							iconPath: "/integration-icons/gmail-icon.png",
							capabilities: ["Email sending", "Inbox management", "Automation"],
							usedBy: ["Sales Assistant", "Customer Support"],
						},
						{
							name: "Google Sheets",
							iconPath: "/integration-icons/google-sheets.png",
							capabilities: ["Data storage", "Calculations", "Reporting"],
							usedBy: ["Sales Assistant", "Data Analyst", "Content Manager"],
						},
						{
							name: "Google Docs",
							iconPath: "/integration-icons/google-docs-logo.png",
							capabilities: ["Document creation", "Collaboration", "Templates"],
							usedBy: ["Content Manager"],
						},
						{
							name: "Google Calendar",
							iconPath: "/integration-icons/google-calendar-logo.png",
							capabilities: ["Scheduling", "Event management", "Reminders"],
							usedBy: ["Sales Assistant"],
						},
						{
							name: "Google Slides",
							iconPath: "/integration-icons/google-slides-logo.png",
							capabilities: ["Presentation creation", "Design", "Export"],
							usedBy: ["Content Manager"],
						},
						{
							name: "Google BigQuery",
							iconPath: "/integration-icons/google-big-query-icon.png",
							capabilities: ["Data warehousing", "Analytics", "SQL queries"],
							usedBy: ["Data Analyst"],
						},
						{
							name: "Google Maps",
							iconPath: "/integration-icons/google-maps-icon.png",
							capabilities: ["Location services", "Geocoding", "Routing"],
							usedBy: ["Sales Assistant"],
						},
						{
							name: "Asana",
							iconPath: "/integration-icons/asana-icon-light.png",
							capabilities: ["Task management", "Project tracking", "Collaboration"],
							usedBy: ["Content Manager"],
						},
						{
							name: "Linear",
							iconPath: "/integration-icons/linear-symbol-light.png",
							capabilities: ["Issue tracking", "Sprint planning", "Roadmaps"],
							usedBy: ["Data Analyst"],
						},
						{
							name: "Figma",
							iconPath: "/integration-icons/figma-icon.png",
							capabilities: ["Design", "Prototyping", "Collaboration"],
							usedBy: ["Content Manager"],
						},
						{
							name: "Snowflake",
							iconPath: "/integration-icons/Snowflake-icon.png",
							capabilities: ["Data warehousing", "Analytics", "Data sharing"],
							usedBy: ["Data Analyst"],
						},
					]}
					highlightOnClick={true}
				/>
			</section>

			{/* 5. StepByStepFlow Demo */}
			<section>
				<div className="text-center mb-8">
					<h2 className="text-3xl font-bold mb-2">5. Step-by-Step Flow</h2>
					<p className="text-gray-600 dark:text-gray-400">
						Interactive stepper - click steps to expand details
					</p>
				</div>
				<div className="max-w-3xl mx-auto">
					<StepByStepFlow
						steps={[
							{
								number: 1,
								title: "Data Collection",
								description: "Gather information from multiple sources",
								details:
									"Agent automatically pulls data from APIs, databases, uploaded files, and connected integrations. Supports JSON, CSV, Excel, and direct database connections.",
								icon: <Database className="w-5 h-5" />,
							},
							{
								number: 2,
								title: "AI Processing",
								description: "Analyze and transform data using AI models",
								details:
									"GPT-4, Claude, and Gemini models process information, extract key insights, apply business logic, and make intelligent decisions based on your requirements.",
								icon: <Cpu className="w-5 h-5" />,
							},
							{
								number: 3,
								title: "Intelligent Routing",
								description: "Determine next action based on results",
								details:
									"Agent evaluates processed data and intelligently routes to appropriate next steps. Can trigger multiple workflows or escalate to human review when needed.",
								icon: <FileText className="w-5 h-5" />,
							},
							{
								number: 4,
								title: "Action Execution",
								description: "Complete tasks and update systems",
								details:
									"Updates CRM records, sends notifications via email or Slack, generates reports, creates documents, and triggers downstream workflows automatically.",
								icon: <CheckCircle className="w-5 h-5" />,
							},
						]}
						defaultExpanded={0}
					/>
				</div>
			</section>

			{/* Code Example Section */}
			<section className="bg-gray-50 dark:bg-gray-900 rounded-xl p-8">
				<h2 className="text-2xl font-bold mb-4 text-center">Quick Start</h2>
				<div className="max-w-2xl mx-auto">
					<pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-6 rounded-lg overflow-x-auto text-sm">
						<code>{`import {
  WorkflowVisualizer,
  AgentCard,
  IntegrationShowcase,
  MetricCounterGrid,
  StepByStepFlow
} from "@/components/use-cases"

// Use in your pages
<WorkflowVisualizer steps={...} />
<AgentCard agent={...} />
<IntegrationShowcase integrations={...} />
<MetricCounterGrid metrics={...} />
<StepByStepFlow steps={...} />`}</code>
					</pre>
					<p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
						See README.md for full documentation and examples
					</p>
				</div>
			</section>
		</div>
	)
}

export default UseCaseComponentsDemo
