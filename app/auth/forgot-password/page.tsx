"use client"

import Link from "next/link"
import { forgotPassword } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useState } from "react"
import { Header } from "@/components/home/Header"

export default function ForgotPasswordPage() {
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)
	const [email, setEmail] = useState("")

	async function handleForgotPassword(formData: FormData) {
		setError(null)
		const result = await forgotPassword(formData)

		if (result?.error) {
			setError(result.error)
		} else if (result?.success) {
			setSuccess(true)
		}
	}

	if (success) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
				<Header />
				<div className="flex items-center justify-center min-h-screen pt-24 pb-8 px-4">
					<div className="w-full max-w-md">
						<div className="bg-card border border-border rounded-lg shadow-lg p-8 space-y-6">
							<div className="text-center space-y-2">
								<h2 className="text-3xl font-bold">Check Your Email</h2>
								<p className="text-sm text-muted-foreground">
									We&apos;ve sent a password reset link to <strong>{email}</strong>.
									Please check your inbox and follow the instructions to reset your password.
								</p>
							</div>
							<div className="text-center">
								<Link href="/auth/signin" className="text-primary hover:underline font-medium">
									Back to Sign In
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
							<h2 className="text-3xl font-bold">Forgot Password</h2>
							<p className="text-sm text-muted-foreground">
								Enter your email address and we&apos;ll send you a link to reset your password.
							</p>
						</div>

						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<form className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									name="email"
									type="email"
									autoComplete="email"
									placeholder="you@example.com"
									className="h-11"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
								/>
							</div>
							<Button formAction={handleForgotPassword} className="w-full h-11 text-base">
								Send Reset Link
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
