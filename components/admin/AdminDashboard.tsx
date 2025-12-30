"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { AdminRateLimitPanel } from "@/components/admin/AdminRateLimitPanel"
import { BlogPostsList } from "@/components/admin/blog/BlogPostsList"
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel"

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

function MetricCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-semibold">{value}</div>
				{sub ? <div className="text-xs text-muted-foreground mt-1">{sub}</div> : null}
			</CardContent>
		</Card>
	)
}

export function AdminDashboard() {
	const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState<boolean>(true)

	useEffect(() => {
		;(async () => {
			setLoading(true)
			setError(null)
			try {
				const res = await fetch("/api/admin/metrics")
				const json = await res.json()
				if (!res.ok) throw new Error(json?.error || res.statusText)
				setMetrics(json)
			} catch (e: any) {
				setError(e?.message || "Failed to load admin metrics")
				setMetrics(null)
			} finally {
				setLoading(false)
			}
		})()
	}, [])

	const topUsers = useMemo(() => metrics?.usage.topUsersLast7d ?? [], [metrics])

	return (
		<div className="container mx-auto p-6 space-y-6">
			<div>
				<h1 className="text-2xl font-semibold">Admin Dashboard</h1>
				<p className="text-sm text-muted-foreground">Signups and usage across the product.</p>
			</div>

			<Tabs defaultValue="overview">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="users">Users</TabsTrigger>
					<TabsTrigger value="blog">Blog</TabsTrigger>
					<TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-6">
					{error ? (
						<Card>
							<CardHeader>
								<CardTitle>Failed to load</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-sm text-destructive">{error}</div>
							</CardContent>
						</Card>
					) : null}

					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<MetricCard
							title="Total users"
							value={loading ? "…" : String(metrics?.users.total ?? 0)}
							sub="All auth users (service role)"
						/>
						<MetricCard title="New users (7d)" value={loading ? "…" : String(metrics?.users.last7d ?? 0)} />
						<MetricCard title="Active users (7d)" value={loading ? "…" : String(metrics?.usage.activeUsersLast7d ?? 0)} />
						<MetricCard
							title="Workflow runs (7d)"
							value={loading ? "…" : String(metrics?.usage.workflowRunsLast7d ?? 0)}
							sub={`Workflows: ${metrics?.usage.workflowsTotal ?? 0} total`}
						/>
					</div>

					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<MetricCard
							title="Trialing users"
							value={loading ? "…" : String(metrics?.subscriptions.trialing ?? 0)}
							sub="14-day free trial"
						/>
						<MetricCard
							title="Active subscriptions"
							value={loading ? "…" : String(metrics?.subscriptions.active ?? 0)}
							sub="Paid + free"
						/>
						<MetricCard
							title="Past due"
							value={loading ? "…" : String(metrics?.subscriptions.pastDue ?? 0)}
						/>
						<MetricCard
							title="Canceled"
							value={loading ? "…" : String(metrics?.subscriptions.canceled ?? 0)}
						/>
					</div>

					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						<MetricCard
							title="Free plan"
							value={loading ? "…" : String(metrics?.subscriptions.freePlan ?? 0)}
						/>
						<MetricCard
							title="Starter plan"
							value={loading ? "…" : String(metrics?.subscriptions.starterPlan ?? 0)}
						/>
						<MetricCard
							title="Pro plan"
							value={loading ? "…" : String(metrics?.subscriptions.proPlan ?? 0)}
						/>
					</div>

					<div className="grid gap-6 lg:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Recent signups</CardTitle>
							</CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Email</TableHead>
											<TableHead>Created</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{(metrics?.users.recent ?? []).map((u) => (
											<TableRow key={u.id}>
												<TableCell className="font-medium">{u.email ?? "(no email)"}</TableCell>
												<TableCell>{new Date(u.created_at).toLocaleString()}</TableCell>
											</TableRow>
										))}
										{!loading && (metrics?.users.recent ?? []).length === 0 ? (
											<TableRow>
												<TableCell colSpan={2} className="text-sm text-muted-foreground">
													No users found.
												</TableCell>
											</TableRow>
										) : null}
										{loading ? (
											<TableRow>
												<TableCell colSpan={2} className="text-sm text-muted-foreground">
													Loading…
												</TableCell>
											</TableRow>
										) : null}
									</TableBody>
								</Table>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Top users (7d)</CardTitle>
							</CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>User ID</TableHead>
											<TableHead className="text-right">Events</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{topUsers.map((u) => (
											<TableRow key={u.userId}>
												<TableCell className="font-mono text-xs">{u.userId}</TableCell>
												<TableCell className="text-right">{u.events}</TableCell>
											</TableRow>
										))}
										{!loading && topUsers.length === 0 ? (
											<TableRow>
												<TableCell colSpan={2} className="text-sm text-muted-foreground">
													No activity found in the last 7 days.
												</TableCell>
											</TableRow>
										) : null}
										{loading ? (
											<TableRow>
												<TableCell colSpan={2} className="text-sm text-muted-foreground">
													Loading…
												</TableCell>
											</TableRow>
										) : null}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="blog">
					<BlogPostsList />
				</TabsContent>

				<TabsContent value="users">
					<AdminUsersPanel />
				</TabsContent>

				<TabsContent value="rate-limits">
					<AdminRateLimitPanel />
				</TabsContent>
			</Tabs>
		</div>
	)
}
