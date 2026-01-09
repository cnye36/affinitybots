import { createClient } from "@/supabase/server"
import { createBrowserClient } from "@supabase/ssr"

export type ApprovalType = "tool" | "integration"

export interface ToolApprovalPreference {
	id: string
	user_id: string
	assistant_id: string
	approval_type: ApprovalType
	approval_target: string
	created_at: string
	updated_at: string
}

/**
 * Check if a tool is pre-approved by the user
 */
export async function isToolApproved(
	userId: string,
	assistantId: string,
	toolName: string,
	mcpServer?: string
): Promise<boolean> {
	const supabase = createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
	)

	// Check if specific tool is approved
	const { data: toolApproval } = await supabase
		.from("tool_approval_preferences")
		.select("*")
		.eq("user_id", userId)
		.eq("assistant_id", assistantId)
		.eq("approval_type", "tool")
		.eq("approval_target", toolName)
		.maybeSingle()

	if (toolApproval) return true

	// Check if entire integration is approved
	if (mcpServer) {
		const { data: integrationApproval } = await supabase
			.from("tool_approval_preferences")
			.select("*")
			.eq("user_id", userId)
			.eq("assistant_id", assistantId)
			.eq("approval_type", "integration")
			.eq("approval_target", mcpServer)
			.maybeSingle()

		if (integrationApproval) return true
	}

	return false
}

/**
 * Save tool approval preference
 */
export async function saveToolApproval(
	userId: string,
	assistantId: string,
	approvalType: ApprovalType,
	approvalTarget: string
): Promise<void> {
	const supabase = createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
	)

	await supabase.from("tool_approval_preferences").upsert({
		user_id: userId,
		assistant_id: assistantId,
		approval_type: approvalType,
		approval_target: approvalTarget,
	})
}

/**
 * Get all approval preferences for an assistant
 */
export async function getApprovalPreferences(
	userId: string,
	assistantId: string
): Promise<ToolApprovalPreference[]> {
	const supabase = createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
	)

	const { data } = await supabase
		.from("tool_approval_preferences")
		.select("*")
		.eq("user_id", userId)
		.eq("assistant_id", assistantId)

	return data || []
}

/**
 * Remove a tool approval preference
 */
export async function removeToolApproval(
	userId: string,
	assistantId: string,
	approvalType: ApprovalType,
	approvalTarget: string
): Promise<void> {
	const supabase = createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
	)

	await supabase
		.from("tool_approval_preferences")
		.delete()
		.eq("user_id", userId)
		.eq("assistant_id", assistantId)
		.eq("approval_type", approvalType)
		.eq("approval_target", approvalTarget)
}
