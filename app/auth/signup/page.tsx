"use client";

import Link from "next/link";
import { signUp } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Header } from "@/components/home/Header";

function SignUpForm() {
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [email, setEmail] = useState("");
	const searchParams = useSearchParams();
	const queryError = searchParams.get("error");

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
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
			<Header />
			<div className="flex items-center justify-center min-h-screen pt-24 pb-8 px-4">
				<div className="w-full max-w-md">
				<div className="bg-card border border-border rounded-lg shadow-lg p-8 space-y-6">
					<div className="text-center space-y-2">
						<h2 className="text-3xl font-bold">Sign Up</h2>
						<p className="text-sm text-muted-foreground">
							Create your account to get started with AffinityBots.
						</p>
					</div>

					{effectiveError && (
						<Alert variant="destructive">
							<AlertDescription>{effectiveError}</AlertDescription>
						</Alert>
					)}

					<form className="space-y-4">
						<div className="space-y-2">
                            <input type="hidden" name="plan" value={searchParams.get("plan") || ""} />
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								autoComplete="email"
								placeholder="you@example.com"
								className="h-11"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<div className="relative">
								<Input
									id="password"
									name="password"
									type={showPassword ? "text" : "password"}
									className="pr-10 h-11"
									minLength={6}
									autoComplete="new-password"
									placeholder="Create a password"
								/>
								<button
									type="button"
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
									onClick={() => setShowPassword(!showPassword)}
									aria-label={showPassword ? "Hide password" : "Show password"}
								>
									{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
								</button>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Confirm Password</Label>
							<Input
								id="confirmPassword"
								name="confirmPassword"
								type="password"
								autoComplete="new-password"
								placeholder="Confirm your password"
								className="h-11"
							/>
						</div>

						<Button formAction={handleSignUp} className="w-full h-11 text-base">
							Sign Up
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
						Already have an account?{" "}
						<Link href={searchParams.get("plan") ? `/auth/signin?plan=${searchParams.get("plan")}` : "/auth/signin"} className="text-primary hover:underline font-medium">
							Sign In
						</Link>
					</p>
				</div>
				</div>
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
