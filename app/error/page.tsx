'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function ErrorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorMessage = searchParams.get('message')

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push('/signin')
    }, 3000)

    return () => clearTimeout(timeout)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md w-full px-4">
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            {errorMessage || 'Something went wrong'}
          </AlertDescription>
        </Alert>
        <p className="text-muted-foreground mb-4">Redirecting you to sign in...</p>
        <Button onClick={() => router.push('/signin')}>
          Sign In Now
        </Button>
      </div>
    </div>
  )
}