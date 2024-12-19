"use client"

import Link from 'next/link'
import { signup } from '../signin/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignUp() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6">Sign Up</h2>
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
          <Button formAction={signup} className="w-full">Sign Up</Button>
        </form>
        <p className="mt-4 text-center">
          Already have an account? <Link href="/signin" className="text-primary hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  )
}

