import { Tutorial } from "@/types/tutorial"

/**
 * Workflows page tutorial
 * Introduces users to workflow automation
 */
export const workflowsTutorial: Tutorial = {
	id: "workflows",
	name: "Workflows Introduction",
	description: "Learn about workflow automation and how to create your first workflow",
	autoStart: true,
	steps: [
		{
			id: "welcome",
			target: "h1",
			title: "Workflow Automation",
			content: "Welcome to Workflows! Here you can create automated workflows that chain multiple AI agents together to accomplish complex tasks.",
			position: "bottom",
			showSpotlight: true,
		},
		{
			id: "create-button",
			target: "[data-tutorial='create-workflow-button']",
			title: "Create New Workflow",
			content: "Click here to create a new workflow. You'll be able to design a visual workflow using a drag-and-drop interface, connecting triggers and agent tasks.",
			position: "left",
			showSpotlight: true,
		},
		{
			id: "workflow-cards",
			target: "[data-tutorial='workflows-grid']",
			title: "Your Workflows",
			content: "All your workflows are displayed here. Each card shows the workflow name, description, and its current status. Click on any workflow to edit or view its details.",
			position: "top",
			showSpotlight: true,
		},
		{
			id: "workflow-features",
			target: "h1",
			title: "Workflow Capabilities",
			content: "Workflows can be triggered manually, via webhooks, on schedules, or by external integrations. You can chain multiple agents together, share context between tasks, and automate complex multi-step processes.",
			position: "bottom",
			showSpotlight: false,
		},
		{
			id: "complete",
			target: "[data-tutorial='create-workflow-button']",
			title: "Start Building!",
			content: "Ready to automate your work? Create your first workflow to see how powerful agent orchestration can be!",
			position: "left",
			showSpotlight: false,
		},
	],
}
