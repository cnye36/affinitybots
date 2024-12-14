import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { PlusCircle, Settings, LogOut } from 'lucide-react'

export default async function Dashboard() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Link href="/dashboard/agents/new" className="group">
            <div className="relative p-6 rounded-lg overflow-hidden border group-hover:border-primary transition-colors">
              <div className="flex items-center space-x-4">
                <PlusCircle className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold mb-1">Create New Agent</h3>
                  <p className="text-sm text-muted-foreground">Design a custom AI agent with specific capabilities</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/workflows/new" className="group">
            <div className="relative p-6 rounded-lg overflow-hidden border group-hover:border-primary transition-colors">
              <div className="flex items-center space-x-4">
                <PlusCircle className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold mb-1">New Workflow</h3>
                  <p className="text-sm text-muted-foreground">Build a multi-agent workflow from scratch</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/settings" className="group">
            <div className="relative p-6 rounded-lg overflow-hidden border group-hover:border-primary transition-colors">
              <div className="flex items-center space-x-4">
                <Settings className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold mb-1">Settings</h3>
                  <p className="text-sm text-muted-foreground">Configure your workspace and preferences</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
          <div className="border rounded-lg p-6">
            <p className="text-muted-foreground text-center py-8">No recent activity to show</p>
          </div>
        </div>
      </div>
    </div>
  )
}