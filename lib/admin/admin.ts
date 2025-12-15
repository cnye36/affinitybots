export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "cnye@affinitybots.com").toLowerCase()

export function isAdminEmail(email: string | null | undefined) {
	return (email ?? "").toLowerCase() === ADMIN_EMAIL
}


