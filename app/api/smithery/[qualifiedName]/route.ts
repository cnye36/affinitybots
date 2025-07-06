import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: { qualifiedName: string } }) {
  const apiKey = process.env.SMITHERY_API_KEY;
  const { qualifiedName } = params;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key is not set' }, { status: 500 });
  }

  if (!qualifiedName) {
    return NextResponse.json({ error: 'Qualified name is required' }, { status: 400 });
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
  return NextResponse.json({ server: data });
}
