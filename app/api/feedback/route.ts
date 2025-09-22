import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Resend } from "resend";

type FeedbackBody = {
name?: string;
email?: string;
subject?: string;
message?: string;
};

export async function POST(request: NextRequest) {
try {
const body = (await request.json()) as FeedbackBody;

const message = (body.message || "").trim();
if (!message) {
return NextResponse.json(
{ error: "Message is required" },
{ status: 400 }
);
}

const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
console.error("RESEND_API_KEY not configured");
return NextResponse.json(
{ error: "Email service not configured" },
{ status: 500 }
);
}

const resend = new Resend(resendApiKey);

const toEmail = "support@affinitybots.com";

const subject = body.subject?.trim() || "New User Feedback";

const safe = (v?: string) =>
v
? v
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, "&#39;")
: "";

const html = `
  <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px;">
    <h2 style="margin: 0 0 12px;">New User Feedback</h2>
    <div style="background:#f6f7f9; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px;">
      <p style="margin: 4px 0;"><strong>Name:</strong> ${safe(body.name) || "(not provided)"}</p>
      <p style="margin: 4px 0;"><strong>Email:</strong> ${safe(body.email) || "(not provided)"}</p>
      <p style="margin: 4px 0;"><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
    </div>
    ${body.subject ? `<p style="margin:0 0 8px;"><strong>Subject:</strong> ${safe(body.subject)}</p>` : ""}
    <div style="white-space:pre-wrap; background:white; border:1px solid #e5e7eb; padding:16px; border-radius:8px;">${safe(message)}</div>
  </div>
`;

const text = `New User Feedback\n\nName: ${body.name || "(not provided)"}\nEmail: ${body.email || "(not provided)"}\nSubmitted: ${new Date().toISOString()}\n${body.subject ? `Subject: ${body.subject}\n` : ""}\n${message}`;

const { error } = await resend.emails.send({
from: "AffinityBots <noreply@ai-automated-mailroom.com>",
to: [toEmail],
subject,
html,
text,
});

if (error) {
console.error("Error sending feedback via Resend:", error);
return NextResponse.json(
{ error: "Failed to send feedback" },
{ status: 500 }
);
}

return NextResponse.json({ success: true });
} catch (err) {
console.error("/api/feedback error:", err);
return NextResponse.json(
{ error: "Unexpected error" },
{ status: 500 }
);
}
}


