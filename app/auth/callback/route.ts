import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") || "/dashboard";

    // Prepare the final redirect response up-front so we can attach cookies to it
    const redirectResponse = NextResponse.redirect(new URL(next, origin));

    if (!code) {
      return NextResponse.redirect(new URL("/signin", origin));
    }

    // Create a Supabase server client that writes cookies to our redirect response
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              redirectResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(
        new URL(
          `/signin?error=${encodeURIComponent("Authentication failed. Please try again.")}`,
          origin
        )
      );
    }

    return redirectResponse;
  } catch (error) {
    console.error("Error in auth callback:", error);
    return NextResponse.redirect(new URL("/signin?error=Verification failed", request.url));
  }
}
