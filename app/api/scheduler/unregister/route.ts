import { NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { unregisterSchedule } from '@/lib/scheduler/scheduler';

/**
 * POST /api/scheduler/unregister
 * Unregister a workflow schedule
 * 
 * Body:
 * {
 *   triggerId: string;
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
    const { triggerId } = body;

    if (!triggerId) {
      return NextResponse.json(
        { error: 'Missing required field: triggerId' },
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

    // Unregister the schedule
    await unregisterSchedule(triggerId);

    return NextResponse.json({
      success: true,
      message: 'Schedule unregistered successfully',
    });
  } catch (error) {
    console.error('Failed to unregister schedule:', error);
    return NextResponse.json(
      { error: 'Failed to unregister schedule', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

