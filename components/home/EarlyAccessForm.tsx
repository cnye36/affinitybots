"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

export function EarlyAccessForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    purpose: "",
    experience: "",
    organization: "",
    expectations: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, experience: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Send form data to our API endpoint
      const response = await axios.post("/api/early-access", formData);

      if (response.data.success) {
        toast({
          title: "Request Submitted",
          description:
            "Thank you for your interest! We'll review your application and get back to you soon.",
        });

        // Reset form
        setFormData({
          email: "",
          name: "",
          purpose: "",
          experience: "",
          organization: "",
          expectations: "",
        });
      } else {
        throw new Error("Submission failed");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Submission Failed",
        description:
          "There was a problem submitting your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Request Early Access</CardTitle>
        <CardDescription>
          Fill out this form to request early access to AgentHub.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              required
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="Your name"
              required
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          

          <div className="space-y-2">
            <Label htmlFor="experience">Experience Level *</Label>
            <Select
              onValueChange={handleSelectChange}
              value={formData.experience}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your experience level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner - New to AI</SelectItem>
                <SelectItem value="intermediate">
                  Intermediate - Some AI experience
                </SelectItem>
                <SelectItem value="advanced">
                  Advanced - Experienced AI developer
                </SelectItem>
                <SelectItem value="expert">
                  Expert - Professional AI engineer
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization">Organization (optional)</Label>
            <Input
              id="organization"
              placeholder="Your company or organization"
              value={formData.organization}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectations">
              What features are you most interested in?
            </Label>
            <Textarea
              id="expectations"
              placeholder="Tell us what features you're most excited about..."
              value={formData.expectations}
              onChange={handleChange}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
