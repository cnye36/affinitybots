import { Tutorial } from "@/types/tutorial"

/**
 * Dashboard page tutorial
 * Introduces users to the main dashboard features
 */
export const dashboardTutorial: Tutorial = {
	id: "dashboard",
	name: "Dashboard Tour",
	description: "Learn about your dashboard and its key features",
	autoStart: true,
	steps: [
		{
			id: "welcome",
			target: "h1",
			title: "Welcome to AgentHub!",
			content: "This is your dashboard - your central hub for monitoring agents, workflows, and system performance. Let's take a quick tour of the main features.",
			position: "bottom",
			showSpotlight: true,
		},
		{
			id: "stats-overview",
			target: "[data-tutorial='stats-overview']",
			title: "Performance Statistics",
			content: "Here you can see your key metrics at a glance: total workflows, agents, success rate, and average response time. These stats update in real-time as you use the platform.",
			position: "bottom",
			showSpotlight: true,
		},
		{
			id: "quick-actions",
			target: "[data-tutorial='quick-actions']",
			title: "Quick Actions",
			content: "Use these buttons to quickly create new agents or workflows. You can also filter your view by time period.",
			position: "left",
			showSpotlight: true,
		},
		{
			id: "agents-section",
			target: "[data-tutorial='agents-section']",
			title: "Your Agents",
			content: "This section shows your most recently created AI agents. Each agent can have different capabilities and tools enabled. Click on any agent to start chatting with it.",
			position: "top",
			showSpotlight: true,
		},
		{
			id: "tools-section",
			target: "[data-tutorial='tools-section']",
			title: "Configured Tools",
			content: "View your recently configured tools and integrations. Tools extend your agents' capabilities by connecting to external services like GitHub, HubSpot, and more.",
			position: "top",
			showSpotlight: true,
		},
		{
			id: "workflows-section",
			target: "[data-tutorial='workflows-section']",
			title: "Active Workflows",
			content: "Monitor your workflows here. Workflows allow you to chain multiple agents together to automate complex tasks.",
			position: "top",
			showSpotlight: true,
		},
		{
			id: "activity-section",
			target: "[data-tutorial='activity-section']",
			title: "Recent Activity",
			content: "Track your recent actions and system events. This helps you stay informed about what's happening across your workspace.",
			position: "top",
			showSpotlight: true,
		},
		{
			id: "complete",
			target: "h1",
			title: "You're All Set!",
			content: "That's the dashboard overview! Feel free to explore on your own, or check out the Agents and Workflows pages to get started creating your first AI assistant.",
			position: "bottom",
			showSpotlight: false,
		},
	],
}
