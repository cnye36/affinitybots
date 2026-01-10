import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

/**
 * Admin-only endpoint to clear all old memories from the store table
 * This is a one-time cleanup for the memory system refactor
 *
 * Usage: POST /api/admin/clear-memories
 */
export async function POST(req: NextRequest) {
	try {
		const supabase = getSupabaseAdmin()

		// Delete all entries where prefix starts with "user_profile"
		// This handles both dot notation (user_profile.assistant_id) and JSON array (['user_profile', 'assistant_id'])
		const { data, error } = await supabase
			.from("store")
			.delete()
			.or('prefix.like.user_profile.%,prefix.cs.{"user_profile"%')

		if (error) {
			console.error("Error clearing memories:", error)
			return NextResponse.json(
				{ success: false, error: error.message },
				{ status: 500 }
			)
		}

		return NextResponse.json({
			success: true,
			message: "All old memories cleared successfully",
		})
	} catch (error) {
		console.error("Error in clear-memories endpoint:", error)
		return NextResponse.json(
			{ success: false, error: String(error) },
			{ status: 500 }
		)
	}
}
