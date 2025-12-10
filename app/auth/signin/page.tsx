"use client";

import Link from "next/link";
import { signIn } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Header } from "@/components/home/Header";

function SignInForm() {
	const [error, setError] = useState<string | null>(null);
	const searchParams = useSearchParams();
	const queryError = searchParams.get("error");
	const emailFromQuery = searchParams.get("email") || "";

	const [earlyAccessDialogOpen, setEarlyAccessDialogOpen] = useState(false);

	useEffect(() => {
		const combinedError = error ?? queryError;
		if (combinedError && combinedError.toLowerCase().includes("early access")) {
			setEarlyAccessDialogOpen(true);
		}
	}, [error, queryError]);

	async function handleSignIn(formData: FormData) {
		const result = await signIn(formData);
		if (result?.error) {
			setError(result.error);
		}
	}

	const effectiveError = error ?? queryError;

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
			<Header />
			<div className="flex items-center justify-center min-h-screen pt-24 pb-8 px-4">
				<div className="w-full max-w-md">
				<div className="bg-card border border-border rounded-lg shadow-lg p-8 space-y-6">
					<div className="text-center space-y-2">
						<h2 className="text-3xl font-bold">Sign In</h2>
						<p className="text-sm text-muted-foreground">
							Welcome back! Please sign in to your account.
						</p>
					</div>

					{effectiveError && (
						<Alert variant="destructive">
							<AlertDescription>{effectiveError}</AlertDescription>
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
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input 
								id="password" 
								name="password" 
								type="password" 
								autoComplete="current-password"
								placeholder="Enter your password"
								className="h-11"
							/>
						</div>
						<Button formAction={handleSignIn} className="w-full h-11 text-base">
							Sign In
						</Button>
					</form>

					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-card px-2 text-muted-foreground">
								Or continue with
							</span>
						</div>
					</div>

					<GoogleSignInButton />

					<p className="text-center text-sm text-muted-foreground">
						Don&apos;t have an account?{" "}
						<Link href="/auth/signup" className="text-primary hover:underline font-medium">
							Sign Up
						</Link>
					</p>
				</div>

				<Dialog open={earlyAccessDialogOpen} onOpenChange={setEarlyAccessDialogOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Email not approved for early access</DialogTitle>
							<DialogDescription>
								{effectiveError ??
									"This email address is not currently approved to sign up. You can request early access for this email."}
							</DialogDescription>
						</DialogHeader>
						<div className="mt-4 flex justify-end gap-2">
							<Button
								variant="outline"
								type="button"
								onClick={() => setEarlyAccessDialogOpen(false)}
							>
								Close
							</Button>
							<Link
								href={
									emailFromQuery
										? `/early-access?email=${encodeURIComponent(emailFromQuery)}`
										: "/early-access"
								}
							>
								<Button type="button">
									Request Early Access
								</Button>
							</Link>
						</div>
					</DialogContent>
				</Dialog>
				</div>
			</div>
		</div>
	);
}

export default function SignInPage() {
	return (
		<Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
			<SignInForm />
		</Suspense>
	);
}
