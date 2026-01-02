import { Queue, QueueOptions } from 'bullmq';
import Redis from 'ioredis';
import { getRedisUrl } from '@/lib/redis';
import { createClient } from '@/supabase/server';

/**
 * Workflow Scheduler Service using BullMQ
 * 
 * This service manages scheduled workflow executions using BullMQ for reliable,
 * distributed job scheduling. It shares the same Redis instance as LangGraph
 * but uses a unique namespace prefix: "bull:scheduler:"
 */

export interface ScheduleConfig {
  triggerId: string;
  workflowId: string;
  cronExpression: string;
  timezone?: string;
  enabled?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ScheduleJob {
  triggerId: string;
  workflowId: string;
  scheduledAt: Date;
  metadata?: Record<string, unknown>;
}

const QUEUE_NAME = 'workflow-schedules';
const QUEUE_PREFIX = 'bull:scheduler'; // Namespace isolation

// Singleton queue instance
let queueInstance: Queue<ScheduleJob> | null = null;

/**
 * Get or create the BullMQ queue instance
 */
export function getSchedulerQueue(): Queue<ScheduleJob> {
  if (queueInstance) {
    return queueInstance;
  }

  // Create Redis connection using ioredis URL parsing (handles Upstash TLS & auth)
  const redisConnection = new Redis(getRedisUrl(), {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    enableOfflineQueue: false,
  });

  const queueOptions: QueueOptions = {
    connection: redisConnection,
    prefix: QUEUE_PREFIX,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // Start with 5 seconds
      },
      removeOnComplete: {
        age: 7 * 24 * 3600, // Keep completed jobs for 7 days
        count: 1000, // Keep last 1000 completed jobs
      },
      removeOnFail: {
        age: 30 * 24 * 3600, // Keep failed jobs for 30 days
      },
    },
  };

  queueInstance = new Queue<ScheduleJob>(QUEUE_NAME, queueOptions);

  queueInstance.on('error', (error) => {
    console.error('❌ Scheduler queue error:', error);
  });

  console.log('✅ Scheduler queue initialized');

  return queueInstance;
}

/**
 * Register or update a workflow schedule
 */
export async function registerSchedule(config: ScheduleConfig): Promise<void> {
  const queue = getSchedulerQueue();
  const jobId = `schedule:${config.triggerId}`;

  try {
    // BullMQ will validate the cron expression when adding the job
    const nextRun = new Date(Date.now() + 60000); // Placeholder: 1 minute from now

    // Remove existing job if any
    const existingJob = await queue.getJob(jobId);
    if (existingJob) {
      await existingJob.remove();
    }

    // Create new repeatable job
    await queue.add(
      'execute-workflow',
      {
        triggerId: config.triggerId,
        workflowId: config.workflowId,
        scheduledAt: nextRun,
        metadata: config.metadata,
      },
      {
        jobId,
        repeat: {
          pattern: config.cronExpression,
          tz: config.timezone || 'UTC',
        },
      }
    );

    // Update next_run_at in database
    const supabase = await createClient();
    await supabase
      .from('workflow_triggers')
      .update({
        next_run_at: nextRun.toISOString(),
        schedule_enabled: config.enabled !== false,
        schedule_metadata: {
          timezone: config.timezone || 'UTC',
          cron: config.cronExpression,
          registered_at: new Date().toISOString(),
          ...(config.metadata || {}),
        },
      })
      .eq('trigger_id', config.triggerId);

    console.log(`✅ Schedule registered for trigger ${config.triggerId}:`, {
      cron: config.cronExpression,
      nextRun: nextRun.toISOString(),
      timezone: config.timezone || 'UTC',
    });
  } catch (error) {
    console.error(`❌ Failed to register schedule for trigger ${config.triggerId}:`, error);
    throw error;
  }
}

/**
 * Unregister a workflow schedule
 */
export async function unregisterSchedule(triggerId: string): Promise<void> {
  const queue = getSchedulerQueue();
  const jobId = `schedule:${triggerId}`;

  try {
    const job = await queue.getJob(jobId);
    if (job) {
      await job.remove();
      console.log(`✅ Schedule unregistered for trigger ${triggerId}`);
    }

    // Update database
    const supabase = await createClient();
    await supabase
      .from('workflow_triggers')
      .update({
        next_run_at: null,
        schedule_enabled: false,
        schedule_metadata: {
          unregistered_at: new Date().toISOString(),
        },
      })
      .eq('trigger_id', triggerId);
  } catch (error) {
    console.error(`❌ Failed to unregister schedule for trigger ${triggerId}:`, error);
    throw error;
  }
}

/**
 * Pause a workflow schedule without removing it
 */
