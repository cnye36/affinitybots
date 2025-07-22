"use server";

import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import logger from "@/lib/logger";

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const inviteCode = formData.get("inviteCode") as string;

  if (!email || !password || !inviteCode) {
    return { error: "Email, password, and invite code are required." };
  }

  // 1. Validate Invite Code
  const { data: invite, error: inviteError } = await supabase
    .from("early_access_invites")
    .select("id, email, status, expires_at")
    .eq("invite_code", inviteCode)
    .single(); // Expecting a single, unique invite code

  if (inviteError || !invite) {
    logger.error("Invite code validation error:", inviteError);
    return {
      error:
        "Invalid or expired invite code. Please check your code and try again.",
    };
  }

  if (invite.email !== email) {
    return { error: "Invite code is not valid for this email address." };
  }

  if (invite.status !== "invited") {
    return {
      error: "This invite code has already been used or is not active.",
    };
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return { error: "This invite code has expired." };
  }

  // 2. Sign up the user with Supabase Auth
  const { data: signUpData, error: signUpAuthError } =
    await supabase.auth.signUp({
      email,
      password,
      // You can add options here, like email_confirm: true if you want email verification
    });

  if (signUpAuthError) {
    return { error: signUpAuthError.message };
  }

  if (!signUpData.user) {
    return { error: "User registration failed. Please try again." };
  }

  // 3. Update the early_access_invites table
  const { error: updateInviteError } = await supabase
    .from("early_access_invites")
    .update({
      status: "accepted",
      accepted_by_user_id: signUpData.user.id,
      invite_code: null, // Clear the invite code as it's been used
      expires_at: null, // Clear expiry
    })
    .eq("id", invite.id);

  if (updateInviteError) {
    // This is not ideal, as the user is created but the invite status isn't updated.
    // Log this for admin attention. Potentially attempt a rollback or flag for manual review.
    logger.error(
      `Failed to update invite status for user ${signUpData.user.id} (invite ID: ${invite.id}):`,
      updateInviteError
    );
    // Don't block user login for this, but it needs to be addressed.
  }

  revalidatePath("/", "layout");
  // If you have email confirmation enabled, you might redirect to a page saying "Check your email"
  // Otherwise, redirect to dashboard or a welcome page.
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/signin");
}
