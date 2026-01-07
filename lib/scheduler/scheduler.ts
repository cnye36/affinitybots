import { Queue, QueueOptions } from 'bullmq';
import Redis from 'ioredis';
import { CronExpressionParser } from 'cron-parser';
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
 * Calculate the next run time for a cron expression
 */
function calculateNextRun(cronExpression: string, timezone: string = 'UTC'): Date {
	try {
		const expression = CronExpressionParser.parse(cronExpression, {
			tz: timezone,
			currentDate: new Date(),
		});
		return expression.next().toDate();
	} catch (error) {
		console.error(`Failed to parse cron expression "${cronExpression}":`, error);
		throw new Error(`Invalid cron expression: ${cronExpression}`);
	}
}

/**
 * Get or create the BullMQ queue instance
 */
export function getSchedulerQueue(): Queue<ScheduleJob> {
  if (queueInstance) {
    return queueInstance;
  }

	// Create Redis connection using ioredis URL parsing (handles Self-hosted TLS & auth)
	const redisConnection = new Redis(getRedisUrl(), {
		maxRetriesPerRequest: null, // Required by BullMQ
		enableReadyCheck: false,
		enableOfflineQueue: true, // Allow recovery from Redis hiccups
		retryStrategy(times) {
			const delay = Math.min(times * 100, 3000);
			return delay;
		},
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
 * @param config - Schedule configuration
 * @param supabaseClient - Optional Supabase client (uses admin client if not provided)
 */
export async function registerSchedule(config: ScheduleConfig, supabaseClient?: any): Promise<void> {
	const queue = getSchedulerQueue();
	const jobId = `schedule:${config.triggerId}`;

	try {
		const timezone = config.timezone || 'UTC';
		
		// Calculate actual next run time from cron expression
		const nextRun = calculateNextRun(config.cronExpression, timezone);

		// Remove existing repeatable job if any (proper way for repeatables)
		const repeatableJobs = await queue.getRepeatableJobs();
		const existingRepeatable = repeatableJobs.find((job) => job.id === jobId || job.key?.includes(config.triggerId));
		
		if (existingRepeatable) {
			await queue.removeRepeatableByKey(existingRepeatable.key);
			console.log(`🗑️ Removed existing repeatable job for trigger ${config.triggerId}`);
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
					tz: timezone,
				},
			}
		);

		// Update next_run_at in database with real calculated time
		const supabase = supabaseClient || await createClient();
		await supabase
			.from('workflow_triggers')
			.update({
				next_run_at: nextRun.toISOString(),
				schedule_enabled: config.enabled !== false,
				schedule_metadata: {
					timezone: timezone,
					cron: config.cronExpression,
					registered_at: new Date().toISOString(),
					...(config.metadata || {}),
				},
			})
			.eq('trigger_id', config.triggerId);

		console.log(`✅ Schedule registered for trigger ${config.triggerId}:`, {
			cron: config.cronExpression,
			nextRun: nextRun.toISOString(),
			timezone: timezone,
		});
	} catch (error) {
		console.error(`❌ Failed to register schedule for trigger ${config.triggerId}:`, error);
		throw error;
	}
}

/**
 * Unregister a workflow schedule completely
 * This removes the repeatable job from BullMQ and clears schedule data from DB
 * @param triggerId - Trigger ID to unregister
 * @param supabaseClient - Optional Supabase client (uses admin client if not provided)
 */
export async function unregisterSchedule(triggerId: string, supabaseClient?: any): Promise<void> {
	const queue = getSchedulerQueue();
	const jobId = `schedule:${triggerId}`;

	try {
		// Remove repeatable job properly
		const repeatableJobs = await queue.getRepeatableJobs();
		const existingRepeatable = repeatableJobs.find((job) => job.id === jobId || job.key?.includes(triggerId));
		
		if (existingRepeatable) {
			await queue.removeRepeatableByKey(existingRepeatable.key);
			console.log(`✅ Schedule unregistered for trigger ${triggerId}`);
		}

		// Update database - clear schedule data completely
		const supabase = supabaseClient || await createClient();
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
 * Pause a workflow schedule without removing config
 * This stops execution but keeps the schedule metadata for easy resumption
 * @param triggerId - Trigger ID to pause
 * @param supabaseClient - Optional Supabase client (uses admin client if not provided)
 */
export async function pauseSchedule(triggerId: string, supabaseClient?: any): Promise<void> {
	const queue = getSchedulerQueue();
	const jobId = `schedule:${triggerId}`;

	try {
		// Remove repeatable job properly
		const repeatableJobs = await queue.getRepeatableJobs();
		const existingRepeatable = repeatableJobs.find((job) => job.id === jobId || job.key?.includes(triggerId));
		
		if (existingRepeatable) {
			await queue.removeRepeatableByKey(existingRepeatable.key);
		}

		// Update database - preserve schedule metadata for resumption
		const supabase = supabaseClient || await createClient();
		const { data: trigger } = await supabase
			.from('workflow_triggers')
			.select('schedule_metadata')
			.eq('trigger_id', triggerId)
			.single();

		const existingMetadata = (trigger?.schedule_metadata as Record<string, unknown>) || {};

		await supabase
			.from('workflow_triggers')
			.update({
				schedule_enabled: false,
				schedule_metadata: {
					...existingMetadata,
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
 * @param triggerId - Trigger ID to resume
 * @param supabaseClient - Optional Supabase client (uses admin client if not provided)
 */
export async function resumeSchedule(triggerId: string, supabaseClient?: any): Promise<void> {
	try {
		// Fetch trigger config from database
		const supabase = supabaseClient || await createClient();
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
		}, supabase);

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
 * 
 * IMPORTANT: This should only be called ONCE on worker startup to avoid Redis storms
 */
export async function syncSchedulesFromDatabase(supabaseClient?: any): Promise<void> {
	try {
		const supabase = supabaseClient || await createClient();
		const queue = getSchedulerQueue();
		
		// Get all active scheduled triggers for active workflows
		const { data: triggers, error } = await supabase
			.from('workflow_triggers')
			.select('trigger_id, workflow_id, config, schedule_enabled, workflows!inner(is_active)')
			.eq('trigger_type', 'schedule')
			.eq('workflows.is_active', true);

		if (error) throw error;

		console.log(`🔄 Syncing ${triggers?.length || 0} schedules from database...`);

		// Get existing repeatables to avoid unnecessary removes/adds
		const existingRepeatables = await queue.getRepeatableJobs();
		const existingMap = new Map(
			existingRepeatables.map((job) => [
				job.id || job.name,
				{ pattern: job.pattern, tz: job.tz, key: job.key }
			])
		);

		for (const trigger of triggers || []) {
			const config = trigger.config as any;
			if (!config?.cron) {
				console.warn(`⚠️ Skipping trigger ${trigger.trigger_id}: no cron expression`);
				continue;
			}

			const jobId = `schedule:${trigger.trigger_id}`;
			const timezone = config.timezone || 'UTC';

			if (trigger.schedule_enabled === false) {
				// Ensure paused schedules are not in queue
				const existing = existingMap.get(jobId);
				if (existing) {
					await queue.removeRepeatableByKey(existing.key);
					console.log(`⏸️ Removed paused schedule: ${trigger.trigger_id}`);
				}
				continue;
			}

			// Check if repeatable already exists with same config
			const existing = existingMap.get(jobId);
			const needsUpdate = !existing || 
				existing.pattern !== config.cron || 
				existing.tz !== timezone;

			if (!needsUpdate) {
				console.log(`⏭️ Schedule already up-to-date: ${trigger.trigger_id}`);
				continue;
			}

			try {
				// Only register if config changed or doesn't exist
				await registerSchedule({
					triggerId: trigger.trigger_id,
					workflowId: trigger.workflow_id,
					cronExpression: config.cron,
					timezone: timezone,
					enabled: true,
				}, supabase);
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

