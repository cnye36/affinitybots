"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/supabase/client"
import { AIUsageMonitor } from "@/components/AIUsageMonitor"

export function AIUsageWrapper() {
	const [userId, setUserId] = useState<string | undefined>()

	useEffect(() => {
		async function getUserId() {
			try {
				const supabase = createClient()
				const {
					data: { user },
				} = await supabase.auth.getUser()
				if (user) {
					setUserId(user.id)
				}
			} catch (err) {
				console.error("Error getting user ID:", err)
			}
		}
		getUserId()
	}, [])

	if (!userId) {
		return null
	}

	return <AIUsageMonitor userId={userId} />
}
