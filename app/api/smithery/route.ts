import { NextRequest, NextResponse } from "next/server";

// GET All verified and deployed servers from Smithery registry
export async function GET(request: NextRequest) {
  const apiKey = process.env.SMITHERY_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key is not set' }, { status: 500 });
  }

  // Get pagination parameters from query string
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '100', 10);
  const search = searchParams.get('search') || '';

  // Build query parameters
  const queryParams = new URLSearchParams({
    'q': search ? `is:verified is:deployed ${search}` : 'is:verified is:deployed',
    'page': page.toString(),
    'pageSize': Math.min(pageSize, 100).toString(), // Cap at 100 to avoid API limits
  });

  // Fetch servers from Smithery registry
  const response = await fetch(
    `https://registry.smithery.ai/servers?${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    }
  );

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to fetch servers' }, { status: 500 });
  }

  const data = await response.json();

  // Debug: Log the actual structure we're getting from Smithery
  console.log('Smithery API Response Structure:', {
    keys: Object.keys(data),
    hasServers: !!data.servers,
    hasPagination: !!data.pagination,
    pagination: data.pagination,
    serversLength: data.servers ? data.servers.length : 'N/A'
  });

  // Parse the Smithery API response according to their documented format
  let servers = [];
  let total = 0;
  
  if (data.servers && Array.isArray(data.servers)) {
    servers = data.servers;
    
    // Check for pagination object first (documented format)
    if (data.pagination && data.pagination.totalCount) {
      total = data.pagination.totalCount;
    } else {
      // Fallback to other possible total count fields
      total = data.total || data.totalCount || data.servers.length;
    }
  } else if (Array.isArray(data)) {
    // Fallback: If data is directly an array
    servers = data;
    total = data.length;
  } else {
    // Final fallback - try to extract from any array property
    const arrayProp = Object.values(data).find(val => Array.isArray(val));
    if (arrayProp) {
      servers = arrayProp as any[];
      total = data.total || data.totalCount || servers.length;
    }
  }



  return NextResponse.json({ 
    servers: {
      servers: servers,
      total: total,
      page: page,
      pageSize: pageSize,
      totalPages: Math.ceil(total / pageSize)
    },
    // Debug: Include raw response structure
    debug: {
      smitheryResponse: {
        keys: Object.keys(data),
        hasServers: !!data.servers,
        hasPagination: !!data.pagination,
        pagination: data.pagination,
        serversCount: data.servers ? data.servers.length : 0
      }
    }
  });
}
