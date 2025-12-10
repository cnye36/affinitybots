
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/supabase/types";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";
  const origin = requestUrl.origin;

  console.log("🔍 Auth Callback: Starting callback handler");
  console.log("🔍 Auth Callback: Request URL:", requestUrl.toString());
  console.log("🔍 Auth Callback: Origin:", origin);
  console.log("🔍 Auth Callback: Code present:", !!code);
  console.log("🔍 Auth Callback: Next redirect:", next);

  if (!code) {
    console.log("❌ Auth Callback: No code parameter, redirecting to sign-in");
    return NextResponse.redirect(new URL("/auth/signin", origin));
  }

  // Create the redirect response FIRST
  let redirectResponse = NextResponse.redirect(new URL(next, origin));
  
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Write to the redirect response so cookies are sent to browser
            redirectResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  console.log("🔍 Auth Callback: Exchanging code for session...");
  const { error, data: sessionData } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("❌ Auth Callback: Error exchanging code for session:", error);
    return NextResponse.redirect(
      new URL(
        `/auth/signin?error=${encodeURIComponent("Authentication failed. Please try again.")}`,
        origin
      )
    );
  }
  console.log("✅ Auth Callback: Code exchanged successfully");

  // --- whitelist check start ---
  console.log("🔍 Auth Callback: Getting user from session...");
  const { data: { user }, error: getUserError } = await supabase.auth.getUser();
  
  if (getUserError) {
    console.error("❌ Auth Callback: Error getting user:", getUserError);
    return NextResponse.redirect(
      new URL(
        `/auth/signin?error=${encodeURIComponent("Failed to retrieve user session.")}`,
        origin
      )
    );
  }
  
  console.log("✅ Auth Callback: User found:", user?.email);

  if (user && user.email) {
    const { data: invite, error: inviteError } = await supabase
      .from("early_access_invites")
      .select("status, id")
      .ilike("email", user.email)
      .maybeSingle();
    
    console.log("Auth Callback: User email:", user.email);
    console.log("Auth Callback: Invite status:", invite?.status, "Error:", inviteError);

    // Check if there was a real database error (not just "not found")
    if (inviteError && inviteError.code !== "PGRST116") {
      console.error("Auth Callback: Database error checking invite:", inviteError);
      // For database errors, we'll still allow the user through but log it
    }

    const isApproved = invite && (
      invite.status === 'invited' || 
      invite.status === 'approved' || 
      invite.status === 'accepted'
    );

    if (!isApproved) {
      console.log("❌ Auth Callback: Access Denied. Email not approved. Redirecting to sign-in.");
      await supabase.auth.signOut();
      const params = new URLSearchParams({
        error: "Your email is not approved for early access.",
        email: user.email,
      });
      const redirectUrl = new URL(`/auth/signin?${params.toString()}`, origin);
      console.log("🔍 Auth Callback: Redirecting to:", redirectUrl.toString());
      return NextResponse.redirect(redirectUrl);
    }

    console.log("✅ Auth Callback: User is approved, proceeding...");

    // Update invite status to accepted if it's not already
    if (invite && invite.status !== 'accepted') {
      console.log("🔍 Auth Callback: Updating invite status to accepted...");
      const { error: updateError } = await supabase
        .from("early_access_invites")
        .update({ status: 'accepted', accepted_by_user_id: user.id })
        .eq("id", invite.id);
      
      if (updateError) {
        console.error("❌ Auth Callback: Error updating invite status:", updateError);
      } else {
        console.log("✅ Auth Callback: Invite status updated to accepted");
      }
    }
  } else {
      console.log("❌ Auth Callback: No user session found or no email.");
      return NextResponse.redirect(
        new URL(
          `/auth/signin?error=${encodeURIComponent("Login failed: Could not retrieve user session or email.")}`,
          origin
        )
      );
  }
  // --- whitelist check end ---

  console.log("✅ Auth Callback: All checks passed, redirecting to:", redirectResponse.headers.get("location"));
  return redirectResponse;
}

