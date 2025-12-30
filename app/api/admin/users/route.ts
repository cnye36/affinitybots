import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin/requireAdmin"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

type AdminUserRow = {
	id: string
	email: string | null
	created_at: string
	last_active_at: string | null
	active_7d: boolean
	subscription: {
		plan_type: string | null
		status: string | null
		trial_start: string | null
		trial_end: string | null
		current_period_end: string | null
	}
}

export async function GET(request: Request) {
	const admin = await requireAdmin()
	if (!admin.ok) {
		return NextResponse.json({ error: admin.error }, { status: admin.status })
	}

	const url = new URL(request.url)
	const statusFilter = url.searchParams.get("status")
	const planFilter = url.searchParams.get("plan")
	const activityFilter = url.searchParams.get("activity")
	const trialFilter = url.searchParams.get("trial")
	const perPage = Math.min(Number(url.searchParams.get("perPage") || 50), 200)

	const supabaseAdmin = getSupabaseAdmin()
	const maxPages = 10
	const collectedUsers: Array<{ id: string; email: string | null; created_at: string }> = []

	for (let page = 1; page <= maxPages; page += 1) {
		const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })
		if (error) {
			console.error("Admin users: failed to list users:", error)
			break
		}
		const users = (data?.users ?? []).map((u) => ({
			id: u.id,
			email: u.email ?? null,
			created_at: u.created_at,
		}))
		collectedUsers.push(...users)
		if (users.length < perPage) break
	}

	const userIds = collectedUsers.map((u) => u.id)
	if (userIds.length === 0) {
		return NextResponse.json({ users: [] })
	}

	const [subscriptionsRes, activityRes, workflowRunsRes, aiUsageRes] = await Promise.all([
		supabaseAdmin
			.from("subscriptions")
			.select("user_id, plan_type, status, trial_start, trial_end, current_period_end")
			.in("user_id", userIds),
		supabaseAdmin
			.from("activity_log")
			.select("user_id, created_at")
			.in("user_id", userIds)
			.gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
		supabaseAdmin
			.from("workflow_runs")
			.select("owner_id, started_at")
			.in("owner_id", userIds)
			.gte("started_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
		supabaseAdmin
			.from("ai_usage_logs")
			.select("user_id, created_at")
			.in("user_id", userIds)
			.gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
	])

	if (subscriptionsRes.error) {
		console.error("Admin users: failed to load subscriptions:", subscriptionsRes.error)
	}
	if (activityRes.error) {
		console.error("Admin users: failed to load activity logs:", activityRes.error)
	}
	if (workflowRunsRes.error) {
		console.error("Admin users: failed to load workflow runs:", workflowRunsRes.error)
	}
	if (aiUsageRes.error) {
		console.error("Admin users: failed to load ai usage logs:", aiUsageRes.error)
	}

	const subscriptionsByUser = new Map<string, any>()
	for (const row of subscriptionsRes.data ?? []) {
		subscriptionsByUser.set((row as any).user_id as string, row)
	}

	const lastActiveByUser = new Map<string, number>()
	const recordActivity = (userId: string, timestamp: string | null) => {
		if (!timestamp) return
		const time = new Date(timestamp).getTime()
		const prev = lastActiveByUser.get(userId)
		if (!prev || time > prev) lastActiveByUser.set(userId, time)
	}

	for (const row of activityRes.data ?? []) {
		const userId = (row as any).user_id as string | null
		if (!userId) continue
		recordActivity(userId, (row as any).created_at)
	}

	for (const row of workflowRunsRes.data ?? []) {
		const userId = (row as any).owner_id as string | null
		if (!userId) continue
		recordActivity(userId, (row as any).started_at)
	}

	for (const row of aiUsageRes.data ?? []) {
		const userId = (row as any).user_id as string | null
		if (!userId) continue
		recordActivity(userId, (row as any).created_at)
	}

	const now = Date.now()
	const activeThreshold = now - 7 * 24 * 60 * 60 * 1000

	const rows: AdminUserRow[] = collectedUsers.map((user) => {
		const subscription = subscriptionsByUser.get(user.id) || {}
		const lastActiveMs = lastActiveByUser.get(user.id) || null
		return {
			id: user.id,
			email: user.email,
			created_at: user.created_at,
			last_active_at: lastActiveMs ? new Date(lastActiveMs).toISOString() : null,
			active_7d: lastActiveMs ? lastActiveMs >= activeThreshold : false,
			subscription: {
				plan_type: subscription.plan_type || null,
				status: subscription.status || null,
				trial_start: subscription.trial_start || null,
				trial_end: subscription.trial_end || null,
				current_period_end: subscription.current_period_end || null,
			},
		}
	})

	const filtered = rows.filter((row) => {
		if (statusFilter && row.subscription.status !== statusFilter) return false
		if (planFilter && row.subscription.plan_type !== planFilter) return false
		if (activityFilter === "active" && !row.active_7d) return false
		if (activityFilter === "inactive" && row.active_7d) return false
		if (trialFilter === "active") {
			if (row.subscription.status !== "trialing") return false
			const trialEnd = row.subscription.trial_end ? new Date(row.subscription.trial_end).getTime() : null
			if (trialEnd && trialEnd < now) return false
		}
		if (trialFilter === "expired") {
			const trialEnd = row.subscription.trial_end ? new Date(row.subscription.trial_end).getTime() : null
			if (!trialEnd || trialEnd >= now) return false
		}
		return true
	})

	return NextResponse.json({ users: filtered })
}
