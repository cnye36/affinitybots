import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/supabase/server";
import { Resend } from "resend";

interface EarlyAccessRequest {
  email: string;
  name: string;
  organization: string;
  expectations: string;
  newsletter: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EarlyAccessRequest;

    // Validate required fields
    if (!body.email || !body.name) {
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
          organization: body.organization || null,
          expectations: body.expectations || null,
          newsletter: body.newsletter,
          // status will default to 'requested'
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

    // Initialize Resend client
    const resend = new Resend(resendApiKey);
    
    // Send email using HTML content
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
          New Early Access Request - AffinityBots
        </h1>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #007bff; margin-top: 0;">Applicant Details</h2>
          <p><strong>Name:</strong> ${body.name}</p>
          <p><strong>Email:</strong> ${body.email}</p>
          ${body.organization ? `<p><strong>Organization:</strong> ${body.organization}</p>` : ''}
          <p><strong>Newsletter Opt-in:</strong> ${body.newsletter ? 'Yes' : 'No'}</p>
        </div>

        <div style="background-color: #e9ecef; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #495057; margin-top: 0;">Expectations</h3>
          ${body.expectations ? `
            <div>
              <p><strong>Features of Interest:</strong></p>
              <p style="background-color: white; padding: 15px; border-radius: 4px; border-left: 4px solid #007bff;">
                ${body.expectations}
              </p>
            </div>
          ` : ''}
        </div>

        <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
          <p style="margin: 0; color: #6c757d;">
            This request was submitted through the AffinityBots early access form.
          </p>
          <p style="margin: 10px 0 0 0; color: #6c757d; font-size: 14px;">
            Timestamp: ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
    `;

    // Send notification email to admin
    const { error: notificationError } = await resend.emails.send({
      from: "AffinityBots <noreply@ai-automated-mailroom.com>",
      to: [notificationEmail],
      subject: "New Early Access Request - AffinityBots",
      html,
    });

    if (notificationError) {
      console.error("Error sending notification email via Resend:", notificationError);
      return NextResponse.json(
        { error: "Failed to send notification email" },
        { status: 500 }
      );
    }

    // Send confirmation email to the applicant
    const confirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
          Early Access Request Received - AffinityBots
        </h1>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #007bff; margin-top: 0;">Thank you for your interest!</h2>
          <p>Hi ${body.name},</p>
          <p>We've received your early access request for <strong>AffinityBots</strong>. Here's what we received:</p>
          <ul>
            <li><strong>Name:</strong> ${body.name}</li>
            <li><strong>Email:</strong> ${body.email}</li>
            ${body.organization ? `<li><strong>Organization:</strong> ${body.organization}</li>` : ''}
            <li><strong>Newsletter Opt-in:</strong> ${body.newsletter ? 'Yes' : 'No'}</li>
          </ul>
        </div>

        <div style="background-color: #e9ecef; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #495057; margin-top: 0;">What happens next?</h3>
          <p>We're currently rolling out early access to users gradually to ensure the best experience for everyone. Our team will review your request and you'll receive an invite code via email when it's your turn to join.</p>
          <p><strong>Please note:</strong> Due to high demand, it may take a few weeks before you receive your invite. We appreciate your patience!</p>
          <p>In the meantime, keep an eye on your inbox for updates from us.</p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
         
          <p style="margin: 10px 0 0 0; color: #6c757d; font-size: 14px;">
            Submitted on: ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
    `;

    const { error: confirmationError } = await resend.emails.send({
      from: "AffinityBots <noreply@ai-automated-mailroom.com>",
      to: [body.email],
      subject: "Early Access Request Received - AffinityBots",
      html: confirmationHtml,
    });

    if (confirmationError) {
      console.error("Error sending confirmation email via Resend:", confirmationError);
      // Don't fail the request if confirmation email fails, just log it
      console.warn("Failed to send confirmation email, but request was saved successfully");
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
