import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import crypto from "crypto";
import { sendInviteEmail } from "@/lib/sendInviteEmail";

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  // TODO: Implement robust admin authentication/authorization here
  // const { user } = await validateUser(request); // Hypothetical auth function
  // if (!user || user.role !== 'admin') {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  const { id } = params; // This is the ID of the early_access_invites record

  if (!id) {
    return NextResponse.json(
      { error: "Request ID is required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  try {
    // 1. Check if the request exists and is in a state that can be invited (e.g., 'requested')
    const { data: existingRequest, error: fetchError } = await supabase
      .from("early_access_invites")
      .select("id, status, email, name")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        // Row not found
        return NextResponse.json(
          { error: "Early access request not found" },
          { status: 404 }
        );
      }
      console.error("Error fetching early access request:", fetchError);
      return NextResponse.json(
        { error: "Database error fetching request" },
        { status: 500 }
      );
    }

    if (existingRequest.status !== "requested") {
      return NextResponse.json(
        {
          error: `Request is already in status '${existingRequest.status}' and cannot be invited.`,
        },
        { status: 400 }
      );
    }

    // 2. Generate a unique invite code
    const inviteCode = crypto.randomBytes(8).toString("hex"); // 16-character hex string

    // 3. Set invited timestamp; no expiration
    const invitedAt = new Date();

    // 4. Update the record
    const { data: updatedRecord, error: updateError } = await supabase
      .from("early_access_invites")
      .update({
        status: "invited",
        invite_code: inviteCode,
        invited_at: invitedAt.toISOString(),
        expires_at: null,
      })
      .eq("id", id)
      .select("id, email, name, invite_code, status, expires_at") // Add name for email
      .single();

    if (updateError) {
      console.error("Error updating early access request:", updateError);
      return NextResponse.json(
        { error: "Failed to issue invite code" },
        { status: 500 }
      );
    }

    // Send invite email
    try {
      await sendInviteEmail({
        to: updatedRecord.email,
        name: updatedRecord.name,
        inviteCode: updatedRecord.invite_code,
      });
    } catch (emailError) {
      console.error("Failed to send invite email:", emailError);
      // Do not block the response if email fails
    }

    return NextResponse.json({
      message: "Invite code issued successfully.",
      data: updatedRecord,
    });
  } catch (error) {
    console.error(
      "Unexpected error in POST /api/admin/early-access-requests/[id]/issue-invite:",
      error
    );
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
