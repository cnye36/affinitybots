"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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

export default function ToolsPage() {
  const [servers, setServers] = useState<any[]>([]);
  const [logos, setLogos] = useState<Record<string, string>>({});
  const [userServers, setUserServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

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
      const [serverList, userRes] = await Promise.all([
        fetchServers(page, debouncedSearch),
        fetch("/api/user-mcp-servers").then((r) => r.json()),
      ]);
      setUserServers(userRes.servers || []);
      setLoading(false);

      // Load cached logos immediately for current servers
      loadLogosForServers(serverList);
    }
    fetchData();
  }, []); // Only fetch once when component mounts for user servers

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

  // Helper to truncate description to 30 words
  const truncateDescription = (description: string, maxWords: number = 30): string => {
    if (!description) return "No description provided.";
    
    const words = description.split(' ');
    if (words.length <= maxWords) {
      return description;
    }
    
    return words.slice(0, maxWords).join(' ') + '...';
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-8 text-center">Tools</h1>
      
      {/* Search Bar */}
      <div className="mb-8 max-w-md mx-auto">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {servers.map((server: any) => (
          <Link 
            key={server.qualifiedName || server.id} 
            href={`/tools/${encodeURIComponent(server.qualifiedName)}`}
            className="block transition-transform hover:scale-105"
          >
            <Card className="flex flex-col h-full shadow-lg border border-muted hover:shadow-xl cursor-pointer">
              <CardHeader className="flex flex-col items-center pb-2">
                {logos[server.qualifiedName] ? (
                  <div className="mb-2">
                    <Image
                      src={logos[server.qualifiedName]}
                      alt={server.displayName || server.qualifiedName}
                      width={48}
                      height={48}
                      className="rounded-full bg-white border"
                    />
                  </div>
                ) : (
                  <div className="mb-2 w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl">
                    🛠️
                  </div>
                )}
                <CardTitle className="text-center text-lg font-semibold">
                  {server.displayName || server.qualifiedName}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 justify-between">
                <div className="mb-4 text-sm text-muted-foreground min-h-[48px]">
                  {truncateDescription(server.description)}
                </div>
                <div className="mt-auto flex justify-center">
                  {isConfigured(server.qualifiedName) ? (
                    <Button variant="secondary" onClick={(e) => e.preventDefault()}>
                      View & Configure
                    </Button>
                  ) : (
                    <Button onClick={(e) => e.preventDefault()}>
                      Configure & Connect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      
      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
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
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-2">
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
                {page > 4 && <span className="px-2">...</span>}
                
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
                {page < totalPages - 3 && <span className="px-2">...</span>}
                
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
    </div>
  );
} 