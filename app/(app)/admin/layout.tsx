import { createClient } from "@/supabase/server"
import { notFound, redirect } from "next/navigation"
import { isAdminEmail } from "@/lib/admin/admin"

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		redirect("/auth/signin")
	}

	if (!isAdminEmail(user.email)) {
		notFound()
	}

	return children
}


