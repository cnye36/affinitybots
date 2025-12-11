import { Tutorial } from "@/types/tutorial"

/**
 * Individual agent detail/chat page tutorial
 * Teaches users how to interact with an agent
 */
export const agentDetailTutorial: Tutorial = {
	id: "agent-chat",
	name: "Chat with Your Agent",
	description: "Learn how to interact with and configure your AI agent",
	autoStart: true,
	steps: [
		{
			id: "welcome",
			target: "[data-tutorial='agent-header']",
			title: "Agent Chat Interface",
			content: "Welcome to your agent's chat interface! Here you can have conversations with your AI agent and configure its settings.",
			position: "bottom",
			showSpotlight: true,
		},
		{
			id: "configure-button",
			target: "[data-tutorial='configure-agent']",
			title: "Agent Configuration",
			content: "Click here to configure your agent's settings including the AI model, system prompts, memory, and enabled tools. You can customize how your agent behaves and what it can access.",
			position: "bottom",
			showSpotlight: true,
		},
		{
			id: "chat-area",
			target: "[data-tutorial='chat-messages']",
			title: "Conversation History",
			content: "Your conversation with the agent appears here. The agent will remember context throughout the conversation and can use its enabled tools to help you.",
			position: "top",
			showSpotlight: true,
		},
		{
			id: "composer",
			target: "[data-tutorial='chat-composer']",
			title: "Message Composer",
			content: "Type your messages here. You can ask questions, request actions, or have the agent use its tools to accomplish tasks. Press Enter to send.",
			position: "top",
			showSpotlight: true,
		},
		{
			id: "attachments",
			target: "[data-tutorial='attachment-button']",
			title: "File Attachments",
			content: "Click here to attach files to your message. Agents can analyze documents, images, and other files you share.",
			position: "top",
			showSpotlight: true,
		},
		{
			id: "complete",
			target: "[data-tutorial='chat-composer']",
			title: "Start Chatting!",
			content: "You're ready to chat with your agent! Try asking it a question or requesting help with a task. The agent will use its configured tools to assist you.",
			position: "top",
			showSpotlight: false,
		},
	],
}
