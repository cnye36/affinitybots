"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export function EmptyAgents() {
  return (
    <div className="text-center py-16 px-4">
      <h2 className="text-3xl font-bold mb-4">Welcome to AffinityBots</h2>
      <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
        Create your first AI agent to get started. AI agents can help you with
        tasks, answer questions, and assist with your work.
      </p>
      <Link href="/agents/new">
        <Button size="lg">
          <PlusCircle className="mr-2" />
          Create Your First Agent
        </Button>
      </Link>
    </div>
  );
}
