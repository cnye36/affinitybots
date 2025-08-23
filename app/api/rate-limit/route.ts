import { NextRequest, NextResponse } from "next/server";
import { rateLimiter } from "@/lib/rateLimiting";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    const usage = await rateLimiter.getUserUsage(userId);
    
    return NextResponse.json({
      success: true,
      data: usage,
    });
  } catch (error) {
    console.error('Rate limit API error:', error);
    return NextResponse.json(
      { error: 'Failed to get usage information' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, inputTokens, outputTokens, model, sessionId } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Check rate limit
    const rateLimitResult = await rateLimiter.checkRateLimit(
      userId,
      inputTokens || 0,
      outputTokens || 0
    );

    return NextResponse.json({
      success: true,
      data: rateLimitResult,
    });
  } catch (error) {
    console.error('Rate limit check error:', error);
    return NextResponse.json(
      { error: 'Failed to check rate limit' },
      { status: 500 }
    );
  }
}
