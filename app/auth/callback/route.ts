
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/supabase/types";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";
  const origin = requestUrl.origin;

  if (!code) {
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

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("Error exchanging code for session:", error);
    return NextResponse.redirect(
      new URL(
        `/auth/signin?error=${encodeURIComponent("Authentication failed. Please try again.")}`,
        origin
      )
    );
  }

  // --- whitelist check start ---
  const { data: { user } } = await supabase.auth.getUser();
  
  console.log("Auth Callback: User found:", user?.email);

  if (user && user.email) {
    const { data: invite, error: inviteError } = await supabase
      .from("early_access_invites")
      .select("status, id")
      .ilike("email", user.email)
      .single();
    
    console.log("Auth Callback: Invite status:", invite?.status, "Error:", inviteError);

    const isApproved = invite && (
      invite.status === 'invited' || 
      invite.status === 'approved' || 
      invite.status === 'accepted'
    );

    if (!isApproved) {
      console.log("Auth Callback: Access Denied. Redirecting to error.");
      await supabase.auth.signOut();
      const params = new URLSearchParams({
        error: "Your email is not approved for early access.",
        email: user.email,
      });
      return NextResponse.redirect(
        new URL(`/auth/signin?${params.toString()}`, origin)
      );
    }

    if (invite && invite.status !== 'accepted') {
        await supabase.from("early_access_invites")
          .update({ status: 'accepted', accepted_by_user_id: user.id })
          .eq("id", invite.id);
    }
  } else {
      console.log("Auth Callback: No user session found or no email.");
      return NextResponse.redirect(
        new URL(
          `/auth/signin?error=${encodeURIComponent("Login failed: Could not retrieve user session or email.")}`,
          origin
        )
      );
  }
  // --- whitelist check end ---

  return redirectResponse;
}

