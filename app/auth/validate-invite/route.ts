import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  // Sanitize invite code from URL
  const inviteCodeRaw = requestUrl.searchParams.get("inviteCode");
  const inviteCode = inviteCodeRaw ? inviteCodeRaw.replace(/[^a-zA-Z0-9]/g, "") : null;

  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.redirect(
      new URL(
        `/auth/signup?error=${encodeURIComponent(
          "Authentication failed. Please try again."
        )}`,
        requestUrl.origin
      )
    );
  }

  if (!inviteCode) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL(
        `/auth/signup?error=${encodeURIComponent("Invite code is required.")}`,
        requestUrl.origin
      )
    );
  }

  // Validate the invite code
  const { data: invite, error: inviteError } = await supabase
    .from("early_access_invites")
    .select("id, email, status")
    .eq("invite_code", inviteCode)
    .single();

  if (inviteError || !invite) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL(
        `/auth/signup?error=${encodeURIComponent("Invalid invite code.")}`,
        requestUrl.origin
      )
    );
  }

  if (invite.email !== user.email) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL(
        `/auth/signup?error=${encodeURIComponent(
          "Invite code is not valid for this email address."
        )}`,
        requestUrl.origin
      )
    );
  }

  if (invite.status !== "invited") {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL(
        `/auth/signup?error=${encodeURIComponent(
          "This invite code has already been used or is not active."
        )}`,
        requestUrl.origin
      )
    );
  }

  // No expiration enforcement

  // Update the invite status
  await supabase
    .from("early_access_invites")
    .update({
      status: "accepted",
      accepted_by_user_id: user.id,
      invite_code: null,
      expires_at: null,
    })
    .eq("id", invite.id);

  // Redirect to dashboard
  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
}
