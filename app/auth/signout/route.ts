import supabaseServerClient from '@/lib/supabaseServerClient'
import { NextResponse } from 'next/server'

export async function POST() {
  // Sign out the user
  await supabaseServerClient.auth.signOut()
  
  return NextResponse.redirect(new URL('/signin', process.env.NEXT_PUBLIC_SITE_URL))
} 