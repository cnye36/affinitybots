"use client"

import Link from 'next/link'
import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6">Sign In</h2>
        <form className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
            />
          </div>
          <div className="space-y-2">
            <Button formAction={login} className="w-full">Sign In</Button>
          </div>
        </form>
        <p className="mt-4 text-center">
          Don't have an account? <Link href="/signup" className="text-primary hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  )
}


