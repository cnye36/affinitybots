import { NextRequest, NextResponse } from "next/server";
import { rateLimiter } from "@/lib/rateLimiting";
import { requireAdmin } from "@/lib/admin/requireAdmin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { error: admin.error },
        { status: admin.status }
      );
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    
    switch (action) {
      case 'all-users':
        const allUsage = await rateLimiter.getAllUsersUsage();
        return NextResponse.json({
          success: true,
          data: allUsage,
        });
        
      case 'cleanup':
        const daysToKeep = parseInt(searchParams.get('days') || '7');
        const deletedCount = await rateLimiter.cleanupOldRecords(daysToKeep);
        return NextResponse.json({
          success: true,
          data: { deletedCount },
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "all-users" or "cleanup"' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin rate limit API error:', error);
    return NextResponse.json(
      { error: 'Failed to process admin request' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { error: admin.error },
        { status: admin.status }
      );
    }

    const body = await req.json();
    const { action, userId, date } = body;
    
    switch (action) {
      case 'reset-user':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId is required for reset action' },
            { status: 400 }
          );
        }
        
        await rateLimiter.resetUserUsage(userId, date);
        return NextResponse.json({
          success: true,
          message: `Usage reset for user ${userId}`,
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "reset-user"' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin rate limit API error:', error);
    return NextResponse.json(
      { error: 'Failed to process admin request' },
      { status: 500 }
    );
  }
}
