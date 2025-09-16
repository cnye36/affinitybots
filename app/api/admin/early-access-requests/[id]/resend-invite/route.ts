import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { sendInviteEmail } from "@/lib/sendInviteEmail";
import crypto from "crypto";

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

  if (invite.status !== "invited") {
    return NextResponse.json(
      { error: `Cannot resend invite. Current status: ${invite.status}` },
      { status: 400 }
    );
  }

  // Generate a new invite code and update the record
  const newInviteCode = crypto.randomBytes(8).toString("hex");
  const invitedAt = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from("early_access_invites")
    .update({
      invite_code: newInviteCode,
      invited_at: invitedAt,
      expires_at: null,
      status: "invited",
    })
    .eq("id", id)
    .select("email, name, invite_code")
    .single();

  if (updateError) {
    console.error("Failed to update invite with new code:", updateError);
    return NextResponse.json(
      { error: "Failed to regenerate invite code." },
      { status: 500 }
    );
  }

  try {
    await sendInviteEmail({
      to: updated.email,
      name: updated.name,
      inviteCode: updated.invite_code,
    });
    return NextResponse.json({ message: "Invite email resent with new code." });
  } catch (error) {
    console.error("Failed to resend invite email:", error);
    return NextResponse.json(
      { error: "Failed to resend invite email." },
      { status: 500 }
    );
  }
}
