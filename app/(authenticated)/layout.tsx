import { ReactNode } from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'

export default async function AuthenticatedLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="md:pl-64 flex min-h-screen flex-col">
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}