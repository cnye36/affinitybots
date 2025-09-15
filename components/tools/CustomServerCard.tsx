"use client";
import { BaseServerCard, BaseServerCardProps } from "./BaseServerCard";
import Link from "next/link";

interface CustomServerCardProps {
  server: any; // Custom server data
  isConfigured?: boolean;
}

export function CustomServerCard({ server, isConfigured }: CustomServerCardProps) {

  return (
    <Link 
      href={`/tools/${encodeURIComponent(server.qualified_name)}`}
      className="block"
    >
      <BaseServerCard
        serverType="custom"
        qualifiedName={server.qualified_name}
        displayName={server.display_name || server.qualified_name}
        description={server.description || "Custom MCP server"}
        isConfigured={isConfigured}
        onClick={undefined} // Remove onClick since we're using Link
      />
    </Link>
  );
}
