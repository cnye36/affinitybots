import { NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { registerSchedule } from '@/lib/scheduler/scheduler';

/**
 * POST /api/scheduler/register
 * Register or update a workflow schedule
 * 
 * Body:
 * {
 *   triggerId: string;
 *   workflowId: string;
 *   cronExpression: string;
 *   timezone?: string;
 *   enabled?: boolean;
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
    const { triggerId, workflowId, cronExpression, timezone, enabled } = body;

    if (!triggerId || !workflowId || !cronExpression) {
      return NextResponse.json(
        { error: 'Missing required fields: triggerId, workflowId, cronExpression' },
        { status: 400 }
      );
    }

    // Verify workflow ownership
    const { data: workflow } = await supabase
      .from('workflows')
      .select('owner_id')
      .eq('workflow_id', workflowId)
      .single();

    if (!workflow || workflow.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Workflow not found or access denied' },
        { status: 404 }
      );
    }

    // Verify trigger belongs to this workflow
    const { data: trigger } = await supabase
      .from('workflow_triggers')
      .select('trigger_id, trigger_type')
      .eq('trigger_id', triggerId)
      .eq('workflow_id', workflowId)
      .single();

    if (!trigger) {
      return NextResponse.json(
        { error: 'Trigger not found' },
        { status: 404 }
      );
    }

    if (trigger.trigger_type !== 'schedule') {
      return NextResponse.json(
        { error: 'Trigger is not a schedule type' },
        { status: 400 }
      );
    }

    // Register the schedule
    await registerSchedule({
      triggerId,
      workflowId,
      cronExpression,
      timezone,
      enabled,
    });

    return NextResponse.json({
      success: true,
      message: 'Schedule registered successfully',
    });
  } catch (error) {
    console.error('Failed to register schedule:', error);
    return NextResponse.json(
      { error: 'Failed to register schedule', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

