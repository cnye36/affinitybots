import { NextRequest, NextResponse } from "next/server";

// Simple in-memory cache for server details
const serverCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_DURATION;
};

export async function GET(request: NextRequest, { params }: { params: { qualifiedName: string } }) {
  const apiKey = process.env.SMITHERY_API_KEY;
  const { qualifiedName } = params;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key is not set' }, { status: 500 });
  }

  if (!qualifiedName) {
    return NextResponse.json({ error: 'Qualified name is required' }, { status: 400 });
  }

  // Check cache first
  const cached = serverCache.get(qualifiedName);
  if (cached && isCacheValid(cached.timestamp)) {
    return NextResponse.json({ server: cached.data });
  }

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

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to fetch server data' }, { status: 500 });
  }

  const data = await response.json();
  
  // Cache the result
  serverCache.set(qualifiedName, {
    data: data,
    timestamp: Date.now()
  });

  return NextResponse.json({ server: data });
}
