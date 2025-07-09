import { NextRequest, NextResponse } from "next/server";

// Simple in-memory cache for server details
const serverCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_DURATION;
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.SMITHERY_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key is not set' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { qualifiedNames } = body;

    if (!Array.isArray(qualifiedNames)) {
      return NextResponse.json({ error: 'qualifiedNames must be an array' }, { status: 400 });
    }

    const results: Record<string, any> = {};
    const uncachedNames: string[] = [];

    // Check cache for each qualified name
    qualifiedNames.forEach((qualifiedName: string) => {
      const cached = serverCache.get(qualifiedName);
      if (cached && isCacheValid(cached.timestamp)) {
        results[qualifiedName] = cached.data;
      } else {
        uncachedNames.push(qualifiedName);
      }
    });

    // Fetch uncached servers in parallel
    if (uncachedNames.length > 0) {
      const fetchPromises = uncachedNames.map(async (qualifiedName: string) => {
        try {
          const encodedQualifiedName = encodeURIComponent(qualifiedName);
          const response = await fetch(
            `https://registry.smithery.ai/servers/${encodedQualifiedName}`,
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            
            // Cache the result
            serverCache.set(qualifiedName, {
              data: data,
              timestamp: Date.now()
            });

            return { qualifiedName, data };
          } else {
            return { qualifiedName, error: 'Failed to fetch' };
          }
        } catch (error) {
          return { qualifiedName, error: 'Network error' };
        }
      });

      const fetchResults = await Promise.all(fetchPromises);
      
      // Add fetched results to the results object
      fetchResults.forEach(({ qualifiedName, data, error }) => {
        if (data) {
          results[qualifiedName] = data;
        } else {
          results[qualifiedName] = { error };
        }
      });
    }

    return NextResponse.json({ servers: results });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
} 