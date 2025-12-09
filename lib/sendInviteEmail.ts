/**
 * Send an early access invite email to a user using Resend.
 * @param to Recipient email address
 * @param name Recipient name (optional)
 * @param inviteCode The invite code to include
 */
export async function sendInviteEmail({
  to,
  name,
}: {
  to: string;
  name?: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Resend API key is not configured");

  const signupUrl = `${
    process.env.NEXT_PUBLIC_BASE_URL || "https://AffinityBots.com"
  }/auth/signup`;

  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">You're In! Welcome to AffinityBots!</h2>
        <p>Hi${name ? ` ${name}` : ""},</p>
        <p>Great news! Your request for early access has been <b>approved</b>.</p>
        <p>You can now sign up and start building agents immediately using the email address <b>${to}</b>.</p>
        
        <a href="${signupUrl}" style="display: inline-block; background: #4F46E5; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 24px 0;">Sign Up Now</a>
        
        <p style="margin-top: 24px; color: #6B7280; font-size: 0.95em;">If you did not request early access, you can ignore this email.</p>
        <hr style="margin: 32px 0 16px 0; border: none; border-top: 1px solid #E5E7EB;" />
        <p style="color: #9CA3AF; font-size: 0.85em;">AffinityBots &copy; ${new Date().getFullYear()}</p>
      </div>
    `;

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  
  const { error } = await resend.emails.send({
    from: "AffinityBots <noreply@ai-automated-mailroom.com>",
    to: [to],
    subject: "Your Access to AffinityBots is Approved!",
    html,
    text: `You're approved to join AffinityBots!\nSign up here with your email: ${signupUrl}`,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
