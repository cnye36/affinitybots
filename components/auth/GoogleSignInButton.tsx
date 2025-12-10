"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/supabase/client"

export function GoogleSignInButton() {
	const [isLoading, setIsLoading] = useState(false)

	const handleGoogleSignIn = async () => {
		try {
			setIsLoading(true)
			const supabase = createClient()
			const redirectUrl = `${window.location.origin}/auth/callback?next=/dashboard`
			
			console.log("🔍 Google Sign-In: Initiating OAuth flow")
			console.log("🔍 Google Sign-In: Current origin:", window.location.origin)
			console.log("🔍 Google Sign-In: Redirect URL:", redirectUrl)

			const { data, error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo: redirectUrl,
				},
			})

			if (error) {
				console.error("❌ Google Sign-In: OAuth error:", error)
				setIsLoading(false)
				return
			}

			console.log("✅ Google Sign-In: OAuth flow initiated, redirecting to:", data?.url)
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
			className="w-full"
			onClick={handleGoogleSignIn}
			disabled={isLoading}
		>
			{isLoading ? "Redirecting..." : "Continue with Google"}
		</Button>
	)
}


