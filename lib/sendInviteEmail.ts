/**
 * Send an early access invite email to a user using SendGrid.
 * @param to Recipient email address
 * @param name Recipient name (optional)
 * @param inviteCode The invite code to include
 * @param expiresAt Expiry date (Date or ISO string)
 */
export async function sendInviteEmail({
  to,
  name,
  inviteCode,
  expiresAt,
}: {
  to: string;
  name?: string | null;
  inviteCode: string;
  expiresAt: string | Date;
}) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error("SendGrid API key is not configured");

  const from = process.env.FROM_EMAIL || process.env.NOTIFICATION_EMAIL;
  if (!from)
    throw new Error("FROM_EMAIL or NOTIFICATION_EMAIL is not configured");

  const signupUrl = `${
    process.env.NEXT_PUBLIC_BASE_URL || "https://agenthub.click"
  }/signup`;

  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">You're Invited to Join AgentHub!</h2>
        <p>Hi${name ? ` ${name}` : ""},</p>
        <p>We're excited to invite you to join <b>AgentHub</b>! Use the invite code below to sign up for early access:</p>
        <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
          <span style="font-size: 1.5em; letter-spacing: 2px; font-weight: bold; color: #4F46E5;">${inviteCode}</span>
        </div>
        <p><b>Expires:</b> ${new Date(expiresAt).toLocaleString()}</p>
        <a href="${signupUrl}" style="display: inline-block; background: #4F46E5; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Sign Up Now</a>
        <p style="margin-top: 24px; color: #6B7280; font-size: 0.95em;">If you did not request this invite, you can ignore this email.</p>
        <hr style="margin: 32px 0 16px 0; border: none; border-top: 1px solid #E5E7EB;" />
        <p style="color: #9CA3AF; font-size: 0.85em;">AgentHub &copy; ${new Date().getFullYear()}</p>
      </div>
    `;

  const sgMail = await import("@sendgrid/mail");
  sgMail.default.setApiKey(apiKey);
  await sgMail.default.send({
    to,
    from,
    subject: "You're Invited to AgentHub!",
    html,
    text: `You're invited to join AgentHub!\nInvite code: ${inviteCode}\nExpires: ${new Date(
      expiresAt
    ).toLocaleString()}\nSign up: ${signupUrl}`,
  });
}
