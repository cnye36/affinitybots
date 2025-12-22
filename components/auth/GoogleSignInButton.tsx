"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/supabase/client"
import { SiGoogle } from "react-icons/si"

export function GoogleSignInButton() {
	const [isLoading, setIsLoading] = useState(false)

	const handleGoogleSignIn = async () => {
		try {
			setIsLoading(true)
			const supabase = createClient()
			const currentOrigin = window.location.origin
			// IMPORTANT: redirectTo must EXACTLY match an entry in Supabase's redirect URLs list
			// Don't include query params here - Supabase does exact matching
			const redirectUrl = `${currentOrigin}/auth/callback`
			
			console.log("🔍 Google Sign-In: Initiating OAuth flow")
			console.log("🔍 Google Sign-In: Current origin:", currentOrigin)
			console.log("🔍 Google Sign-In: Redirect URL (must match Supabase config exactly):", redirectUrl)

			const { data, error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo: redirectUrl,
					// Force Google to show account selection screen every time
					queryParams: {
						next: "/dashboard",
						prompt: "select_account",
					},
				},
			})

			if (error) {
				console.error("❌ Google Sign-In: OAuth error:", error)
				setIsLoading(false)
				return
			}

			console.log("✅ Google Sign-In: OAuth flow initiated, redirecting to:", data?.url)
			console.log("🔍 Google Sign-In: Full redirect URL from Supabase:", data?.url)
			// Redirect is handled by Supabase, no further action needed here
		} catch (error) {
			console.error("❌ Google Sign-In: Unexpected error:", error)
			setIsLoading(false)
		}
	}

	return (
		<Button
			type="button"
			variant="outline"
			className="w-full gap-2"
			onClick={handleGoogleSignIn}
			disabled={isLoading}
		>
			<SiGoogle className="h-5 w-5" />
			{isLoading ? "Redirecting..." : "Continue with Google"}
		</Button>
	)
}


