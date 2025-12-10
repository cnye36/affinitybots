"use client";

import Link from "next/link";
import { signUp } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

function SignUpForm() {
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [email, setEmail] = useState("");
	const [earlyAccessDialogOpen, setEarlyAccessDialogOpen] = useState(false);
	const searchParams = useSearchParams();
	const queryError = searchParams.get("error");

	useEffect(() => {
		const combinedError = error ?? queryError;
		if (combinedError && combinedError.toLowerCase().includes("early access")) {
			setEarlyAccessDialogOpen(true);
		}
	}, [error, queryError]);

	async function handleSignUp(formData: FormData) {
		const password = formData.get("password") as string;
		const confirmPassword = formData.get("confirmPassword") as string;

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		const result = await signUp(formData);
		if (result?.error) {
			setError(result.error);
		}
		// On success, the action will redirect to the verification page
	}

	const effectiveError = error ?? queryError;

	return (
		<div className="min-h-screen flex items-center justify-center bg-background">
			<div className="w-full max-w-md">
				<h2 className="text-3xl font-bold text-center mb-6">Sign Up</h2>
				<form className="space-y-4">
					{effectiveError && (
						<Alert variant="destructive">
							<AlertDescription>{effectiveError}</AlertDescription>
						</Alert>
					)}
					<div>
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							name="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							autoComplete="email"
						/>
					</div>
					<div>
						<Label htmlFor="password">Password</Label>
						<div className="relative">
							<Input
								id="password"
								name="password"
								type={showPassword ? "text" : "password"}
								className="pr-10"
								minLength={6}
								autoComplete="new-password"
							/>
							<button
								type="button"
								className="absolute right-3 top-1/2 -translate-y-1/2"
								onClick={() => setShowPassword(!showPassword)}
							>
								{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
							</button>
						</div>
					</div>
					<div>
						<Label htmlFor="confirmPassword">Confirm Password</Label>
						<Input
							id="confirmPassword"
							name="confirmPassword"
							type="password"
							autoComplete="new-password"
						/>
					</div>

					<Button formAction={handleSignUp} className="w-full">
						Sign Up
					</Button>
				</form>

				<div className="mt-6">
					<div className="relative my-4">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-background px-2 text-muted-foreground">
								Or continue with
							</span>
						</div>
					</div>
					<GoogleSignInButton />
				</div>

				<p className="mt-4 text-center">
					Already have an account?{" "}
					<Link href="/auth/signin" className="text-primary hover:underline">
						Sign In
					</Link>
				</p>

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
								type="button"
								variant="outline"
								onClick={() => setEarlyAccessDialogOpen(false)}
							>
								Close
							</Button>
							<Link
								href={
									email
										? `/early-access?email=${encodeURIComponent(email)}`
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
	);
}

export default function SignUpPage() {
	return (
		<Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
			<SignUpForm />
		</Suspense>
	);
}
