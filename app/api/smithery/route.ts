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
  const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
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

  // Normalize the response structure for frontend
  // Handle different possible response formats from Smithery
  let servers = [];
  let total = 0;
  
  if (Array.isArray(data)) {
    // If data is directly an array
    servers = data;
    total = data.length;
  } else if (data.servers && Array.isArray(data.servers)) {
    // If data has a servers property with array
    servers = data.servers;
    total = data.total || data.totalCount || data.servers.length;
  } else if (data.data && Array.isArray(data.data)) {
    // If data has a data property with array
    servers = data.data;
    total = data.total || data.totalCount || data.data.length;
  } else {
    // Fallback - try to extract from any array property
    const arrayProp = Object.values(data).find(val => Array.isArray(val));
    if (arrayProp) {
      servers = arrayProp as any[];
      total = data.total || data.totalCount || servers.length;
    }
  }

  // If we don't have a proper total count and we're on the first page, 
  // try to get the total by making a request for a larger page size
  if (total === servers.length && page === 1 && servers.length === pageSize) {
    try {
      const countQueryParams = new URLSearchParams({
        'q': search ? `is:verified is:deployed ${search}` : 'is:verified is:deployed',
        'page': '1',
        'pageSize': '1000', // Request a large number to get total count
      });

      const countResponse = await fetch(
        `https://registry.smithery.ai/servers?${countQueryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          }
        }
      );

      if (countResponse.ok) {
        const countData = await countResponse.json();
        let countServers = [];
        
        if (Array.isArray(countData)) {
          countServers = countData;
        } else if (countData.servers && Array.isArray(countData.servers)) {
          countServers = countData.servers;
          if (countData.total || countData.totalCount) {
            total = countData.total || countData.totalCount;
          } else {
            total = countServers.length;
          }
        } else if (countData.data && Array.isArray(countData.data)) {
          countServers = countData.data;
          if (countData.total || countData.totalCount) {
            total = countData.total || countData.totalCount;
          } else {
            total = countServers.length;
          }
        } else {
          const arrayProp = Object.values(countData).find(val => Array.isArray(val));
          if (arrayProp) {
            countServers = arrayProp as any[];
            total = countData.total || countData.totalCount || countServers.length;
          }
        }
      }
    } catch (error) {
      // If count request fails, fall back to using the current page data
      console.error('Failed to get total count:', error);
    }
  }

  return NextResponse.json({ 
    servers: {
      servers: servers,
      total: total,
      page: page,
      pageSize: pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  });
}
