import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { sendInviteEmail } from "@/lib/sendInviteEmail";

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  if (!id) {
    return NextResponse.json(
      { error: "Request ID is required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Fetch the invite record
  const { data: invite, error: fetchError } = await supabase
    .from("early_access_invites")
    .select("id, email, name, invite_code, status")
    .eq("id", id)
    .single();

  if (fetchError || !invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.status !== "invited" && invite.status !== "approved") {
    return NextResponse.json(
      { error: `Cannot resend allow access email. Current status: ${invite.status}` },
      { status: 400 }
    );
  }

  // Refresh invited_at
  const invitedAt = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from("early_access_invites")
    .update({
      invited_at: invitedAt,
      expires_at: null, // ensure no expiry
      // Keep existing status (invited or approved) or normalize to approved?
      // Let's normalize to approved if we are resending
      status: "approved",
    })
    .eq("id", id)
    .select("email, name")
    .single();

  if (updateError) {
    console.error("Failed to update invite on resend:", updateError);
    return NextResponse.json(
      { error: "Failed to update invite for resend." },
      { status: 500 }
    );
  }

  try {
    await sendInviteEmail({
      to: updated.email,
      name: updated.name,
    });
    return NextResponse.json({ message: "Approval email resent." });
  } catch (error) {
    console.error("Failed to resend invite email:", error);
    return NextResponse.json(
      { error: "Failed to resend invite email." },
      { status: 500 }
    );
  }
}
