"use client";

import { Button } from "@/components/ui/button";
import { BaseServerCard, BaseServerCardProps } from "./BaseServerCard";
import Link from "next/link";

interface SmitheryServerCardProps {
  server: any; // Smithery server data
  logoUrl?: string;
  isConfigured?: boolean;
}

export function SmitheryServerCard({ server, logoUrl, isConfigured }: SmitheryServerCardProps) {


  return (
    <Link 
      href={`/tools/${encodeURIComponent(server.qualifiedName)}`}
      className="block"
    >
      <BaseServerCard
        serverType="smithery"
        qualifiedName={server.qualifiedName}
        displayName={server.displayName || server.qualifiedName}
        description={server.description || "Smithery MCP server"}
        logoUrl={logoUrl}
        isConfigured={isConfigured}
        onClick={undefined} // Remove onClick since we're using Link
      >
        <div className="mt-auto flex justify-center">
          {isConfigured ? (
            <Button variant="secondary" onClick={(e) => e.preventDefault()}>
              View & Configure
            </Button>
          ) : (
            <Button onClick={(e) => e.preventDefault()}>
              Configure & Connect
            </Button>
          )}
        </div>
      </BaseServerCard>
    </Link>
  );
}
