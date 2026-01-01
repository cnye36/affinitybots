import { Resend } from "resend"
import { getAdminEmailList } from "./admin"

/**
 * Send email notification to admin when a new user signs up
 */
export async function notifyAdminOfNewSignup(userEmail: string, userId: string): Promise<void> {
	const resendApiKey = process.env.RESEND_API_KEY
	if (!resendApiKey) {
		console.error("RESEND_API_KEY not configured - cannot send admin notification")
		return
	}

	const adminEmails = getAdminEmailList()
	if (adminEmails.length === 0) {
		console.warn("No admin emails configured - skipping admin notification")
		return
	}

	const resend = new Resend(resendApiKey)

	const safe = (v?: string) =>
		v
			? v
					.replace(/&/g, "&amp;")
					.replace(/</g, "&lt;")
					.replace(/>/g, "&gt;")
					.replace(/"/g, "&quot;")
					.replace(/'/g, "&#39;")
			: ""

	const signupTime = new Date().toLocaleString()
	const signupTimeIso = new Date().toISOString()

	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px;">
			<h2 style="margin: 0 0 12px;">New User Signup</h2>
			<div style="background:#f6f7f9; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px;">
				<p style="margin: 4px 0;"><strong>Email:</strong> ${safe(userEmail)}</p>
				<p style="margin: 4px 0;"><strong>User ID:</strong> ${safe(userId)}</p>
				<p style="margin: 4px 0;"><strong>Signed up:</strong> ${signupTime}</p>
			</div>
			<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
				<p style="margin: 0; font-size: 14px; color: #6b7280;">
					View this user in the <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://affinitybots.com"}/admin" style="color: #3b82f6; text-decoration: underline;">Admin Dashboard</a>
				</p>
			</div>
		</div>
	`

	const text = `New User Signup\n\nEmail: ${userEmail}\nUser ID: ${userId}\nSigned up: ${signupTimeIso}\n\nView this user in the Admin Dashboard: ${process.env.NEXT_PUBLIC_BASE_URL || "https://affinitybots.com"}/admin`

	try {
		const { error } = await resend.emails.send({
			from: "AffinityBots <noreply@ai-automated-mailroom.com>",
			to: adminEmails,
			subject: "New User Signup - AffinityBots",
			html,
			text,
		})

		if (error) {
			console.error("Error sending admin signup notification:", error)
		} else {
			console.log(`Admin notification sent for new signup: ${userEmail}`)
		}
	} catch (err) {
		console.error("Failed to send admin signup notification:", err)
		// Don't throw - we don't want to fail the signup if notification fails
	}
}

