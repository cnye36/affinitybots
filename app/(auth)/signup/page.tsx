"use client";

import Link from "next/link";
import { signUp } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const queryError = searchParams.get("error");
  const inviteRef = useRef<HTMLInputElement | null>(null);

  async function handleSignUp(formData: FormData) {
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const inviteCode = formData.get("inviteCode") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!inviteCode) {
      setError("Invite code is required.");
      return;
    }

    const result = await signUp(formData);
    if (result?.error) {
      setError(result.error);
    }
    // On success, the action will redirect to the verification page
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6">Sign Up</h2>
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
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                
                className="pr-10"
                minLength={6}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
            />
          </div>
          <div>
            <Label htmlFor="inviteCode">Invite Code</Label>
            <Input id="inviteCode" name="inviteCode" type="text" ref={inviteRef} />
          </div>
          <Button formAction={handleSignUp} className="w-full">
            Sign Up
          </Button>
          {/* Temporarily disabled OAuth while fixing production issues
          <div className="relative my-2 text-center text-sm text-muted-foreground">
            <span className="px-2 bg-background relative z-10">or</span>
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-border" />
          </div>
          <Button
            variant="outline"
            formAction={signUpWithGoogle}
            className="w-full"
            onClick={(e) => {
              const value = inviteRef.current?.value?.trim();
              if (!value) {
                e.preventDefault();
                setError("Invite code is required.");
              }
            }}
          >
            Continue with Google
          </Button>
          <Button
            variant="outline"
            formAction={signUpWithGitHub}
            className="w-full"
            onClick={(e) => {
              const value = inviteRef.current?.value?.trim();
              if (!value) {
                e.preventDefault();
                setError("Invite code is required.");
              }
            }}
          >
            Continue with GitHub
          </Button>
          */}
        </form>
        <p className="mt-4 text-center">
          Already have an account?{" "}
          <Link href="/signin" className="text-primary hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignUpForm />
    </Suspense>
  );
}
