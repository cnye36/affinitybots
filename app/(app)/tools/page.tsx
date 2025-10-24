"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { OFFICIAL_MCP_SERVERS } from "@/lib/mcp/officialMcpServers";
import { OfficialServerCard } from "@/components/tools/OfficialServerCard";
import { CustomServerCard } from "@/components/tools/CustomServerCard";

import { AddMCPServerModal } from "@/components/tools/AddMCPServerModal";

export default function ToolsPage() {
  const [userServers, setUserServers] = useState<any[]>([]);
  const [userAddedServers, setUserAddedServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [configuredServers, setConfiguredServers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [serverFilter, setServerFilter] = useState<"all" | "official">("all");
  
  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [userRes, userAddedRes] = await Promise.all([
        fetch("/api/user-mcp-servers").then((r) => r.json()),
        fetch("/api/user-added-servers").then((r) => r.json()),
      ]);
      const userList = userRes.servers || [];
      const userAddedList = userAddedRes.servers || [];
      setUserServers(userList);
      setUserAddedServers(userAddedList);
      setConfiguredServers(userList);
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);
  
  // Helper to check if a server is configured
  const isConfigured = (qualifiedName: string) =>
    userServers.some((s: any) => s.qualified_name === qualifiedName);
  
  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex items-center justify-center mb-8">
        <h1 className="text-4xl font-bold">Tools</h1>
      </div>
      
      {/* Search and Filter Bar */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search for integrations and MCP servers..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2"
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            variant={serverFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setServerFilter("all")}
            className="w-full sm:w-auto"
          >
            All Tools
          </Button>
          <Button
            variant={serverFilter === "official" ? "default" : "outline"}
            size="sm"
            onClick={() => setServerFilter("official")}
            className="w-full sm:w-auto"
          >
            Official MCP
          </Button>
          
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {/* User-added servers - always on top */}
        {userAddedServers.length > 0 && (
          <>
            {userAddedServers.map((server: any) => (
              <CustomServerCard
                key={server.id}
                server={server}
                isConfigured={true}
              />
            ))}
          </>
        )}

        {/* Official MCP servers */}
        {(serverFilter === "all" || serverFilter === "official") && 
          OFFICIAL_MCP_SERVERS.map((server) => (
            <OfficialServerCard
              key={`official-${server.qualifiedName}`}
              server={server}
              isConfigured={isConfigured(server.qualifiedName)}
              onConnected={async () => {
                const [userRes, userAddedRes] = await Promise.all([
                  fetch("/api/user-mcp-servers").then((r) => r.json()),
                  fetch("/api/user-added-servers").then((r) => r.json())
                ]);
                const userList = userRes.servers || [];
                const userAddedList = userAddedRes.servers || [];
                setUserServers(userList);
                setUserAddedServers(userAddedList);
                setConfiguredServers(userList);
              }}
            />
          ))
        }
      </div>
      
      {/* Add Custom MCP Server Button */}
      <div className="mt-12 text-center">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setAddOpen(true)}
          className="gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Custom MCP Server
        </Button>
        <p className="mt-2 text-sm text-muted-foreground">
          Add your own HTTP or stdio MCP server
        </p>
      </div>

      <AddMCPServerModal open={addOpen} onOpenChange={setAddOpen} onAdded={async () => {
        const [userRes, userAddedRes] = await Promise.all([
          fetch("/api/user-mcp-servers").then((r) => r.json()),
          fetch("/api/user-added-servers").then((r) => r.json())
        ]);
        const userList = userRes.servers || [];
        const userAddedList = userAddedRes.servers || [];
        setUserServers(userList);
        setUserAddedServers(userAddedList);
        setConfiguredServers(userList);
      }} />
    </div>
  );
} 