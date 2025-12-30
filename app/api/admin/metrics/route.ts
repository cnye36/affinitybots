import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin/requireAdmin"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

type AdminMetrics = {
	users: {
		total: number
		last7d: number
		last30d: number
		recent: Array<{ id: string; email: string | null; created_at: string }>
	}
	subscriptions: {
		trialing: number
		active: number
		canceled: number
		pastDue: number
		freePlan: number
		starterPlan: number
		proPlan: number
	}
	usage: {
		activeUsersLast7d: number
		workflowRunsLast7d: number
		workflowsTotal: number
		workflowsCreatedLast7d: number
		topUsersLast7d: Array<{ userId: string; events: number }>
	}
}

export async function GET() {
	const admin = await requireAdmin()
	if (!admin.ok) {
		return NextResponse.json({ error: admin.error }, { status: admin.status })
	}

	const supabaseAdmin = getSupabaseAdmin()

	const nowMs = Date.now()
	const since7dMs = nowMs - 7 * 24 * 60 * 60 * 1000
	const since30dMs = nowMs - 30 * 24 * 60 * 60 * 1000

	const perPage = 1000
	const maxPages = 10
	const allUsers: Array<{ id: string; email: string | null; created_at: string }> = []

	for (let page = 1; page <= maxPages; page += 1) {
		const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })
		if (error) {
			console.error("Admin metrics: failed to list users:", error)
			break
		}
		const users = (data?.users ?? []).map((u) => ({
			id: u.id,
			email: u.email ?? null,
			created_at: u.created_at,
		}))
		allUsers.push(...users)
		if (users.length < perPage) break
	}

	let usersLast7d = 0
	let usersLast30d = 0

	for (const u of allUsers) {
		const createdMs = new Date(u.created_at).getTime()
		if (createdMs >= since7dMs) usersLast7d += 1
		if (createdMs >= since30dMs) usersLast30d += 1
	}

	const recentUsers = [...allUsers]
		.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
		.slice(0, 10)

	const since7dIso = new Date(since7dMs).toISOString()

	const [
		workflowsTotalRes,
		workflowsLast7dRes,
		workflowRunsLast7dRes,
		activityLast7dRes,
		subscriptionsRes,
	] = await Promise.all([
		supabaseAdmin.from("workflows").select("*", { count: "exact", head: true }),
		supabaseAdmin.from("workflows").select("*", { count: "exact", head: true }).gte("created_at", since7dIso),
		supabaseAdmin.from("workflow_runs").select("*", { count: "exact", head: true }).gte("started_at", since7dIso),
		supabaseAdmin.from("activity_log").select("user_id, created_at").gte("created_at", since7dIso),
		supabaseAdmin.from("subscriptions").select("status, plan_type"),
	])

	if (workflowsTotalRes.error) {
		console.error("Admin metrics: failed to count workflowsTotal:", workflowsTotalRes.error)
	}
	if (workflowsLast7dRes.error) {
		console.error("Admin metrics: failed to count workflowsLast7d:", workflowsLast7dRes.error)
	}
	if (workflowRunsLast7dRes.error) {
		console.error("Admin metrics: failed to count workflowRunsLast7d:", workflowRunsLast7dRes.error)
	}
	if (activityLast7dRes.error) {
		console.error("Admin metrics: failed to fetch activityLast7d:", activityLast7dRes.error)
	}
	if (subscriptionsRes.error) {
		console.error("Admin metrics: failed to fetch subscriptions:", subscriptionsRes.error)
	}

	const activityEvents = activityLast7dRes.data ?? []
	const eventsByUser = new Map<string, number>()
	for (const ev of activityEvents) {
		const userId = (ev as { user_id: string | null | undefined }).user_id
		if (!userId) continue
		eventsByUser.set(userId, (eventsByUser.get(userId) ?? 0) + 1)
	}

	const topUsersLast7d = [...eventsByUser.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 10)
		.map(([userId, events]) => ({ userId, events }))

	const activeUsersLast7d = eventsByUser.size
	const subscriptionsRows = subscriptionsRes.data ?? []
	const subscriptionStats = {
		trialing: 0,
		active: 0,
		canceled: 0,
		pastDue: 0,
		freePlan: 0,
		starterPlan: 0,
		proPlan: 0,
	}

	for (const row of subscriptionsRows) {
		const status = (row as any).status
		const planType = (row as any).plan_type
		if (status === "trialing") subscriptionStats.trialing += 1
		if (status === "active") subscriptionStats.active += 1
		if (status === "canceled") subscriptionStats.canceled += 1
		if (status === "past_due") subscriptionStats.pastDue += 1
		if (planType === "free") subscriptionStats.freePlan += 1
		if (planType === "starter") subscriptionStats.starterPlan += 1
		if (planType === "pro") subscriptionStats.proPlan += 1
	}

	const metrics: AdminMetrics = {
		users: {
			total: allUsers.length,
			last7d: usersLast7d,
			last30d: usersLast30d,
			recent: recentUsers,
		},
		subscriptions: subscriptionStats,
		usage: {
			activeUsersLast7d,
			workflowRunsLast7d: workflowRunsLast7dRes.count ?? 0,
			workflowsTotal: workflowsTotalRes.count ?? 0,
			workflowsCreatedLast7d: workflowsLast7dRes.count ?? 0,
			topUsersLast7d,
		},
	}

	return NextResponse.json(metrics)
}

