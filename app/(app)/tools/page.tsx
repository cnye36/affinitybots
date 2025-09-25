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
import { SmitheryServerCard } from "@/components/tools/SmitheryServerCard";
import { CustomServerCard } from "@/components/tools/CustomServerCard";

const PAGE_SIZE = 12;

// Cache utilities
const LOGO_CACHE_KEY = 'smithery-logos';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CachedLogo {
  url: string;
  timestamp: number;
}

interface LogoCache {
  [qualifiedName: string]: CachedLogo;
}

const getLogoCache = (): LogoCache => {
  if (typeof window === 'undefined') return {};
  try {
    const cached = localStorage.getItem(LOGO_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
};

const setLogoCache = (cache: LogoCache) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOGO_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore localStorage errors
  }
};

const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_DURATION;
};

import { AddMCPServerModal } from "@/components/tools/AddMCPServerModal";

export default function ToolsPage() {
  const [servers, setServers] = useState<any[]>([]);
  const [logos, setLogos] = useState<Record<string, string>>({});
  const [userServers, setUserServers] = useState<any[]>([]);
  const [userAddedServers, setUserAddedServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [configuredServers, setConfiguredServers] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [serverFilter, setServerFilter] = useState<"all" | "official" | "smithery">("all");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when search changes
  useEffect(() => {
    if (debouncedSearch !== searchTerm) {
      setPage(1);
    }
  }, [debouncedSearch, searchTerm]);

  const fetchServers = useCallback(async (pageNum: number, search: string) => {
    const isSearch = search.trim().length > 0;
    setSearchLoading(isSearch);
    
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: PAGE_SIZE.toString(),
      });
      
      if (search.trim()) {
        params.set('search', search.trim());
      }
      
      const response = await fetch(`/api/smithery?${params}`);
      const data = await response.json();
      
      const serverList = data?.servers?.servers || [];
      const totalCount = data?.servers?.total || 0;
      const totalPagesCount = data?.servers?.totalPages || Math.ceil(totalCount / PAGE_SIZE);
      
      setServers(serverList);
      setTotal(totalCount);
      setTotalPages(totalPagesCount);

      return serverList;
    } catch (error) {
      console.error('Failed to fetch servers:', error);
      setServers([]);
      setTotal(0);
      setTotalPages(1);
      return [];
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [serverList, userRes, userAddedRes] = await Promise.all([
        fetchServers(page, debouncedSearch),
        fetch("/api/user-mcp-servers").then((r) => r.json()),
        fetch("/api/user-added-servers").then((r) => r.json()),
      ]);
      const userList = userRes.servers || [];
      const userAddedList = userAddedRes.servers || [];
      setUserServers(userList);
      setUserAddedServers(userAddedList);
      setConfiguredServers(userList);
      setLoading(false);

      // Load cached logos immediately for current servers
      loadLogosForServers(serverList);
    }
    fetchData();
  }, []);

  // Fetch servers when page or search changes
  useEffect(() => {
    if (!loading) {
      fetchServers(page, debouncedSearch).then(loadLogosForServers);
    }
  }, [page, debouncedSearch, fetchServers, loading]);

  const loadLogosForServers = useCallback(async (serverList: any[]) => {
    if (!serverList.length) return;

    const logoCache = getLogoCache();
    const cachedLogos: Record<string, string> = {};
    const serversNeedingLogos: any[] = [];

    serverList.forEach((server: any) => {
      const cached = logoCache[server.qualifiedName];
      if (cached && isCacheValid(cached.timestamp)) {
        cachedLogos[server.qualifiedName] = cached.url;
      } else {
        serversNeedingLogos.push(server);
      }
    });

    // Set cached logos immediately
    setLogos(prevLogos => ({ ...prevLogos, ...cachedLogos }));

    // Fetch missing logos in background using bulk endpoint
    if (serversNeedingLogos.length > 0) {
      const newLogos: Record<string, string> = {};
      const newCache = { ...logoCache };

      try {
        const qualifiedNames = serversNeedingLogos.map((s: any) => s.qualifiedName);
        const bulkResponse = await fetch('/api/smithery/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ qualifiedNames }),
        });

        if (bulkResponse.ok) {
          const bulkData = await bulkResponse.json();
          
          Object.entries(bulkData.servers).forEach(([qualifiedName, serverData]: [string, any]) => {
            if (serverData?.iconUrl || serverData?.logo) {
              const logoUrl = serverData.iconUrl || serverData.logo;
              newLogos[qualifiedName] = logoUrl;
              newCache[qualifiedName] = {
                url: logoUrl,
                timestamp: Date.now()
              };
            }
          });
        }
      } catch (e) {
        // Fallback to individual requests if bulk fails
        await Promise.all(
          serversNeedingLogos.map(async (server: any) => {
            try {
              const encodedName = encodeURIComponent(server.qualifiedName);
              const detail = await fetch(`/api/smithery/${encodedName}`).then((r) => r.json());
              if (detail?.server?.iconUrl || detail?.server?.logo) {
                const logoUrl = detail.server.iconUrl || detail.server.logo;
                newLogos[server.qualifiedName] = logoUrl;
                newCache[server.qualifiedName] = {
                  url: logoUrl,
                  timestamp: Date.now()
                };
              }
            } catch (e) {
              // ignore errors, fallback to no logo
            }
          })
        );
      }

      // Update state and cache
      if (Object.keys(newLogos).length > 0) {
        setLogos(prevLogos => ({ ...prevLogos, ...newLogos }));
        setLogoCache(newCache);
      }
    }
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage);
    }
  }, [page, totalPages]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  if (loading) return <div className="text-center py-12 text-lg">Loading tools...</div>;

  // Helper to check if a server is configured
  const isConfigured = (qualifiedName: string) =>
    userServers.some((s: any) => s.qualified_name === qualifiedName);

  // Helper to check if a server is a user-added server
  const isUserAddedServer = (qualifiedName: string) =>
    userAddedServers.some((s: any) => s.qualified_name === qualifiedName);

  // Filter Smithery servers to exclude user-added servers
  const filteredSmitheryServers = servers.filter((server: any) => 
    !isUserAddedServer(server.qualifiedName)
  );

  // Truncation handled within card components

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
              placeholder="Search for MCP servers..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2"
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
          {searchTerm && (
            <div className="mt-2 text-sm text-muted-foreground text-center">
              {searchLoading ? 'Searching...' : `Found ${total} servers`}
            </div>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            variant={serverFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setServerFilter("all")}
            className="w-full sm:w-auto"
          >
            All Servers
          </Button>
          <Button
            variant={serverFilter === "official" ? "default" : "outline"}
            size="sm"
            onClick={() => setServerFilter("official")}
            className="w-full sm:w-auto"
          >
            Official
          </Button>
          <Button
            variant={serverFilter === "smithery" ? "default" : "outline"}
            size="sm"
            onClick={() => setServerFilter("smithery")}
            className="w-full sm:w-auto"
          >
            Smithery
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

        {/* Official servers */}
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

        {/* Smithery registry servers */}
        {(serverFilter === "all" || serverFilter === "smithery") && 
          filteredSmitheryServers.map((server: any) => (
            <SmitheryServerCard
              key={server.qualifiedName || server.id}
              server={server}
              logoUrl={logos[server.qualifiedName]}
              isConfigured={isConfigured(server.qualifiedName)}
            />
          ))
        }
      </div>
      
      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {/* First Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={page === 1}
            title="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          
          {/* Previous Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            title="Previous page"
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {/* Page Numbers */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {totalPages <= 7 ? (
              // Show all pages if 7 or fewer
              [...Array(totalPages)].map((_, i) => (
                <Button
                  key={i + 1}
                  variant={page === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(i + 1)}
                  className="min-w-[40px]"
                >
                  {i + 1}
                </Button>
              ))
            ) : (
              // Show condensed pagination for more than 7 pages
              <>
                {/* Always show first page */}
                <Button
                  variant={page === 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  className="min-w-[40px]"
                >
                  1
                </Button>
                
                {/* Show ellipsis if current page is far from start */}
                {page > 4 && <span className="px-2 text-muted-foreground">...</span>}
                
                {/* Show pages around current page */}
                {[...Array(5)].map((_, i) => {
                  const pageNum = page - 2 + i;
                  if (pageNum <= 1 || pageNum >= totalPages) return null;
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="min-w-[40px]"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                {/* Show ellipsis if current page is far from end */}
                {page < totalPages - 3 && <span className="px-2 text-muted-foreground">...</span>}
                
                {/* Always show last page */}
                <Button
                  variant={page === totalPages ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  className="min-w-[40px]"
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>

          {/* Next Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            title="Next page"
            className="gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          {/* Last Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={page === totalPages}
            title="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Page Info */}
      {total > 0 && (
        <div className="text-center mt-4 text-sm text-muted-foreground">
          Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)} to {Math.min(page * PAGE_SIZE, total)} of {total} servers
        </div>
      )}

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