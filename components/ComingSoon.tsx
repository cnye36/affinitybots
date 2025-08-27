import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This feature is coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
