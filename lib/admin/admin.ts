/**
 * Get list of admin emails from environment variable
 * Supports comma-separated list: ADMIN_EMAILS=email1@example.com,email2@example.com
 */
function getAdminEmails(): string[] {
	const envValue = process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "cnye@affinitybots.com"
	return envValue
		.split(",")
		.map((email) => email.trim().toLowerCase())
		.filter((email) => email.length > 0)
}

/**
 * Check if an email belongs to an admin
 */
export function isAdminEmail(email: string | null | undefined): boolean {
	if (!email) return false
	const normalizedEmail = email.toLowerCase()
	const adminEmails = getAdminEmails()
	return adminEmails.includes(normalizedEmail)
}

/**
 * Get the list of admin emails (for debugging/logging purposes)
 */
export function getAdminEmailList(): string[] {
	return getAdminEmails()
}


