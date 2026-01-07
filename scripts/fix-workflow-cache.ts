/**
 * Fix stale workflows.nodes cache to match cleaned workflow_tasks
 */

import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"

config({ path: ".env.local" })
config()

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fixWorkflowCache() {
	const workflowId = "9966cbb1-f708-4b2c-8f4f-698a035a577f"
	
	console.log("🔧 Fixing workflow cache...\n")

	// Get the workflow
	const { data: workflow } = await supabase
		.from("workflows")
		.select("*")
		.eq("workflow_id", workflowId)
		.single()

	if (!workflow) {
		console.log("Workflow not found")
		return
	}

	// Get the cleaned tasks from workflow_tasks
	const { data: tasks } = await supabase
		.from("workflow_tasks")
		.select("*")
		.eq("workflow_id", workflowId)
		.order("position")

	console.log(`Found ${tasks?.length || 0} tasks in workflow_tasks table`)

	// Build a map of task_id to cleaned task data
	const tasksById = new Map(
		(tasks || []).map((t) => [t.workflow_task_id, t])
	)

	// Update the nodes to match the cleaned tasks
	const nodes = workflow.nodes as any[]
	const cleanedNodes = nodes.map((node) => {
		if (node.type === "task") {
			const taskData = tasksById.get(node.data.workflow_task_id)
			
			if (taskData) {
				console.log(`   Cleaning node: "${node.data.name}"`)
				console.log(`     Old: ${node.data.assignedAssistant?.name || "none"}`)
				console.log(`     New: ${taskData.assistant_id || "NO AGENT"}`)

				// Update node to match the cleaned task
				return {
					...node,
					data: {
						...node.data,
						assignedAssistant: taskData.config?.assigned_assistant || undefined,
						config: taskData.config,
					},
				}
			}
		}
		return node
	})

	// Update the workflow
	const { error } = await supabase
		.from("workflows")
		.update({
			nodes: cleanedNodes,
			updated_at: new Date().toISOString(),
		})
		.eq("workflow_id", workflowId)

	if (error) {
		console.error("Error updating workflow:", error)
	} else {
		console.log("\n✅ Workflow cache updated!")
		console.log("   Please refresh your browser to see the changes.\n")
	}
}

fixWorkflowCache()
