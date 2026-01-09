import { createClient } from "@/supabase/server"
import { redirect } from "next/navigation"
import { Assistant } from "@/types/assistant"
import { PlaygroundContainerWrapper } from "@/components/playground/PlaygroundContainerWrapper"

export const metadata = {
	title: "Playground | AgentHub",
	description: "Test and fine-tune your agent teams",
}

async function getAssistants(): Promise<Assistant[]> {
	const supabase = await createClient()
	const { data: { user } } = await supabase.auth.getUser()

	if (!user) {
		return []
	}

	try {
		const platformUrl = process.env.LANGGRAPH_API_URL || "http://localhost:8123"
		const response = await fetch(`${platformUrl}/assistants/search`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Api-Key": process.env.LANGSMITH_API_KEY || "",
			},
			body: JSON.stringify({
				metadata: {
					owner_id: user.id,
				},
			}),
		})

		if (!response.ok) {
			console.error("Failed to fetch assistants:", response.statusText)
			return []
		}

		const assistants = await response.json()
		return assistants || []
	} catch (error) {
		console.error("Error fetching assistants:", error)
		return []
	}
}

export default async function PlaygroundPage() {
	const supabase = await createClient()
	const { data: { user } } = await supabase.auth.getUser()

	if (!user) {
		redirect("/login")
	}

	const assistants = await getAssistants()

	return (
		<div className="h-screen">
			<PlaygroundContainerWrapper assistants={assistants} />
		</div>
	)
}
