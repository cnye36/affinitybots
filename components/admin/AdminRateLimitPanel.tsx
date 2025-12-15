"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export function AdminRateLimitPanel() {
	const [currentUserId, setCurrentUserId] = useState<string | undefined>()
	const [targetUserId, setTargetUserId] = useState<string>("")
	const [status, setStatus] = useState<string>("")
	const [usage, setUsage] = useState<any | null>(null)
	const [loading, setLoading] = useState<boolean>(false)

	useEffect(() => {
		;(async () => {
			try {
				const supabase = createClient()
				const {
					data: { user },
				} = await supabase.auth.getUser()
				if (user) setCurrentUserId(user.id)
			} catch (err) {
				console.error("Failed to fetch current user:", err)
			}
		})()
	}, [])

	const getUsage = async (userId: string) => {
		setStatus("")
		setLoading(true)
		try {
			const res = await fetch(`/api/rate-limit?userId=${encodeURIComponent(userId)}`)
			const json = await res.json()
			if (!res.ok) throw new Error(json?.error || res.statusText)
			setUsage(json.data)
			setStatus("Fetched usage")
		} catch (e: any) {
			setStatus(`Failed to fetch usage: ${e?.message || e}`)
			setUsage(null)
		} finally {
			setLoading(false)
		}
	}

	const resetUsage = async (userId: string) => {
		setStatus("")
		setLoading(true)
		try {
			const res = await fetch(`/api/admin/rate-limit`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ action: "reset-user", userId }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json?.error || res.statusText)
			setStatus(`Reset complete for ${userId}`)
			await getUsage(userId)
		} catch (e: any) {
			setStatus(`Failed to reset: ${e?.message || e}`)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-xl font-semibold">Rate Limits</h2>
				<p className="text-sm text-muted-foreground">Inspect and reset per-user daily usage.</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Reset My Usage</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<p className="text-sm text-muted-foreground">
							Reset usage for the currently signed-in admin account.
						</p>
						<div className="flex items-center gap-2">
							<Input value={currentUserId || ""} readOnly />
							<Button disabled={!currentUserId || loading} onClick={() => currentUserId && resetUsage(currentUserId)}>
								Reset
							</Button>
							<Button
								variant="outline"
								disabled={!currentUserId || loading}
								onClick={() => currentUserId && getUsage(currentUserId)}
							>
								Get Usage
							</Button>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Reset By User ID</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<p className="text-sm text-muted-foreground">Enter a user ID to fetch or reset their daily usage.</p>
						<div className="flex items-center gap-2">
							<Input placeholder="User ID" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} />
							<Button disabled={!targetUserId || loading} onClick={() => resetUsage(targetUserId)}>
								Reset
							</Button>
							<Button variant="outline" disabled={!targetUserId || loading} onClick={() => getUsage(targetUserId)}>
								Get Usage
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>

			{status ? <div className="text-sm text-muted-foreground">{status}</div> : null}

			{usage ? (
				<Card>
					<CardHeader>
						<CardTitle>Usage</CardTitle>
					</CardHeader>
					<CardContent>
						<pre className="text-xs whitespace-pre-wrap break-words bg-muted/40 p-3 rounded-md">
{JSON.stringify(usage, null, 2)}
						</pre>
					</CardContent>
				</Card>
			) : null}
		</div>
	)
}


