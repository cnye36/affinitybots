import { NextRequest, NextResponse } from "next/server";

// GET All verified and deployed servers from Smithery registry
export async function GET(request: NextRequest) {
  const apiKey = process.env.SMITHERY_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key is not set' }, { status: 500 });
  }

  // Fetch all servers from Smithery registry
  const response = await fetch(
    "https://registry.smithery.ai/servers?q=is:verified&is:deployed&pageSize=100",
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
