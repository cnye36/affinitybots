"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [allServers, setAllServers] = useState<any[]>([]);
  const [logos, setLogos] = useState<Record<string, string>>({});
  const [userServers, setUserServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [allRes, userRes] = await Promise.all([
        // Fetch all servers at once with a large page size
        fetch(`/api/smithery?pageSize=200`).then((r) => r.json()),
        fetch("/api/user-mcp-servers").then((r) => r.json()),
      ]);
      const serverList = allRes?.servers?.servers || [];
      setAllServers(serverList);
      setUserServers(userRes.servers || []);
      setLoading(false);

      // Load cached logos immediately for all servers
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
      setLogos(cachedLogos);

      // Fetch missing logos in background using bulk endpoint
      if (serversNeedingLogos.length > 0) {
        const newLogos: Record<string, string> = { ...cachedLogos };
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
        setLogos(newLogos);
        setLogoCache(newCache);
      }
    }
    fetchData();
  }, []); // Only fetch once when component mounts

  // Calculate pagination values
  const total = allServers.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const currentPageServers = allServers.slice(startIndex, endIndex);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {currentPageServers.map((server: any) => (
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
      <div className="flex justify-center items-center gap-4 mt-8">
        <Button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span>
          Page {page} of {totalPages}
        </span>
        <Button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
} 