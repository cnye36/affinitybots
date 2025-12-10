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

			await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
				},
			})
			// Redirect is handled by Supabase, no further action needed here
		} catch (error) {
			console.error("Error during Google sign-in:", error)
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


