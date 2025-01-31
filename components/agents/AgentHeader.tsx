"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export function AgentHeader() {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-2xl font-bold">My Agents</h1>
      <Link href="/assistants/new">
        <Button>
          <PlusCircle className="mr-2" />
          Create Agent
        </Button>
      </Link>
    </div>
  );
}
