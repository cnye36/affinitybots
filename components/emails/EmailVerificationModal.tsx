"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle } from "lucide-react";

interface EmailVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email?: string;
}

export function EmailVerificationModal({ open, onOpenChange, email }: EmailVerificationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <DialogTitle className="text-xl">Check Your Email</DialogTitle>
          <DialogDescription className="text-base">
            We've sent a verification link to{" "}
            <span className="font-medium text-foreground">
              {email || "your email address"}
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 text-center">
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Next Steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-left">
                  <li>Check your email inbox (and spam folder)</li>
                  <li>Click the verification link in the email</li>
                  <li>Return here to sign in</li>
                </ol>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Didn't receive the email? Check your spam folder or{" "}
            <button className="text-primary hover:underline font-medium">
              request a new verification email
            </button>
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
          <Button 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Got It
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
