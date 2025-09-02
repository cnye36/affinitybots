import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const next = url.searchParams.get('next') || '/dashboard';

    if (code) {
      const supabase = await createClient();
      
      // Exchange the code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent('Email verification failed. Please try again.')}`, request.url));
      }

      // Successfully verified email, redirect to dashboard
      return NextResponse.redirect(new URL(next, request.url));
    }

    // No code provided, redirect to signin
    return NextResponse.redirect(new URL('/signin', request.url));
  } catch (error) {
    console.error('Error in auth callback:', error);
    return NextResponse.redirect(new URL('/signin?error=Verification failed', request.url));
  }
}
