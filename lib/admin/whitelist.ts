/**
 * Whitelist system for users who should bypass paywall and get unlimited access
 * but not have admin panel access
 *
 * Separate from admin emails which have full admin panel access
 */

/**
 * Get list of whitelisted emails from environment variable
 * Supports comma-separated list: WHITELIST_EMAILS=email1@example.com,email2@example.com
 */
function getWhitelistEmails(): string[] {
	const envValue = process.env.WHITELIST_EMAILS ?? ""
	return envValue
		.split(",")
		.map((email) => email.trim().toLowerCase())
		.filter((email) => email.length > 0)
}

/**
 * Check if an email is whitelisted for unlimited access
 */
export function isWhitelistedEmail(email: string | null | undefined): boolean {
	if (!email) return false
	const normalizedEmail = email.toLowerCase()
	const whitelistEmails = getWhitelistEmails()
	return whitelistEmails.includes(normalizedEmail)
}

/**
 * Get the list of whitelisted emails (for debugging/logging purposes)
 */
export function getWhitelistEmailList(): string[] {
	return getWhitelistEmails()
}

/**
 * Check if a user should have unlimited access (either admin or whitelisted)
 */
export function hasUnlimitedAccess(email: string | null | undefined): boolean {
	if (!email) return false

	// Check both admin and whitelist
	const adminEmails = process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? ""
	const adminList = adminEmails
		.split(",")
		.map((e) => e.trim().toLowerCase())
		.filter((e) => e.length > 0)

	const normalizedEmail = email.toLowerCase()

	// Check if admin
	if (adminList.includes(normalizedEmail)) {
		return true
	}

	// Check if whitelisted
	return isWhitelistedEmail(email)
}
