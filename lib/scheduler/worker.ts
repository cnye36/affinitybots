import { Worker, Job, WorkerOptions } from 'bullmq';
import Redis from 'ioredis';
import { getRedisUrl } from '@/lib/redis';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import type { ScheduleJob } from './scheduler';

/**
 * BullMQ Worker for executing scheduled workflows
 * 
 * This worker process listens to the scheduler queue and executes workflows
 * when their scheduled time arrives. It runs as a separate process from the
 * Next.js application for reliability and scalability.
 */

const QUEUE_NAME = 'workflow-schedules';
const QUEUE_PREFIX = 'bull:scheduler';

// Singleton worker instance
let workerInstance: Worker<ScheduleJob> | null = null;

/**
 * Execute a scheduled workflow
 */
async function executeScheduledWorkflow(job: Job<ScheduleJob>): Promise<void> {
  const { triggerId, workflowId, scheduledAt, metadata } = job.data;
  const executionStart = Date.now();
  
  // Convert scheduledAt to Date if it's a string (BullMQ serializes dates)
  const scheduledAtDate = scheduledAt instanceof Date ? scheduledAt : new Date(scheduledAt);

  console.log(`🚀 Executing scheduled workflow:`, {
    triggerId,
    workflowId,
    scheduledAt: scheduledAtDate,
    attemptNumber: job.attemptsMade + 1,
  });

  try {
    const supabase = getSupabaseAdmin();

    // Verify trigger is still active and enabled
    const { data: trigger } = await supabase
      .from('workflow_triggers')
      .select('trigger_id, workflow_id, is_active, schedule_enabled, config')
      .eq('trigger_id', triggerId)
      .single();

    if (!trigger) {
      console.warn(`⚠️ Trigger ${triggerId} not found, skipping execution`);
      await logExecution({
        triggerId,
        workflowId,
        scheduledAt: scheduledAtDate,
        status: 'skipped',
        error: 'Trigger not found',
        duration: Date.now() - executionStart,
      });
      return;
    }

    if (!trigger.is_active || !trigger.schedule_enabled) {
      console.warn(`⚠️ Trigger ${triggerId} is disabled, skipping execution`);
      await logExecution({
        triggerId,
        workflowId,
        scheduledAt: scheduledAtDate,
        status: 'skipped',
        error: 'Trigger is disabled',
        duration: Date.now() - executionStart,
      });
      return;
    }

    // Get the workflow execution API URL
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    console.log('Using app URL for execution:', appUrl);

    // Execute the workflow via internal API
    const executeUrl = `${appUrl}/api/workflows/${workflowId}/execute`;
    
    const response = await fetch(executeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include internal auth token if needed
        ...(process.env.INTERNAL_API_SECRET && {
          'x-internal-secret': process.env.INTERNAL_API_SECRET,
        }),
      },
      body: JSON.stringify({
        triggerId,
        scheduledExecution: true,
        scheduledAt: scheduledAtDate.toISOString(),
        metadata,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Workflow execution failed: ${response.status} - ${errorText}`);
    }

    // Prefer run id via response header to avoid parsing SSE body
    const headerRunId = response.headers.get('x-workflow-run-id') || undefined;
    let runId = headerRunId;
    if (!runId) {
      // Fallback: try parsing JSON if endpoint ever returns JSON synchronously
      const result = await response.json().catch(() => ({} as any));
      runId = (result as any).run_id || (result as any).runId;
    }

    // Consume SSE stream to completion and extract LangGraph run_id
    let langgraphRunId: string | undefined;
    try {
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let sawError = false;
        let sawDone = false;
        
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          
          // Look for LangGraph run_id in the stream
          const runIdMatch = chunk.match(/run_id["\s]*:["\s]*([a-f0-9-]+)/i);
          if (runIdMatch) {
            langgraphRunId = runIdMatch[1];
            console.log(`🔗 Found LangGraph run_id in stream: ${langgraphRunId}`);
          }
          
          if (chunk.includes('event: error')) {
            sawError = true;
          }
          if (chunk.includes('event: done')) {
            sawDone = true;
          }
        }
        
        if (sawError) {
          throw new Error('Workflow SSE stream reported error');
        }
        if (!sawDone) {
          throw new Error('Workflow SSE stream did not complete properly');
        }
      }
    } catch (e) {
      throw e;
    }
    
    // Use LangGraph run_id if found, otherwise fall back to our workflow_run_id
    const finalRunId = langgraphRunId || runId;
    if (langgraphRunId) {
      console.log(`✅ Using LangGraph run_id: ${langgraphRunId}`);
    } else {
      console.log(`⚠️ Using fallback run_id: ${runId}`);
    }

    // Update trigger's last_fired_at (BullMQ manages next_run_at automatically)
    await supabase
      .from('workflow_triggers')
      .update({
        last_fired_at: new Date().toISOString(),
      })
      .eq('trigger_id', triggerId);

    // Log successful execution
    await logExecution({
      triggerId,
      workflowId,
      scheduledAt: scheduledAtDate,
      status: 'success',
      runId: finalRunId,
      duration: Date.now() - executionStart,
      metadata: {
        ...metadata,
        jobId: job.id,
        attemptNumber: job.attemptsMade + 1,
        langgraphRunId: langgraphRunId,
        workflowRunId: runId,
      },
    });

    console.log(`✅ Workflow executed successfully:`, {
      triggerId,
      workflowId,
      runId: finalRunId,
      langgraphRunId: langgraphRunId,
      duration: `${Date.now() - executionStart}ms`,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed to execute scheduled workflow:`, {
      triggerId,
      workflowId,
      error: errorMessage,
      attemptNumber: job.attemptsMade + 1,
    });

    // Log failed execution
    await logExecution({
      triggerId,
      workflowId,
      scheduledAt: scheduledAtDate,
      status: 'failed',
      error: errorMessage,
      duration: Date.now() - executionStart,
      metadata: {
        ...metadata,
        jobId: job.id,
        attemptNumber: job.attemptsMade + 1,
      },
    });

    // Re-throw to trigger BullMQ retry logic
    throw error;
  }
}

/**
 * Log workflow execution to database
 */
async function logExecution(data: {
  triggerId: string;
  workflowId: string;
  scheduledAt: Date;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
  runId?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('workflow_schedule_executions').insert({
      trigger_id: data.triggerId,
      workflow_id: data.workflowId,
      scheduled_at: data.scheduledAt.toISOString(),
      status: data.status,
      error: data.error || null,
      run_id: data.runId || null,
      duration_ms: data.duration || null,
      metadata: data.metadata || {},
    });
  } catch (error) {
    console.error('Failed to log execution:', error);
  }
}

/**
 * Start the scheduler worker
 */
export function startSchedulerWorker(): Worker<ScheduleJob> {
  if (workerInstance) {
    console.log('⚠️ Worker already running');
    return workerInstance;
  }

  // Create Redis connection using ioredis URL parsing (handles Upstash TLS & auth)
  const redisConnection = new Redis(getRedisUrl(), {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    enableOfflineQueue: false,
  });

  const workerOptions: WorkerOptions = {
    connection: redisConnection,
    prefix: QUEUE_PREFIX,
    concurrency: 5, // Process up to 5 workflows concurrently
    limiter: {
      max: 10, // Max 10 jobs per second
      duration: 1000,
    },
  };

  workerInstance = new Worker<ScheduleJob>(
    QUEUE_NAME,
    executeScheduledWorkflow,
    workerOptions
  );

  // Event handlers
  workerInstance.on('ready', () => {
    console.log('✅ Scheduler worker ready');
  });

  workerInstance.on('active', (job) => {
    console.log(`⚙️ Processing job ${job.id}`);
  });

  workerInstance.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`);
  });

  workerInstance.on('failed', (job, error) => {
    console.error(`❌ Job ${job?.id} failed:`, error.message);
  });

  workerInstance.on('error', (error) => {
    console.error('❌ Worker error:', error);
  });

  workerInstance.on('stalled', (jobId) => {
    console.warn(`⚠️ Job ${jobId} stalled`);
  });

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down worker gracefully...`);
    if (workerInstance) {
      await workerInstance.close();
      workerInstance = null;
    }
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  console.log('🚀 Scheduler worker started');

  return workerInstance;
}

/**
 * Stop the scheduler worker
 */
export async function stopSchedulerWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.close();
    workerInstance = null;
    console.log('🔌 Scheduler worker stopped');
  }
}

/**
 * Get worker instance
 */
export function getWorkerInstance(): Worker<ScheduleJob> | null {
  return workerInstance;
}

