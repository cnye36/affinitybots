import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket } from "lucide-react";
import Link from "next/link";

export function ComingSoon() {
  return (
    <div className="flex h-screen items-center justify-center p-4 bg-gradient-to-b from-muted/30 to-background">
      <Card className="w-full max-w-md border border-border/50 shadow-lg">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Rocket className="h-7 w-7" aria-hidden="true" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <CardTitle className="text-2xl">Coming Soon</CardTitle>
            <Badge variant="secondary" className="uppercase">Preview</Badge>
          </div>
          <CardDescription>
            We’re putting the finishing touches on this experience. Check back soon.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center gap-3 pt-2">
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/agents">Explore Agents</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
