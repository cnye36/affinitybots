"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Key, ExternalLink } from "lucide-react"
import type { OfficialMcpServerMeta } from "@/lib/mcp/officialMcpServers"

interface ApiKeyModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	server: OfficialMcpServerMeta
	onSuccess?: () => void
}

export function ApiKeyModal({ open, onOpenChange, server, onSuccess }: ApiKeyModalProps) {
	const [apiKey, setApiKey] = useState("")
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setLoading(true)
		setError(null)

		try {
			const response = await fetch("/api/mcp/servers/configure", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					serverSlug: server.serverName,
					apiKey,
				}),
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || "Failed to configure server")
			}

			onSuccess?.()
			onOpenChange(false)
			setApiKey("")
		} catch (err: any) {
			setError(err.message || String(err))
		} finally {
			setLoading(false)
		}
	}

	function handleClose() {
		if (!loading) {
			onOpenChange(false)
			setApiKey("")
			setError(null)
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Key className="h-5 w-5" />
						Configure {server.displayName}
					</DialogTitle>
					<DialogDescription>
						Enter your API key to connect to {server.displayName}. Your key will be stored securely.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="apiKey">API Key</Label>
						<Input
							id="apiKey"
							type="password"
							placeholder="Enter your API key..."
							value={apiKey}
							onChange={(e) => setApiKey(e.target.value)}
							disabled={loading}
							required
							className="font-mono"
						/>
						{server.docsUrl && (
							<p className="text-xs text-muted-foreground">
								Need an API key?{" "}
								<a
									href={server.docsUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary hover:underline inline-flex items-center gap-1"
								>
									View documentation
									<ExternalLink className="h-3 w-3" />
								</a>
							</p>
						)}
					</div>

					{error && (
						<div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
							{error}
						</div>
					)}

					<DialogFooter>
						<Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
							Cancel
						</Button>
						<Button type="submit" disabled={loading || !apiKey.trim()}>
							{loading ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Connecting...
								</>
							) : (
								"Connect Server"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
