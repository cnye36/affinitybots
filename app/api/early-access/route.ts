import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/supabase/server";

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

    const supabase = await createClient();

    // Store the request in the database
    const { data: existingRequest, error: selectError } = await supabase
      .from("early_access_invites")
      .select("id")
      .eq("email", body.email)
      .maybeSingle();

    if (selectError && selectError.code !== "PGRST116") {
      // PGRST116: Row not found, which is fine
      console.error("Error checking for existing request:", selectError);
      return NextResponse.json(
        { error: "Database error checking request" },
        { status: 500 }
      );
    }

    if (existingRequest) {
      return NextResponse.json(
        { message: "You have already requested early access." },
        { status: 200 }
      );
    }

    const { error: insertError } = await supabase
      .from("early_access_invites")
      .insert([
        {
          email: body.email,
          name: body.name,
          // status will default to 'requested'
          // You can add other fields from EarlyAccessRequest here if you add them to your table
        },
      ]);

    if (insertError) {
      console.error("Error inserting early access request:", insertError);
      // Check for unique constraint violation (duplicate email)
      if (insertError.code === "23505") {
        // PostgreSQL unique_violation
        return NextResponse.json(
          { message: "You have already requested early access." },
          { status: 200 }
        ); // Or 409 Conflict
      }
      return NextResponse.json(
        { error: "Failed to save request to database" },
        { status: 500 }
      );
    }

    // Send email notification via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("Resend API key is not configured");
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
    const fromEmail = process.env.FROM_EMAIL || "cnye@ai-automated-mailroom.com";
    const subject = "New Early Access Request - AgentHub";
    const text = `
New early access request from ${body.name} (${body.email})

Details:
- Experience: ${body.experience}
- Organization: ${body.organization || "Not specified"}
- Purpose: ${body.purpose}
- Features interested in: ${body.expectations || "Not specified"}
    `;
    const html = `
<h2>New Early Access Request</h2>
<p><strong>From:</strong> ${body.name} (${body.email})</p>
<h3>Details:</h3>
<ul>
  <li><strong>Experience:</strong> ${body.experience}</li>
  <li><strong>Organization:</strong> ${body.organization || "Not specified"}</li>
  <li><strong>Purpose:</strong> ${body.purpose}</li>
  <li><strong>Features interested in:</strong> ${body.expectations || "Not specified"}</li>
</ul>
    `;

    const { Resend } = await import("resend");
    const resend = new Resend(resendApiKey);
    const { error: resendError } = await resend.emails.send({
      from: `AgentHub <${fromEmail}>`,
      to: [notificationEmail],
      subject,
      text,
      html,
    });

    if (resendError) {
      console.error("Error sending email via Resend:", resendError);
      return NextResponse.json(
        { error: "Failed to send notification email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Thank you for your request! We will be in touch.",
    });
  } catch (error) {
    console.error("Error processing early access request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
