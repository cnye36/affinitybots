import { NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { pauseSchedule, resumeSchedule } from '@/lib/scheduler/scheduler';

/**
 * POST /api/scheduler/pause
 * Pause or resume a workflow schedule
 * 
 * Body:
 * {
 *   triggerId: string;
 *   action: 'pause' | 'resume';
 * }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { triggerId, action } = body;

    if (!triggerId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: triggerId, action' },
        { status: 400 }
      );
    }

    if (action !== 'pause' && action !== 'resume') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "pause" or "resume"' },
        { status: 400 }
      );
    }

    // Verify trigger belongs to user's workflow
    const { data: trigger } = await supabase
      .from('workflow_triggers')
      .select('trigger_id, workflow_id, workflows!inner(owner_id)')
      .eq('trigger_id', triggerId)
      .single();

    if (!trigger || (trigger.workflows as any).owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Trigger not found or access denied' },
        { status: 404 }
      );
    }

    // Pause or resume the schedule
    if (action === 'pause') {
      await pauseSchedule(triggerId);
    } else {
      await resumeSchedule(triggerId);
    }

    return NextResponse.json({
      success: true,
      message: `Schedule ${action}d successfully`,
    });
  } catch (error) {
    console.error(`Failed to ${(await request.json()).action} schedule:`, error);
    return NextResponse.json(
      { error: `Failed to modify schedule`, details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

