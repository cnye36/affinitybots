"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export function AgentHeader() {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-bold">My Agents</h1>
      <Link href="/agents/new" className="w-full sm:w-auto">
        <Button className="w-full sm:w-auto justify-center">
          <PlusCircle className="mr-2" />
          Create Agent
        </Button>
      </Link>
    </div>
  );
}
