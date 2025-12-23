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

  // Sign up the user with Supabase Auth
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
  return computedOrigin ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
}
