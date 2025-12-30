"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCcw } from "lucide-react"

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

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleString() : "—")

const trialLabel = (row: AdminUserRow) => {
	if (!row.subscription.trial_end) return "—"
	const trialEnd = new Date(row.subscription.trial_end).getTime()
	const now = Date.now()
	if (trialEnd < now) return "Ended"
	const daysLeft = Math.ceil((trialEnd - now) / (24 * 60 * 60 * 1000))
	return `${daysLeft}d left`
}

export function AdminUsersPanel() {
	const [users, setUsers] = useState<AdminUserRow[]>([])
	const [loading, setLoading] = useState(true)
	const [planFilter, setPlanFilter] = useState("all")
	const [statusFilter, setStatusFilter] = useState("all")
	const [activityFilter, setActivityFilter] = useState("all")
	const [trialFilter, setTrialFilter] = useState("all")

	const fetchUsers = async () => {
		setLoading(true)
		try {
			const params = new URLSearchParams()
			if (planFilter !== "all") params.set("plan", planFilter)
			if (statusFilter !== "all") params.set("status", statusFilter)
			if (activityFilter !== "all") params.set("activity", activityFilter)
			if (trialFilter !== "all") params.set("trial", trialFilter)
			const res = await fetch(`/api/admin/users?${params.toString()}`)
			const json = await res.json()
			if (res.ok) setUsers(json.users || [])
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchUsers()
	}, [planFilter, statusFilter, activityFilter, trialFilter])

	const counts = useMemo(() => {
		const total = users.length
		const active = users.filter((u) => u.active_7d).length
		const trialing = users.filter((u) => u.subscription.status === "trialing").length
		return { total, active, trialing }
	}, [users])

	return (
		<Card>
			<CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
				<div>
					<CardTitle>Users</CardTitle>
					<div className="text-xs text-muted-foreground">
						{counts.total} users · {counts.active} active (7d) · {counts.trialing} trialing
					</div>
				</div>
				<Button size="sm" variant="outline" onClick={fetchUsers}>
					<RefreshCcw className="h-4 w-4 mr-2" />
					Refresh
				</Button>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-2 md:grid-cols-4">
					<Select value={planFilter} onValueChange={setPlanFilter}>
						<SelectTrigger>
							<SelectValue placeholder="Plan" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All plans</SelectItem>
							<SelectItem value="free">Free</SelectItem>
							<SelectItem value="starter">Starter</SelectItem>
							<SelectItem value="pro">Pro</SelectItem>
						</SelectContent>
					</Select>

					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger>
							<SelectValue placeholder="Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All statuses</SelectItem>
							<SelectItem value="trialing">Trialing</SelectItem>
							<SelectItem value="active">Active</SelectItem>
							<SelectItem value="past_due">Past due</SelectItem>
							<SelectItem value="canceled">Canceled</SelectItem>
							<SelectItem value="unpaid">Unpaid</SelectItem>
						</SelectContent>
					</Select>

					<Select value={activityFilter} onValueChange={setActivityFilter}>
						<SelectTrigger>
							<SelectValue placeholder="Activity" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All activity</SelectItem>
							<SelectItem value="active">Active (7d)</SelectItem>
							<SelectItem value="inactive">Inactive</SelectItem>
						</SelectContent>
					</Select>

					<Select value={trialFilter} onValueChange={setTrialFilter}>
						<SelectTrigger>
							<SelectValue placeholder="Trial" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All trials</SelectItem>
							<SelectItem value="active">Active trial</SelectItem>
							<SelectItem value="expired">Expired trial</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>User</TableHead>
							<TableHead>Plan</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Trial</TableHead>
							<TableHead>Last active</TableHead>
							<TableHead>Signed up</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{users.map((row) => (
							<TableRow key={row.id}>
								<TableCell>
									<div className="font-medium">{row.email ?? "(no email)"}</div>
									<div className="text-[11px] text-muted-foreground">{row.id}</div>
								</TableCell>
								<TableCell className="capitalize">{row.subscription.plan_type || "—"}</TableCell>
								<TableCell>
									<Badge variant={row.subscription.status === "active" ? "default" : "secondary"}>
										{row.subscription.status || "unknown"}
									</Badge>
								</TableCell>
								<TableCell>{trialLabel(row)}</TableCell>
								<TableCell>
									<div className="flex items-center gap-2">
										<span>{formatDate(row.last_active_at)}</span>
										{row.active_7d ? <Badge variant="outline">Active</Badge> : null}
									</div>
								</TableCell>
								<TableCell>{formatDate(row.created_at)}</TableCell>
							</TableRow>
						))}
						{!loading && users.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="text-sm text-muted-foreground">
									No users found for these filters.
								</TableCell>
							</TableRow>
						) : null}
						{loading ? (
							<TableRow>
								<TableCell colSpan={6} className="text-sm text-muted-foreground">
									Loading…
								</TableCell>
							</TableRow>
						) : null}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	)
}
