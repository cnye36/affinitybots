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

  return NextResponse.json({ servers: data });
}
