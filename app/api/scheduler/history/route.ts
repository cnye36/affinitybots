import { NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

/**
 * GET /api/scheduler/history?triggerId=xxx&limit=50
 * Get execution history for a schedule
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const triggerId = searchParams.get('triggerId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!triggerId) {
      return NextResponse.json(
        { error: 'Missing required parameter: triggerId' },
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

    // Fetch execution history
    const { data: executions, error } = await supabase
      .from('workflow_schedule_executions')
      .select('*')
      .eq('trigger_id', triggerId)
      .order('executed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Calculate statistics
    const total = executions?.length || 0;
    const successful = executions?.filter(e => e.status === 'success').length || 0;
    const failed = executions?.filter(e => e.status === 'failed').length || 0;
    const skipped = executions?.filter(e => e.status === 'skipped').length || 0;
    const avgDuration = executions && executions.length > 0
      ? executions.reduce((sum, e) => sum + (e.duration_ms || 0), 0) / executions.length
      : 0;

    return NextResponse.json({
      executions: executions || [],
      stats: {
        total,
        successful,
        failed,
        skipped,
        successRate: total > 0 ? (successful / total) * 100 : 0,
        avgDurationMs: Math.round(avgDuration),
      },
    });
  } catch (error) {
    console.error('Failed to fetch schedule history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

