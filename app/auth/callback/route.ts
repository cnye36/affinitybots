
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/supabase/types";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { notifyAdminOfNewSignup } from "@/lib/admin/notifications";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  // Get next from query params (passed through Supabase's queryParams option)
  // If explicitly set, use it (e.g., when plan is selected)
  const explicitNext = requestUrl.searchParams.get("next");
  const origin = requestUrl.origin;
  
  // Log if we're on the wrong origin (this helps debug Supabase redirect issues)
  if (origin.includes("affinitybots.com") && process.env.NODE_ENV === "development") {
    console.warn("⚠️ Auth Callback: Received callback on production domain in development mode!");
    console.warn("⚠️ This suggests Supabase Site URL is set to production. Check Supabase dashboard.");
  }

  console.log("🔍 Auth Callback: Starting callback handler");
  console.log("🔍 Auth Callback: Request URL:", requestUrl.toString());
  console.log("🔍 Auth Callback: Origin:", origin);
  console.log("🔍 Auth Callback: Code present:", !!code);
  console.log("🔍 Auth Callback: Explicit next redirect:", explicitNext);

  if (!code) {
    console.log("❌ Auth Callback: No code parameter, redirecting to sign-in");
    return NextResponse.redirect(new URL("/auth/signin", origin));
  }

  // Collect cookies during session exchange
  const cookiesToSet: Array<{ name: string; value: string; options?: any }> = [];
  
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookiesToSet.push(...cookies);
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

  if (!user?.email) {
      console.log("❌ Auth Callback: No user session found or no email.");
      return NextResponse.redirect(
        new URL(
          `/auth/signin?error=${encodeURIComponent("Login failed: Could not retrieve user session or email.")}`,
          origin
        )
      );
  }
  // --- whitelist check end ---

  // Check if this is a new OAuth signup (user created very recently)
  // Email signups are already notified in the signUp action, so we only notify here for OAuth
  if (user.created_at) {
    const createdTime = new Date(user.created_at).getTime()
    const now = Date.now()
    const timeSinceCreation = now - createdTime
    // If user was created in the last 5 minutes, this is likely a new OAuth signup
    // (OAuth callbacks happen immediately, while email verification callbacks happen later)
    const isNewOAuthSignup = timeSinceCreation < 5 * 60 * 1000 // 5 minutes
    
    if (isNewOAuthSignup) {
      // Notify admin of new OAuth signup (don't await - fire and forget)
      notifyAdminOfNewSignup(user.email, user.id).catch((err) => {
        console.error("Failed to send admin notification for new OAuth signup:", err)
      })
    }
  }

  // Determine final redirect destination
  let finalRedirect = "/dashboard";
  
  // If explicit next is set (e.g., from plan selection), use it
  if (explicitNext) {
    console.log("🔍 Auth Callback: Using explicit next redirect:", explicitNext);
    finalRedirect = explicitNext;
  } else {
    // Check if user has a paid subscription (has Stripe customer ID)
    // New users without payment should be redirected to checkout to complete signup
    console.log("🔍 Auth Callback: Checking user subscription status...");
    const adminSupabase = getSupabaseAdmin();
    const { data: subscription, error: subError } = await adminSupabase
      .from("subscriptions")
      .select("stripe_customer_id, plan_type, status")
      .eq("user_id", user.id)
      .single();

    if (subError && subError.code !== "PGRST116") {
      // PGRST116 is "not found" which is fine for new users
      console.error("❌ Auth Callback: Error checking subscription:", subError);
    }

    // If no subscription or no Stripe customer ID, redirect to checkout (default to pro plan)
    // This matches the email signup flow where users go directly to Stripe checkout
    const subscriptionData = subscription as { stripe_customer_id: string | null } | null;
    if (!subscriptionData || !subscriptionData.stripe_customer_id) {
      console.log("🔍 Auth Callback: User has no Stripe customer ID, redirecting to checkout (default: pro plan)");
      finalRedirect = "/pricing/checkout?plan=pro";
    } else {
      console.log("🔍 Auth Callback: User has active subscription, redirecting to dashboard");
      finalRedirect = "/dashboard";
    }
  }

  // Create final redirect response with cookies
  const finalResponse = NextResponse.redirect(new URL(finalRedirect, origin));
  
  // Set all cookies from the session exchange
  cookiesToSet.forEach(({ name, value, options }) => {
    finalResponse.cookies.set(name, value, options);
  });

  console.log("✅ Auth Callback: All checks passed, redirecting to:", finalRedirect);
  return finalResponse;
}

