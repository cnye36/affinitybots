import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface EarlyAccessRequest {
  email: string;
  name: string;
  purpose: string;
  experience: string;
  organization: string;
  expectations: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EarlyAccessRequest;

    // Validate required fields
    if (!body.email || !body.name || !body.purpose || !body.experience) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Store the request in the database (you may implement this later)
    // For now, we'll just send the email notification

    // Send email notification
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.error("SendGrid API key is not configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    // Recipient email from environment variable
    const notificationEmail = process.env.NOTIFICATION_EMAIL;
    if (!notificationEmail) {
      console.error("Notification email is not configured");
      return NextResponse.json(
        { error: "Notification email not configured" },
        { status: 500 }
      );
    }

    // Format email content
    const emailData = {
      to: notificationEmail,
      from: process.env.FROM_EMAIL || notificationEmail, // Use FROM_EMAIL env var or fall back to notification email
      subject: "New Early Access Request - AgentHub",
      text: `
New early access request from ${body.name} (${body.email})

Details:
- Experience: ${body.experience}
- Organization: ${body.organization || "Not specified"}
- Purpose: ${body.purpose}
- Features interested in: ${body.expectations || "Not specified"}
      `,
      html: `
<h2>New Early Access Request</h2>
<p><strong>From:</strong> ${body.name} (${body.email})</p>
<h3>Details:</h3>
<ul>
  <li><strong>Experience:</strong> ${body.experience}</li>
  <li><strong>Organization:</strong> ${
    body.organization || "Not specified"
  }</li>
  <li><strong>Purpose:</strong> ${body.purpose}</li>
  <li><strong>Features interested in:</strong> ${
    body.expectations || "Not specified"
  }</li>
</ul>
      `,
    };

    // Send the email with SendGrid
    const sgMail = await import("@sendgrid/mail");
    sgMail.default.setApiKey(apiKey);
    await sgMail.default.send(emailData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing early access request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
