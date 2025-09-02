import React, { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

function VerifyEmailContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <Mail className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Check Your Email</h1>
          
          <p className="text-muted-foreground text-lg mb-6">
            We've sent a verification link to your email address.
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="rounded-lg bg-muted p-6">
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-3">Next Steps:</p>
                <ol className="list-decimal list-inside space-y-2 text-left">
                  <li>Check your email inbox (and spam folder)</li>
                  <li>Click the verification link in the email</li>
                  <li>Close this page</li>
                </ol>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Didn't receive the email? Check your spam folder or{" "}
              <button className="text-primary hover:underline font-medium">
                request a new verification email
              </button>
            </p>
            
            
             
            </div>
          </div>
        </div>
      </div>
    
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <Mail className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
