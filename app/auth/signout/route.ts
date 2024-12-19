import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies })
  
  // Sign out the user
  await supabase.auth.signOut()
  
  return NextResponse.redirect(new URL('/signin', process.env.NEXT_PUBLIC_SITE_URL))
} 