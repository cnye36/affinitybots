"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/supabase/client"
import { SiGithub } from "react-icons/si"

import { useSearchParams } from "next/navigation"

export function GitHubSignInButton() {
	const [isLoading, setIsLoading] = useState(false)
    const searchParams = useSearchParams()
    const plan = searchParams.get("plan")

	const handleGitHubSignIn = async () => {
		try {
			setIsLoading(true)
			const supabase = createClient()
			const currentOrigin = window.location.origin
			// IMPORTANT: redirectTo must EXACTLY match an entry in Supabase's redirect URLs list
			// Don't include query params here - Supabase does exact matching
			const redirectUrl = `${currentOrigin}/auth/callback`
			
			console.log("🔍 GitHub Sign-In: Initiating OAuth flow")
			console.log("🔍 GitHub Sign-In: Current origin:", currentOrigin)
			console.log("🔍 GitHub Sign-In: Redirect URL (must match Supabase config exactly):", redirectUrl)

            const next = plan ? `/pricing/checkout?plan=${plan}` : "/dashboard"

			const { data, error } = await supabase.auth.signInWithOAuth({
				provider: "github",
				options: {
					redirectTo: redirectUrl,
					queryParams: {
						next,
					},
				},
			})

			if (error) {
				console.error("❌ GitHub Sign-In: OAuth error:", error)
				setIsLoading(false)
				return
			}

			console.log("✅ GitHub Sign-In: OAuth flow initiated, redirecting to:", data?.url)
			console.log("🔍 GitHub Sign-In: Full redirect URL from Supabase:", data?.url)
			// Redirect is handled by Supabase, no further action needed here
		} catch (error) {
			console.error("❌ GitHub Sign-In: Unexpected error:", error)
			setIsLoading(false)
		}
	}

	return (
		<Button
			type="button"
			variant="outline"
			className="w-full gap-2"
			onClick={handleGitHubSignIn}
			disabled={isLoading}
		>
			<SiGithub className="h-5 w-5" />
			{isLoading ? "Redirecting..." : "Continue with GitHub"}
		</Button>
	)
}
