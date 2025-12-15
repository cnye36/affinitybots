"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"

interface EarlyAccessInvite {
	id: string
	email: string
	name: string | null
	status: "requested" | "invited" | "approved" | "accepted" | "expired" | "declined"
	invite_code: string | null
	requested_at: string
	invited_at: string | null
	expires_at: string | null
}

export function EarlyAccessInvitesPanel() {
	const [requests, setRequests] = useState<EarlyAccessInvite[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [actionMessage, setActionMessage] = useState<string | null>(null)
	const [actionError, setActionError] = useState<string | null>(null)

	async function fetchRequests() {
		setLoading(true)
		setError(null)
		try {
			const response = await fetch("/api/admin/early-access-requests")
			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || `Failed to fetch requests: ${response.statusText}`)
			}
			const data = await response.json()
			setRequests(data)
		} catch (err: any) {
			setError(err.message)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchRequests()
	}, [])

	async function handleIssueInvite(requestId: string) {
		setActionMessage(null)
		setActionError(null)
		try {
			const response = await fetch(`/api/admin/early-access-requests/${requestId}/issue-invite`, {
				method: "POST",
			})
			const result = await response.json()
			if (!response.ok) {
				throw new Error(result.error || "Failed to approve request")
			}
			setActionMessage(`Approved successfully for request ID: ${requestId}`)
			await fetchRequests()
		} catch (err: any) {
			setActionError(err.message)
		}
	}

	const getStatusBadgeVariant = (status: EarlyAccessInvite["status"]) => {
		switch (status) {
			case "requested":
				return "secondary"
			case "invited":
				return "default"
			case "approved":
				return "default"
			case "accepted":
				return "default"
			case "expired":
				return "destructive"
			case "declined":
				return "outline"
			default:
				return "secondary"
		}
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-3">
				<div>
					<h2 className="text-xl font-semibold">Invites</h2>
					<p className="text-sm text-muted-foreground">Manage early access requests and approvals.</p>
				</div>
				<Button variant="outline" size="sm" onClick={() => fetchRequests()} disabled={loading}>
					Refresh
				</Button>
			</div>

			{error && (
				<Alert variant="destructive">
					<AlertTitle>Error Fetching Data</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{actionMessage && (
				<Alert className="bg-green-100 border-green-400 text-green-700">
					<AlertTitle>Success</AlertTitle>
					<AlertDescription>{actionMessage}</AlertDescription>
				</Alert>
			)}

			{actionError && (
				<Alert variant="destructive">
					<AlertTitle>Action Failed</AlertTitle>
					<AlertDescription>{actionError}</AlertDescription>
				</Alert>
			)}

			{loading ? (
				<div className="text-sm text-muted-foreground">Loading early access requests…</div>
			) : null}

			{!loading && requests.length === 0 && !error ? (
				<p className="text-sm text-muted-foreground">No early access requests found.</p>
			) : null}

			{requests.length > 0 ? (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Email</TableHead>
							<TableHead>Name</TableHead>
							<TableHead>Requested</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Invite Code</TableHead>
							<TableHead>Expires</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{requests.map((req) => (
							<TableRow key={req.id}>
								<TableCell>{req.email}</TableCell>
								<TableCell>{req.name || "-"}</TableCell>
								<TableCell>{new Date(req.requested_at).toLocaleDateString()}</TableCell>
								<TableCell>
									<Badge variant={getStatusBadgeVariant(req.status)}>{req.status}</Badge>
								</TableCell>
								<TableCell>{req.invite_code || "-"}</TableCell>
								<TableCell>
									{req.expires_at ? new Date(req.expires_at).toLocaleDateString() : "-"}
								</TableCell>
								<TableCell className="space-x-2">
									{req.status === "requested" ? (
										<Button size="sm" onClick={() => handleIssueInvite(req.id)} disabled={loading}>
											Approve
										</Button>
									) : null}
									{req.status === "invited" || req.status === "approved" ? (
										<Button
											size="sm"
											variant="outline"
											onClick={async () => {
												setActionMessage(null)
												setActionError(null)
												try {
													const response = await fetch(
														`/api/admin/early-access-requests/${req.id}/resend-invite`,
														{ method: "POST" }
													)
													const result = await response.json()
													if (!response.ok) {
														throw new Error(result.error || "Failed to resend approval email")
													}
													setActionMessage(`Approval email resent successfully for ${req.email}`)
												} catch (err: any) {
													setActionError(err.message)
												}
											}}
											disabled={loading}
										>
											Resend Email
										</Button>
									) : null}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			) : null}
		</div>
	)
}


