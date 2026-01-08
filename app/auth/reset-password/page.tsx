"use client"

import Link from "next/link"
import { resetPassword } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useState, useEffect } from "react"
import { Header } from "@/components/home/Header"
import { createBrowserClient } from "@supabase/ssr"

export default function ResetPasswordPage() {
	const [error, setError] = useState<string | null>(null)
	const [password, setPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

	useEffect(() => {
		const supabase = createBrowserClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
		)

		supabase.auth.getSession().then(({ data: { session } }) => {
			setIsValidSession(!!session)
		})
	}, [])

	async function handleResetPassword(formData: FormData) {
		setError(null)

		if (password !== confirmPassword) {
			setError("Passwords do not match.")
			return
		}

		if (password.length < 6) {
			setError("Password must be at least 6 characters.")
			return
		}

		const result = await resetPassword(formData)

		if (result?.error) {
			setError(result.error)
		}
	}

	if (isValidSession === null) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
				<Header />
				<div className="flex items-center justify-center min-h-screen pt-24 pb-8 px-4">
					<div className="w-full max-w-md">
						<div className="bg-card border border-border rounded-lg shadow-lg p-8">
							<p className="text-center text-muted-foreground">Loading...</p>
						</div>
					</div>
				</div>
			</div>
		)
	}

	if (!isValidSession) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
				<Header />
				<div className="flex items-center justify-center min-h-screen pt-24 pb-8 px-4">
					<div className="w-full max-w-md">
						<div className="bg-card border border-border rounded-lg shadow-lg p-8 space-y-6">
							<div className="text-center space-y-2">
								<h2 className="text-3xl font-bold">Invalid or Expired Link</h2>
								<p className="text-sm text-muted-foreground">
									This password reset link is invalid or has expired. Please request a new one.
								</p>
							</div>
							<div className="space-y-2">
								<Link href="/auth/forgot-password">
									<Button className="w-full h-11 text-base">
										Request New Link
									</Button>
								</Link>
								<Link href="/auth/signin">
									<Button variant="outline" className="w-full h-11 text-base">
										Back to Sign In
									</Button>
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
			<Header />
			<div className="flex items-center justify-center min-h-screen pt-24 pb-8 px-4">
				<div className="w-full max-w-md">
					<div className="bg-card border border-border rounded-lg shadow-lg p-8 space-y-6">
						<div className="text-center space-y-2">
							<h2 className="text-3xl font-bold">Reset Password</h2>
							<p className="text-sm text-muted-foreground">
								Enter your new password below.
							</p>
						</div>

						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<form className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="password">New Password</Label>
								<Input
									id="password"
									name="password"
									type="password"
									autoComplete="new-password"
									placeholder="Enter your new password"
									className="h-11"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									minLength={6}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="confirmPassword">Confirm Password</Label>
								<Input
									id="confirmPassword"
									name="confirmPassword"
									type="password"
									autoComplete="new-password"
									placeholder="Confirm your new password"
									className="h-11"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									required
									minLength={6}
								/>
							</div>
							<Button formAction={handleResetPassword} className="w-full h-11 text-base">
								Reset Password
							</Button>
						</form>

						<p className="text-center text-sm text-muted-foreground">
							Remember your password?{" "}
							<Link href="/auth/signin" className="text-primary hover:underline font-medium">
								Sign In
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}
