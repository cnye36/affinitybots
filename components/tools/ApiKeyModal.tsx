"use client"

import { useState, useEffect } from "react"
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
	const [configFields, setConfigFields] = useState<Record<string, string>>({})
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Initialize config fields when modal opens or server changes
	useEffect(() => {
		if (open && server.configFields) {
			const initialFields: Record<string, string> = {}
			server.configFields.forEach((field) => {
				initialFields[field.key] = ""
			})
			setConfigFields(initialFields)
		}
	}, [open, server])

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setLoading(true)
		setError(null)

		try {
			const requestBody: {
				serverSlug: string
				apiKey?: string
				config: Record<string, string>
			} = {
				serverSlug: server.serverName,
				config: configFields,
			}

			// Only include API key if authType is not "none"
			if (server.authType !== "none") {
				requestBody.apiKey = apiKey
			}

			const response = await fetch("/api/mcp/servers/configure", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requestBody),
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || "Failed to configure server")
			}

			onSuccess?.()
			onOpenChange(false)
			setApiKey("")
			setConfigFields({})
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
			setConfigFields({})
			setError(null)
		}
	}

	function handleConfigFieldChange(key: string, value: string) {
		setConfigFields((prev) => ({
			...prev,
			[key]: value,
		}))
	}

	// Validate that all required config fields are filled
	const isFormValid = () => {
		// For "none" authType, only check config fields
		if (server.authType === "none") {
			if (server.configFields) {
				for (const field of server.configFields) {
					if (field.required && !configFields[field.key]?.trim()) {
						return false
					}
				}
			}
			return true
		}
		// For other auth types, require API key
		if (!apiKey.trim()) return false
		if (server.configFields) {
			for (const field of server.configFields) {
				if (field.required && !configFields[field.key]?.trim()) {
					return false
				}
			}
		}
		return true
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
						{server.authType === "none"
							? `Configure ${server.displayName}. No authentication required.`
							: `Enter your API key to connect to ${server.displayName}. Your key will be stored securely.`}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					{server.authType !== "none" && (
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
					)}

					{server.configFields && server.configFields.length > 0 && (
						<div className="space-y-4 pt-2 border-t">
							{server.configFields.map((field) => (
								<div key={field.key} className="space-y-2">
									<Label htmlFor={field.key}>
										{field.label}
										{field.required && <span className="text-destructive ml-1">*</span>}
									</Label>
									<Input
										id={field.key}
										type={field.type || "text"}
										placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
										value={configFields[field.key] || ""}
										onChange={(e) => handleConfigFieldChange(field.key, e.target.value)}
										disabled={loading}
										required={field.required}
									/>
									{field.description && (
										<p className="text-xs text-muted-foreground">{field.description}</p>
									)}
								</div>
							))}
						</div>
					)}

					{error && (
						<div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
							{error}
						</div>
					)}

					<DialogFooter>
						<Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
							Cancel
						</Button>
						<Button type="submit" disabled={loading || !isFormValid()}>
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
