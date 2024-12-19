'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Sliders, Bookmark, Settings, X, Menu, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { signOut } from '@/app/auth/signout/action'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
    { href: '/agents', label: 'Agents', icon: <Bookmark className="h-5 w-5" /> },
    { href: '/workflows', label: 'Workflows', icon: <Sliders className="h-5 w-5" /> },
    { href: '/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
  ]

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button variant="ghost" onClick={() => setIsOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar */}
      <nav 
        className={`
          fixed top-0 left-0 h-full w-64 
          transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 transition-transform duration-200 ease-in-out 
          bg-background border-r border-border
          z-40 flex flex-col
        `}
      >
        <div className="flex justify-between items-center p-4">
          <h2 className="text-xl font-bold">AgentHub By AI-Automated</h2>
          <Button variant="ghost" onClick={() => setIsOpen(false)} className="md:hidden">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Navigation Items */}
        <ul className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <Button
                  variant={pathname === item.href ? 'default' : 'ghost'}
                  className={`w-full justify-start ${pathname === item.href ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </Button>
              </Link>
            </li>
          ))}
        </ul>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
          <Button 
            variant="ghost" 
            formAction={signOut}
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-950"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Log Out
          </Button>
        </div>
      </nav>

      {/* Overlay for Mobile Menu */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  )
} 