#!/usr/bin/env node
/**
 * Standalone Scheduler Worker Process
 * 
 * This script runs the BullMQ worker that executes scheduled workflows.
 * It should be run as a separate long-running process, either:
 * - As a separate Docker container
 * - As a background service on your server
 * - As a separate process in development
 * 
 * Usage:
 *   pnpm run schedule:worker
 *   or
 *   node scripts/schedule-worker.js
 */

// Load environment variables from .env file
import { config } from 'dotenv';
config();

import { startSchedulerWorker } from '../lib/scheduler/worker.js';
import { syncSchedulesFromDatabase } from '../lib/scheduler/scheduler.js';
import { getSupabaseAdmin } from '../lib/supabase-admin.js';

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 Starting Workflow Scheduler Worker');
  console.log('='.repeat(60));
  console.log('');
  console.log('Environment:');
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Redis: ${process.env.REDIS_URL || process.env.REDIS_URI || 'default'}`);
  console.log(`  App URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`);
  console.log('');

  try {
    // Start the worker
    const worker = startSchedulerWorker();

    // Sync existing schedules from database on startup
    console.log('🔄 Syncing schedules from database...');
    const supabaseAdmin = getSupabaseAdmin();
    await syncSchedulesFromDatabase(supabaseAdmin);

    console.log('');
    console.log('✅ Worker is now running and processing scheduled workflows');
    console.log('Press Ctrl+C to gracefully shutdown');
    console.log('='.repeat(60));
    console.log('');

    // Keep process alive
    await new Promise(() => {});
  } catch (error) {
    console.error('❌ Failed to start worker:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the worker
main();

