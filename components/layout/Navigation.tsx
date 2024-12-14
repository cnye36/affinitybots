'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Sliders, Bookmark, Settings, X, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
    { href: '/dashboard/agents', label: 'Agents', icon: <Bookmark className="h-5 w-5" /> },
    { href: '/dashboard/workflows', label: 'Workflows', icon: <Sliders className="h-5 w-5" /> },
    { href: '/dashboard/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
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
          z-40
        `}
      >
        <div className="flex justify-between items-center p-4">
          <h2 className="text-xl font-bold">AgentFlow By AI-Automated</h2>
          <Button variant="ghost" onClick={() => setIsOpen(false)} className="md:hidden">
            <X className="h-5 w-5" />
          </Button>
        </div>
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