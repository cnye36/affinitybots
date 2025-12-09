"use client";

import Link from "next/link";
import { signIn, signInWithGoogle } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SignInForm() {
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const queryError = searchParams.get("error");

  async function handleSignIn(formData: FormData) {
    const result = await signIn(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6">Sign In</h2>
        <form className="space-y-4">
          {(error || queryError) && (
            <Alert variant="destructive">
              <AlertDescription>{error ?? queryError}</AlertDescription>
            </Alert>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" />
          </div>
          <div className="space-y-2">
            <Button formAction={handleSignIn} className="w-full">
              Sign In
            </Button>
            
            <div className="relative my-2 text-center text-sm text-muted-foreground">
              <span className="px-2 bg-background relative z-10">or</span>
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-border" />
            </div>
            <Button variant="outline" formAction={signInWithGoogle} className="w-full">
              Sign in with Google
            </Button>
            {/* <Button variant="outline" formAction={signInWithGitHub} className="w-full">
              Sign in with GitHub
            </Button> */}
           
          </div>
        </form>
        <p className="mt-4 text-center">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-primary hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
