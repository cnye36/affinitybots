import type { User } from "@supabase/supabase-js"
import { createClient } from "@/supabase/server"
import { isAdminEmail } from "@/lib/admin/admin"

type RequireAdminResult =
	| { ok: true; user: User }
	| { ok: false; status: 401 | 403; error: string }

export async function requireAdmin(): Promise<RequireAdminResult> {
	const supabase = await createClient()
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser()

	if (error) {
		console.error("requireAdmin: failed to fetch user:", error)
	}

	if (!user) {
		return { ok: false, status: 401, error: "Unauthorized" }
	}

	if (!isAdminEmail(user.email)) {
		return { ok: false, status: 403, error: "Forbidden" }
	}

	return { ok: true, user }
}


