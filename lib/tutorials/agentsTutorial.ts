import { Tutorial } from "@/types/tutorial"

/**
 * Agents list page tutorial
 * Guides users through the agents management interface
 */
export const agentsTutorial: Tutorial = {
	id: "agents-list",
	name: "Agents Overview",
	description: "Learn how to manage and interact with your AI agents",
	autoStart: true,
	steps: [
		{
			id: "welcome",
			target: "h1",
			title: "Your AI Agents",
			content: "Welcome to your Agents page! Here you can view, create, and manage all your AI agents. Each agent can be customized with different models, tools, and capabilities.",
			position: "bottom",
			showSpotlight: true,
		},
		{
			id: "create-button",
			target: "[data-tutorial='create-agent-button']",
			title: "Create New Agent",
			content: "Click here to create a new AI agent. You'll be able to choose from models like GPT-4, Claude, and Gemini, and configure which tools the agent can access.",
			position: "bottom",
			showSpotlight: true,
		},
		{
			id: "agent-cards",
			target: "[data-tutorial='agents-grid']",
			title: "Agent Gallery",
			content: "Your agents are displayed as cards showing their name, description, and enabled tools. Click on any agent card to start chatting with that agent.",
			position: "top",
			showSpotlight: true,
		},
		{
			id: "agent-tools",
			target: "[data-tutorial='agents-grid'] > div:first-child",
			title: "Agent Details",
			content: "Each agent card shows the tools it has access to. The tool icons indicate which integrations (like GitHub, HubSpot, etc.) this agent can use to help you.",
			position: "top",
			showSpotlight: true,
		},
		{
			id: "complete",
			target: "h1",
			title: "Ready to Create!",
			content: "Now you know how to manage your agents. Try creating your first agent or click on an existing one to start a conversation!",
			position: "bottom",
			showSpotlight: false,
		},
	],
}