export async function pauseSchedule(triggerId: string): Promise<void> {
  const queue = getSchedulerQueue();
  const jobId = `schedule:${triggerId}`;

  try {
    const job = await queue.getJob(jobId);
    if (job) {
      // Remove the repeatable job but keep execution history
      await job.remove();
    }

    // Update database
    const supabase = await createClient();
    await supabase
      .from('workflow_triggers')
      .update({
        schedule_enabled: false,
        schedule_metadata: {
          paused_at: new Date().toISOString(),
        },
      })
      .eq('trigger_id', triggerId);

    console.log(`⏸️ Schedule paused for trigger ${triggerId}`);
  } catch (error) {
    console.error(`❌ Failed to pause schedule for trigger ${triggerId}:`, error);
    throw error;
  }
}

/**
 * Resume a paused workflow schedule
 */
export async function resumeSchedule(triggerId: string): Promise<void> {
  try {
    // Fetch trigger config from database
    const supabase = await createClient();
    const { data: trigger } = await supabase
      .from('workflow_triggers')
      .select('trigger_id, workflow_id, config')
      .eq('trigger_id', triggerId)
      .single();

    if (!trigger) {
      throw new Error(`Trigger ${triggerId} not found`);
    }

    const config = trigger.config as any;
    if (!config?.cron) {
      throw new Error(`No cron expression found for trigger ${triggerId}`);
    }

    // Re-register the schedule
    await registerSchedule({
      triggerId: trigger.trigger_id,
      workflowId: trigger.workflow_id,
      cronExpression: config.cron,
      timezone: config.timezone,
      enabled: true,
    });

    console.log(`▶️ Schedule resumed for trigger ${triggerId}`);
  } catch (error) {
    console.error(`❌ Failed to resume schedule for trigger ${triggerId}:`, error);
    throw error;
  }
}

/**
 * Get all active schedules
 */
export async function listSchedules(): Promise<Array<{ triggerId: string; nextRun: Date | null }>> {
  const queue = getSchedulerQueue();

  try {
    const repeatableJobs = await queue.getRepeatableJobs();

    return repeatableJobs.map((job) => ({
      triggerId: job.id?.replace('schedule:', '') || '',
      nextRun: job.next ? new Date(job.next) : null,
    }));
  } catch (error) {
    console.error('❌ Failed to list schedules:', error);
    return [];
  }
}

/**
 * Get schedule info for a specific trigger
 */
export async function getScheduleInfo(triggerId: string): Promise<{
  exists: boolean;
  nextRun: Date | null;
  jobData?: ScheduleJob;
} | null> {
  const queue = getSchedulerQueue();
  const jobId = `schedule:${triggerId}`;

  try {
    const job = await queue.getJob(jobId);
    if (!job) {
      return { exists: false, nextRun: null };
    }

    return {
      exists: true,
      nextRun: job.timestamp ? new Date(job.timestamp) : null,
      jobData: job.data,
    };
  } catch (error) {
    console.error(`❌ Failed to get schedule info for trigger ${triggerId}:`, error);
    return null;
  }
}

/**
 * Sync all schedules from database to BullMQ
 * Useful for recovering after crashes or deploying new workers
 */
export async function syncSchedulesFromDatabase(supabaseClient?: any): Promise<void> {
  try {
    const supabase = supabaseClient || await createClient();
    
    // Get all active scheduled triggers for active workflows
    const { data: triggers, error } = await supabase
      .from('workflow_triggers')
      .select('trigger_id, workflow_id, config, schedule_enabled, workflows!inner(is_active)')
      .eq('trigger_type', 'schedule')
      .eq('workflows.is_active', true);

    if (error) throw error;

    console.log(`🔄 Syncing ${triggers?.length || 0} schedules from database...`);

    for (const trigger of triggers || []) {
      const config = trigger.config as any;
      if (!config?.cron) {
        console.warn(`⚠️ Skipping trigger ${trigger.trigger_id}: no cron expression`);
        continue;
      }

      if (trigger.schedule_enabled === false) {
        // Ensure paused schedules are not in queue
        await unregisterSchedule(trigger.trigger_id);
        continue;
      }

      try {
        await registerSchedule({
          triggerId: trigger.trigger_id,
          workflowId: trigger.workflow_id,
          cronExpression: config.cron,
          timezone: config.timezone,
          enabled: true,
        });
      } catch (error) {
        console.error(`❌ Failed to sync trigger ${trigger.trigger_id}:`, error);
      }
    }

    console.log('✅ Schedule sync complete');
  } catch (error) {
    console.error('❌ Failed to sync schedules from database:', error);
    throw error;
  }
}

/**
 * Gracefully close the scheduler queue
 */
export async function closeScheduler(): Promise<void> {
  if (queueInstance) {
    await queueInstance.close();
    queueInstance = null;
    console.log('🔌 Scheduler queue closed');
  }
}

