import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Client } from "@langchain/langgraph-sdk";

export async function GET(
	request: NextRequest,
	props: { params: Promise<{ agentId: string; threadId: string }> }
) {
	try {
		const { agentId, threadId } = await props.params;
		const supabase = await createClient();

		// Get the current user
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Verify user has access to this agent
		const { data: userAssistant, error: userAssistantError } = await supabase
			.from("user_assistants")
			.select("assistant_id")
			.eq("user_id", user.id)
			.eq("assistant_id", agentId)
			.single();

		if (userAssistantError || !userAssistant) {
			return NextResponse.json(
				{ error: "Agent not found or access denied" },
				{ status: 404 }
			);
		}

		// Create LangGraph client
		const client = new Client({
			apiUrl: process.env.LANGGRAPH_API_URL!,
			apiKey: process.env.LANGSMITH_API_KEY!,
		});

		// Get thread state
		const state = await client.threads.getState(threadId);

		return NextResponse.json(state);
	} catch (error) {
		console.error("Error fetching thread state:", error);
		return NextResponse.json(
			{ error: "Failed to fetch thread state" },
			{ status: 500 }
		);
	}
}
