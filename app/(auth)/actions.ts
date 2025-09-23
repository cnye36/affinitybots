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
  const inviteCode = formData.get("inviteCode") as string;

  if (!email || !password || !inviteCode) {
    return { error: "Email, password, and invite code are required." };
  }

  // 1. Validate Invite Code
  const { data: invite, error: inviteError } = await supabase
    .from("early_access_invites")
    .select("id, email, status")
    .eq("invite_code", inviteCode)
    .single(); // Expecting a single, unique invite code

  if (inviteError || !invite) {
    console.error("Invite code validation error:", inviteError);
    return {
      error:
        "Invalid invite code. Please check your code and try again.",
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

  // No expiration enforcement

  // 2. Sign up the user with Supabase Auth
  const { data: signUpData, error: signUpAuthError } =
    await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${await getSiteUrl()}/auth/callback`,
        data: {
          invite_code: inviteCode,
        }
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
      invite_code: null, // Clear the invite code as it's been used
      expires_at: null, // Clear expiry
    })
    .eq("id", invite.id);

  if (updateInviteError) {
    // This is not ideal, as the user is created but the invite status isn't updated.
    // Log this for admin attention. Potentially attempt a rollback or flag for manual review.
    console.error(
      `Failed to update invite status for user ${signUpData.user.id} (invite ID: ${invite.id}):`,
      updateInviteError
    );
    // Don't block user login for this, but it needs to be addressed.
  }

  revalidatePath("/", "layout");
  // Redirect to verification page since email confirmation is required
  redirect(`/auth/verify-email?email=${encodeURIComponent(email)}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/signin");
}

async function getSiteUrl() {
  const hdrs = await headers();
  const forwardedProto = hdrs.get("x-forwarded-proto");
  const host = hdrs.get("host");
  const computedOrigin = forwardedProto && host ? `${forwardedProto}://${host}` : hdrs.get("origin");
  // Prefer the current request origin (works for localhost and multi-domain)
  // Fallback to env var if origin is not available
  return computedOrigin ?? process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  // Route through our auth callback so we can exchange the code for a session
  const next = encodeURIComponent(`/dashboard`);
  const redirectTo = `${await getSiteUrl()}/auth/callback?next=${next}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) {
    redirect(`/signin?error=${encodeURIComponent(error.message)}`);
  }
  if (data?.url) {
    redirect(data.url);
  }
}

export async function signInWithGitHub() {
  const supabase = await createClient();
  // Route through our auth callback so we can exchange the code for a session
  const next = encodeURIComponent(`/dashboard`);
  const redirectTo = `${await getSiteUrl()}/auth/callback?next=${next}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo },
  });
  if (error) {
    redirect(`/signin?error=${encodeURIComponent(error.message)}`);
  }
  if (data?.url) {
    redirect(data.url);
  }
}

export async function signUpWithGoogle(formData: FormData) {
  const supabase = await createClient();
  const inviteCode = (formData.get("inviteCode") as string) || "";
  
  if (!inviteCode) {
    redirect(`/signup?error=${encodeURIComponent("Invite code is required.")}`);
  }
  
  // Store invite code in session storage for validation after OAuth
  const nextPath = `/auth/validate-invite?inviteCode=${encodeURIComponent(inviteCode)}`;
  const redirectTo = `${await getSiteUrl()}/auth/callback?next=${encodeURIComponent(nextPath)}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }
  if (data?.url) {
    redirect(data.url);
  }
}

export async function signUpWithGitHub(formData: FormData) {
  const supabase = await createClient();
  const inviteCode = (formData.get("inviteCode") as string) || "";
  
  if (!inviteCode) {
    redirect(`/signup?error=${encodeURIComponent("Invite code is required.")}`);
  }
  
  // Store invite code in session storage for validation after OAuth
  const nextPath = `/auth/validate-invite?inviteCode=${encodeURIComponent(inviteCode)}`;
  const redirectTo = `${await getSiteUrl()}/auth/callback?next=${encodeURIComponent(nextPath)}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo },
  });
  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }
  if (data?.url) {
    redirect(data.url);
  }
}
