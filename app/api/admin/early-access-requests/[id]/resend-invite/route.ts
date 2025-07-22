import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { sendInviteEmail } from "@/lib/sendInviteEmail";
import logger from "@/lib/logger";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    .select("id, email, name, invite_code, status, expires_at")
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

  try {
    await sendInviteEmail({
      to: invite.email,
      name: invite.name,
      inviteCode: invite.invite_code,
      expiresAt: invite.expires_at,
    });
    return NextResponse.json({ message: "Invite email resent successfully." });
  } catch (error) {
    logger.error("Failed to resend invite email:", error);
    return NextResponse.json(
      { error: "Failed to resend invite email." },
      { status: 500 }
    );
  }
}
