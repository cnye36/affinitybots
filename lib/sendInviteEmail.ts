/**
 * Send an early access invite email to a user using Resend.
 * @param to Recipient email address
 * @param name Recipient name (optional)
 * @param inviteCode The invite code to include
 */
export async function sendInviteEmail({
  to,
  name,
  inviteCode,
}: {
  to: string;
  name?: string | null;
  inviteCode: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Resend API key is not configured");

  const signupUrl = `${
    process.env.NEXT_PUBLIC_BASE_URL || "https://AffinityBots.com"
  }/signup`;
  // Use 'autocopy' flag instead of 'copy' to avoid HTML entity &copy; being parsed as ©
  const signupWithCodeUrl = `${signupUrl}?inviteCode=${encodeURIComponent(inviteCode)}&autocopy=1`;

  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">You're Invited to Join AffinityBots!</h2>
        <p>Hi${name ? ` ${name}` : ""},</p>
        <p>We're excited to invite you to join <b>AffinityBots</b>! Use the invite code below to sign up for early access:</p>
        <a href="${signupWithCodeUrl}" style="text-decoration: none;">
          <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <span style="font-size: 1.5em; letter-spacing: 2px; font-weight: bold; color: #4F46E5;">${inviteCode}</span>
          </div>
        </a>
        <a href="${signupWithCodeUrl}" style="display: inline-block; background: #4F46E5; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Sign Up Now</a>
        <p style="margin-top: 24px; color: #6B7280; font-size: 0.95em;">If you did not request this invite, you can ignore this email.</p>
        <hr style="margin: 32px 0 16px 0; border: none; border-top: 1px solid #E5E7EB;" />
        <p style="color: #9CA3AF; font-size: 0.85em;">AffinityBots &copy; ${new Date().getFullYear()}</p>
      </div>
    `;

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  
  const { error } = await resend.emails.send({
    from: "AffinityBots <noreply@ai-automated-mailroom.com>",
    to: [to],
    subject: "You're Invited to AffinityBots!",
    html,
    text: `You're invited to join AffinityBots!\nInvite code: ${inviteCode}\nSign up: ${signupWithCodeUrl}`,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
