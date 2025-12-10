"use server";

import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

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

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  // 1. Validate Email Approval
  const { data: invite, error: inviteError } = await supabase
    .from("early_access_invites")
    .select("id, email, status")
    .eq("email", email)
    .single();

  if (inviteError || !invite) {
    // Treat "not found" as "not approved" to avoid leaking email existence if desired,
    // or be explicit. For early access, explicit is usually fine.
    return {
      error: "This email address is not on the approved list. Please request early access.",
    };
  }

  // Allow 'invited' (legacy) or 'approved'
  if (invite.status !== "invited" && invite.status !== "approved") {
     if (invite.status === "requested") {
        return { error: "Your access request is still pending approval." };
     }
     if (invite.status === "accepted") {
        return { error: "This email has already been registered." };
     }
     return { error: "Access denied." };
  }

  // 2. Sign up the user with Supabase Auth
  const { data: signUpData, error: signUpAuthError } =
    await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${await getSiteUrl()}/auth/callback`,
        // No invite code metadata needed anymore
      }
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
    })
    .eq("id", invite.id);

  if (updateInviteError) {
    console.error(
      `Failed to update invite status for user ${signUpData.user.id}:`,
      updateInviteError
    );
  }

  revalidatePath("/", "layout");
  redirect(`/auth/verify-email?email=${encodeURIComponent(email)}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/signin");
}

async function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");
  }
  
  const hdrs = await headers();
  const forwardedProto = hdrs.get("x-forwarded-proto");
  const host = hdrs.get("host");
  const computedOrigin = forwardedProto && host ? `${forwardedProto}://${host}` : hdrs.get("origin");
  return computedOrigin ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
